const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Driver = require("../models/driver.model");
const User = require("../models/user.model");

/* ===================== HELPERS ===================== */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

const sanitizePhone = (p) => String(p || "").replace(/\D/g, "");

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET)
    throw new Error("JWT_SECRET not configured");

  return jwt.sign(
    { userId, role: "driver" },
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
      .notEmpty().withMessage("Phone is required")
      .custom((v) => /^0\d{9}$/.test(sanitizePhone(v)))
      .withMessage("Invalid phone number"),

    body("email").optional().isEmail().withMessage("Invalid email"),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),

    body("vehicle").isObject().withMessage("Vehicle is required"),
    body("vehicle.model").notEmpty(),
    body("vehicle.color").notEmpty(),
    body("vehicle.plate").notEmpty(),
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { name, phone, email, password, vehicle } = req.body;
    const cleanedPhone = sanitizePhone(phone);
    const normalizedEmail = email?.trim().toLowerCase();

    /* check duplicate phone */
    const phoneUsed =
      (await Driver.findOne({ phone: cleanedPhone })) ||
      (await User.findOne({ phone: cleanedPhone }));

    if (phoneUsed)
      return res.status(400).json({ error: "เบอร์นี้ถูกใช้งานแล้ว" });

    /* check duplicate email */
    if (normalizedEmail) {
      const emailUsed =
        (await Driver.findOne({ email: normalizedEmail })) ||
        (await User.findOne({ email: normalizedEmail }));

      if (emailUsed)
        return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    const driver = new Driver({
      name,
      phone: cleanedPhone,
      email: normalizedEmail,
      password, // hash ที่ schema
      vehicle,
      role: "driver",
      status: "inactive",
      isAvailable: false,
    });

    await driver.save();

    return res.status(201).json({
      message: "ลงทะเบียนคนขับสำเร็จ",
      token: generateToken(driver._id),
      driver: driver.toJSON(),
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

    const driver = await Driver.findOne({ phone: cleanedPhone }).select(
      "+password"
    );

    if (!driver)
      return res
        .status(401)
        .json({ error: "หมายเลขหรือรหัสผ่านไม่ถูกต้อง" });

    const match = driver.comparePassword
      ? await driver.comparePassword(password)
      : await bcrypt.compare(password, driver.password);

    if (!match)
      return res
        .status(401)
        .json({ error: "หมายเลขหรือรหัสผ่านไม่ถูกต้อง" });

    driver.lastLogin = new Date();
    await driver.save();

    return res.json({
      message: "ล็อกอินสำเร็จ",
      token: generateToken(driver._id),
      driver: driver.toJSON(),
    });
  })
);

module.exports = router;
