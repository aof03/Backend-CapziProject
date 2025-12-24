// routes/auth.routes.js
const express = require("express");
const router = express.Router();

const riderAuthController = require("../controllers/riderAuth.controller");
const driverAuthController = require("../controllers/driverAuth.controller");
const commonAuthController = require("../controllers/commonAuth.controller");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");

/* ============================================================
   Helper: Run Validation
============================================================ */
const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

/* ============================================================
   🟢 REGISTER RIDER
   POST /api/auth/register-rider
============================================================ */
router.post(
  "/register-rider",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("phone")
      .matches(/^\d{8,15}$/)
      .withMessage("Phone must be 8-15 digits"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  runValidation,
  asyncHandler(riderAuthController.registerRider)
);

/* ============================================================
   🚕 REGISTER DRIVER
   POST /api/auth/register-driver
============================================================ */
router.post(
  "/register-driver",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("phone")
      .matches(/^\d{8,15}$/)
      .withMessage("Phone must be 8–15 digits"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),

    // Vehicle Validation
    body("vehicle")
      .isObject()
      .withMessage("Vehicle object is required"),
    body("vehicle.model").notEmpty().withMessage("Vehicle model is required"),
    body("vehicle.plate").notEmpty().withMessage("Vehicle plate is required"),
    body("vehicle.color").notEmpty().withMessage("Vehicle color is required"),

    // Location Validation
    body("location").isObject().withMessage("Location is required"),
    body("location.lat")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Latitude must be between -90 and 90"),
    body("location.lng")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Longitude must be between -180 and 180"),
  ],
  runValidation,
  asyncHandler(driverAuthController.registerDriver)
);

/* ============================================================
   🔐 COMMON LOGIN
   POST /api/auth/login
============================================================ */
router.post(
  "/login",
  [
    body("identifier")
      .notEmpty()
      .withMessage("Phone or email identifier is required"),
    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  runValidation,
  asyncHandler(commonAuthController.login)
);

module.exports = router;
