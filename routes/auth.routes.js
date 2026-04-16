const express = require("express");
const router = express.Router();

const riderAuthController = require("../controllers/riderAuth.controller");
const driverAuthController = require("../controllers/driverAuth.controller");
const commonAuthController = require("../controllers/commonAuth.controller");

const { authenticateToken } = require("../middleware/auth.middleware");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");

const jwt = require("jsonwebtoken");

/* =========================================================
   🧪 DEBUG MIDDLEWARE (ADDED - SAFE)
========================================================= */

const debugAuth = (req, res, next) => {
  console.log("🧪 [AUTH HEADER]:", req.headers.authorization);
  next();
};

const debugToken = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return next();
    }

    const token = header.split(" ")[1];
    const decoded = jwt.decode(token);

    console.log("🧪 [DECODED TOKEN]:", decoded);

    req.decodedToken = decoded;
    next();
  } catch (err) {
    console.log("🧪 [DECODE ERROR]:", err.message);
    next();
  }
};

/* =========================================================
   Helper: Run Validation
========================================================= */

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

/* =========================================================
   🟢 REGISTER RIDER
========================================================= */
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

/* =========================================================
   🚕 REGISTER DRIVER
========================================================= */
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

    body("vehicle").isObject().withMessage("Vehicle object is required"),
    body("vehicle.model").notEmpty().withMessage("Vehicle model is required"),
    body("vehicle.plate").notEmpty().withMessage("Vehicle plate is required"),
    body("vehicle.color").notEmpty().withMessage("Vehicle color is required"),

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

/* =========================================================
   🔐 COMMON LOGIN
========================================================= */
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

/* =========================================================
   👤 GET CURRENT USER (/me)
========================================================= */
router.get(
  "/me",
  debugAuth,
  debugToken,
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id, role, data } = req.user;

    console.log("🧠 [AUTH USER]:", { id, role });

    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id,
      role,
      user: data,
    });
  })
);

module.exports = router;