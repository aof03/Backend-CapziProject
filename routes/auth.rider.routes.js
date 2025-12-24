const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

// Middleware
const asyncHandler = require("../middleware/asyncHandler");
const runValidation = require("../middleware/runValidation");

// Controller
const authController = require("../controllers/auth.controller");

/* ======================================================
   🟢 Rider Register
   เพิ่ม log request body สำหรับ debug frontend
====================================================== */
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("phone")
      .notEmpty().withMessage("Phone is required")
      .isMobilePhone("th-TH").withMessage("Invalid phone number"),
    body("email")
      .optional()
      .isEmail().withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  runValidation,
  asyncHandler(async (req, res, next) => {
    console.log("🟢 Rider Register request body:", req.body); // <-- log request body
    await authController.registerRider(req, res, next);
  })
);

/* ======================================================
   🔐 Rider Login
   เพิ่ม log request body สำหรับ debug frontend
====================================================== */
router.post("/login", authController.login);(
  [
    body("phone").notEmpty().withMessage("Phone is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  runValidation,
  asyncHandler(async (req, res, next) => {
    console.log("🔐 Rider Login request body:", req.body);
-   await authController.login(req, res, next);
+   await authController.loginRider(req, res, next);
  })
);

module.exports = router;
