const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");

// Middlewares
const asyncHandler = require("../middleware/asyncHandler");
const runValidation = require("../middleware/runValidation");

const {
  authenticateToken,
  onlyAdmin,
  onlySuperAdmin,
} = require("../middleware/auth.middleware");

// Controllers
const adminAuthController = require("../controllers/adminAuth.controller");
const adminKYCController = require("../controllers/adminKYC.controller");

/* ======================================================
   🔐 Authentication
====================================================== */

// Admin Login
router.post(
  "/auth/login",
  [
    body("phoneOrEmail").notEmpty().withMessage("phoneOrEmail is required"),
    body("password").notEmpty().withMessage("password is required"),
  ],
  runValidation,
  asyncHandler(adminAuthController.login)
);

// SuperAdmin Register Admin
router.post(
  "/auth/register",
  authenticateToken,
  onlySuperAdmin,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  runValidation,
  asyncHandler(adminAuthController.register)
);

// Logout
router.post(
  "/auth/logout",
  authenticateToken,
  onlyAdmin,
  asyncHandler(adminAuthController.logout)
);

/* ======================================================
   👤 Admin Profile
====================================================== */

// Get Profile
router.get(
  "/profile",
  authenticateToken,
  onlyAdmin,
  asyncHandler(adminAuthController.getProfile)
);

// Update Profile
router.patch(
  "/profile",
  authenticateToken,
  onlyAdmin,
  [
    body("name").optional().isString(),
    body("avatar").optional().isString(),
    body("phone").optional().isString(),
  ],
  runValidation,
  asyncHandler(adminAuthController.updateProfile)
);

// Change Password
router.patch(
  "/change-password",
  authenticateToken,
  onlyAdmin,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("currentPassword required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  runValidation,
  asyncHandler(adminAuthController.changePassword)
);

/* ======================================================
   🔥 Admin Management (Super Admin Only)
====================================================== */

// Admin List
router.get(
  "/manage/list",
  authenticateToken,
  onlySuperAdmin,
  asyncHandler(adminKYCController.getAdminList)
);

// Update Admin Role
router.patch(
  "/manage/:adminId/role",
  authenticateToken,
  onlySuperAdmin,
  [
    body("role")
      .notEmpty()
      .isIn(["admin", "super_admin", "viewer"])
      .withMessage("Invalid role"),
  ],
  runValidation,
  asyncHandler(adminKYCController.updateAdminRole)
);

// Suspend Admin
router.patch(
  "/manage/:adminId/suspend",
  authenticateToken,
  onlySuperAdmin,
  asyncHandler(adminKYCController.suspendAdmin)
);

// Activate Admin
router.patch(
  "/manage/:adminId/activate",
  authenticateToken,
  onlySuperAdmin,
  asyncHandler(adminKYCController.activateAdmin)
);

/* ======================================================
   📜 KYC Driver Management
====================================================== */

// Get pending KYC list
router.get(
  "/kyc/pending",
  authenticateToken,
  onlyAdmin,
  asyncHandler(adminKYCController.getPendingKYC)
);

// Get Driver KYC Detail
router.get(
  "/kyc/driver/:driverId",
  authenticateToken,
  onlyAdmin,
  asyncHandler(adminKYCController.getDriverKYCDetail)
);

// Approve KYC
router.patch(
  "/kyc/driver/:driverId/approve",
  authenticateToken,
  onlyAdmin,
  asyncHandler(adminKYCController.approveKYC)
);

// Reject KYC
router.patch(
  "/kyc/driver/:driverId/reject",
  authenticateToken,
  onlyAdmin,
  [
    body("reason").optional().isString(),
  ],
  runValidation,
  asyncHandler(adminKYCController.rejectKYC)
);

// KYC Review History
router.get(
  "/kyc/history",
  authenticateToken,
  onlyAdmin,
  [
    query("status")
      .optional()
      .isIn(["approved", "rejected"])
      .withMessage("Invalid status"),
  ],
  runValidation,
  asyncHandler(adminKYCController.getKYCReviewHistory)
);

// KYC Dashboard Stats
router.get(
  "/kyc/stats",
  authenticateToken,
  onlyAdmin,
  asyncHandler(adminKYCController.getKYCStats)
);

// Search / Filter / Pagination
router.get(
  "/kyc/search",
  authenticateToken,
  onlyAdmin,
  [
    query("q").optional().isString(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 5, max: 100 }),
  ],
  runValidation,
  asyncHandler(adminKYCController.searchKYC)
);

// Admin updates driver documents
router.patch(
  "/kyc/driver/:driverId/update-docs",
  authenticateToken,
  onlyAdmin,
  asyncHandler(adminKYCController.updateKycDocuments)
);

/* ======================================================
   🔥 Criminal Record Review
====================================================== */

router.get(
  "/kyc/criminal/pending",
  authenticateToken,
  onlyAdmin,
  asyncHandler(adminKYCController.getPendingCriminalRecords)
);

router.patch(
  "/kyc/criminal/:driverId/approve",
  authenticateToken,
  onlyAdmin,
  asyncHandler(adminKYCController.approveCriminalRecord)
);

router.patch(
  "/kyc/criminal/:driverId/reject",
  authenticateToken,
  onlyAdmin,
  [
    body("reason").optional().isString(),
  ],
  runValidation,
  asyncHandler(adminKYCController.rejectCriminalRecord)
);

/* ======================================================
   📊 Dashboard (Super Admin)
====================================================== */

router.get(
  "/dashboard/metrics",
  authenticateToken,
  onlySuperAdmin,
  asyncHandler(adminKYCController.getAdminDashboardMetrics)
);

module.exports = router;
