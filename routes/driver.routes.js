const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Driver = require("../models/driver.model");
const User = require("../models/user.model");
const driverController = require("../controllers/driver.controller");
const {
  authenticateToken,
  onlyDriver,
} = require("../middleware/auth.middleware");

/* ===================================================
   HELPERS
=================================================== */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

const sanitizePhone = (p) => String(p || "").replace(/\D/g, "");

const generateToken = ({ userId, driverId }) => {
  if (!process.env.JWT_SECRET)
    throw new Error("JWT_SECRET not configured");

  return jwt.sign(
    { userId, driverId, role: "driver" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

/* ===================================================
   🟢 REGISTER DRIVER
=================================================== */
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),

    body("phone")
      .notEmpty()
      .withMessage("Phone is required")
      .custom((v) => /^0\d{9}$/.test(sanitizePhone(v)))
      .withMessage("Invalid phone number"),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),

    body("vehicleType")
      .isIn(["car", "bike"])
      .withMessage("vehicleType must be car or bike"),

    body("vehicle").isObject().withMessage("vehicle is required"),
    body("vehicle.model").notEmpty().withMessage("vehicle.model is required"),
    body("vehicle.color").notEmpty().withMessage("vehicle.color is required"),
    body("vehicle.plate").notEmpty().withMessage("vehicle.plate is required"),
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { name, phone, password, vehicleType, vehicle } = req.body;
    const cleanedPhone = sanitizePhone(phone);

    /* ---------- Duplicate Check ---------- */
    const phoneUsed = await User.findOne({ phone: cleanedPhone });
    if (phoneUsed)
      return res.status(400).json({ error: "เบอร์นี้ถูกใช้งานแล้ว" });

    const plateUsed = await Driver.findOne({ "vehicle.plate": vehicle.plate });
    if (plateUsed)
      return res.status(400).json({ error: "ทะเบียนรถถูกใช้งานแล้ว" });

    /* ---------- Create User ---------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phone: cleanedPhone,
      password: hashedPassword,
      role: "driver",
    });

    /* ---------- Create Driver ---------- */
    const driver = await Driver.create({
      userId: user._id,
      vehicleType,
      vehicle,
      status: "offline",
      isOnline: false,
      isApproved: false, // ต้องผ่าน KYC ก่อน
    });

    return res.status(201).json({
      message: "ลงทะเบียนคนขับสำเร็จ",
      token: generateToken({
        userId: user._id,
        driverId: driver._id,
      }),
      driver,
    });
  })
);

/* ===================================================
   🔐 LOGIN DRIVER
=================================================== */
router.post(
  "/login",
  [
    body("phone").notEmpty().withMessage("Phone is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { phone, password } = req.body;
    const cleanedPhone = sanitizePhone(phone);

    const user = await User.findOne({
      phone: cleanedPhone,
      role: "driver",
    }).select("+password");

    if (!user)
      return res.status(401).json({ error: "หมายเลขหรือรหัสผ่านไม่ถูกต้อง" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "หมายเลขหรือรหัสผ่านไม่ถูกต้อง" });

    const driver = await Driver.findOne({ userId: user._id });
    if (!driver)
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });

    return res.json({
      message: "ล็อกอินสำเร็จ",
      token: generateToken({
        userId: user._id,
        driverId: driver._id,
      }),
      driver,
    });
  })
);

/* ===================================================
   🔐 DRIVER AUTHENTICATED ROUTES
=================================================== */
router.use(authenticateToken, onlyDriver);

/* ---------- Online / Offline ---------- */
router.patch("/online", asyncHandler(driverController.goOnline));
router.patch("/offline", asyncHandler(driverController.goOffline));

/* ---------- Rides ---------- */
router.get(
  "/rides/available",
  asyncHandler(driverController.getAvailableRides)
);

router.patch(
  "/rides/:rideId/accept",
  asyncHandler(driverController.acceptRide)
);

router.patch(
  "/rides/:rideId/arrive",
  asyncHandler(driverController.arriveAtPickup)
);

router.patch(
  "/rides/:rideId/start",
  asyncHandler(driverController.startTrip)
);

router.patch(
  "/rides/:rideId/complete",
  asyncHandler(driverController.completeTrip)
);

/* ---------- Location ---------- */
router.patch(
  "/location",
  asyncHandler(driverController.updateDriverLocation)
);

module.exports = router;
