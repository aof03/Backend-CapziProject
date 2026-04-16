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
    console.log("🟢 Rider Register request body:", req.body);
    await authController.registerRider(req, res, next);
  })
);

/* ======================================================
   🔐 Rider Login (FIXED - safe patch)
   ====================================================== */

// ✅ PATCH: รองรับของเดิม + แยก validation ให้ถูกต้อง
router.post(
  "/login",
  [
    body("phone").notEmpty().withMessage("Phone is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  runValidation,
  asyncHandler(async (req, res, next) => {
    console.log("🔐 Rider Login request body:", req.body);

    // ✅ fallback safety: ถ้า controller เก่ามี login ให้ใช้ loginRider ก่อน
    if (authController.loginRider) {
      return await authController.loginRider(req, res, next);
    }

    // fallback เดิม (ไม่ลบของเก่า)
    return await authController.login(req, res, next);
  })
);

// ❌ FIX syntax error เดิมแบบไม่ลบของเก่า (กันพัง build)
if (false) {
  authController.login;(
    [
      body("phone").notEmpty(),
      body("password").notEmpty(),
    ],
    runValidation,
    asyncHandler(async (req, res, next) => {
      console.log("🔐 Rider Login request body:", req.body);
      await authController.loginRider(req, res, next);
    })
  );
}

module.exports = router;