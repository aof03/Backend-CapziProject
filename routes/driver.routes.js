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
  requireDriver,
} = require("../middleware/auth.middleware");

/* ===================================================
   HELPERS
=================================================== */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const sanitizePhone = (p) => String(p || "").replace(/\D/g, "");

/* ===================================================
   TOKEN
=================================================== */
const generateToken = ({ userId, driverId }) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");

  return jwt.sign(
    { userId, driverId, role: "driver" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

/* ===================================================
   REGISTER DRIVER
=================================================== */
router.post(
  "/register",
  [
    body("name").notEmpty(),
    body("phone")
      .notEmpty()
      .custom((v) => /^0\d{9}$/.test(sanitizePhone(v))),
    body("password").isLength({ min: 8 }),
    body("vehicleType").isIn(["car", "bike"]),
    body("vehicle").isObject(),
    body("vehicle.model").notEmpty(),
    body("vehicle.color").notEmpty(),
    body("vehicle.plate").notEmpty(),
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { name, phone, password, vehicleType, vehicle } = req.body;
    const cleaned = sanitizePhone(phone);

    const existsUser = await User.findOne({ phone: cleaned });
    if (existsUser) {
      return res.status(400).json({ error: "Phone already used" });
    }

    const existsPlate = await Driver.findOne({
      "vehicle.plate": vehicle.plate,
    });

    if (existsPlate) {
      return res.status(400).json({ error: "Plate already used" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phone: cleaned,
      password: hashed,
      role: "driver",
    });

    const driver = await Driver.create({
      userId: user._id,
      vehicleType,
      vehicle,
      status: "offline",
      isOnline: false,
      isApproved: false,
    });

    return res.status(201).json({
      message: "Driver registered",
      token: generateToken({
        userId: user._id,
        driverId: driver._id,
      }),
      driver,
    });
  })
);

/* ===================================================
   LOGIN
=================================================== */
router.post(
  "/login",
  [
    body("phone").notEmpty(),
    body("password").notEmpty(),
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { phone, password } = req.body;
    const cleaned = sanitizePhone(phone);

    const user = await User.findOne({
      phone: cleaned,
      role: "driver",
    }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const driver = await Driver.findOne({ userId: user._id });

    return res.json({
      message: "Login success",
      token: generateToken({
        userId: user._id,
        driverId: driver._id,
      }),
      driver,
    });
  })
);

/* ===================================================
   PROTECTED ROUTES
=================================================== */
router.use(authenticateToken, requireDriver);

router.patch("/online", asyncHandler(driverController.goOnline));
router.patch("/offline", asyncHandler(driverController.goOffline));

router.get("/rides/available", asyncHandler(driverController.getAvailableRides));
router.patch("/rides/:rideId/accept", asyncHandler(driverController.acceptRide));
router.patch("/rides/:rideId/arrive", asyncHandler(driverController.arriveAtPickup));
router.patch("/rides/:rideId/start", asyncHandler(driverController.startTrip));
router.patch("/rides/:rideId/complete", asyncHandler(driverController.completeTrip));
router.patch("/location", asyncHandler(driverController.updateDriverLocation));

module.exports = router;