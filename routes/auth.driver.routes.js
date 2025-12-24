const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const asyncHandler = require("../middleware/asyncHandler");
const runValidation = require("../middleware/runValidation");

const authController = require("../controllers/auth.controller");

// ฟังก์ชัน sanitize เบอร์โทร
const sanitizePhone = (p) => String(p).replace(/\D/g, "");

/* ======================================================
   🚗 Driver Register
====================================================== */
router.post(
  "/register-driver",
  [
    body("name").notEmpty().withMessage("Name is required"),

    body("phone")
      .notEmpty().withMessage("Phone is required")
      .custom((v) => {
        const cleaned = sanitizePhone(v);
        return /^0\d{9}$/.test(cleaned); // เบอร์ไทย 10 หลัก
      })
      .withMessage("Invalid phone number"),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),

    body("vehicleModel").optional().isString(),
    body("vehiclePlate").optional().isString(),
  ],
  runValidation,
  asyncHandler(authController.registerDriver)
);

/* ======================================================
   🔐 Login (Driver & Rider)
====================================================== */
router.post(
  "/login",
  [
    body("phone").notEmpty().withMessage("Phone is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  runValidation,
  asyncHandler(authController.login)
);

module.exports = router;
