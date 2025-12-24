const express = require("express");
const router = express.Router();
const { body, query, param } = require("express-validator");

const asyncHandler = require("../middleware/asyncHandler");
const runValidation = require("../middleware/runValidation");

const {
  authenticateToken,
  onlyAdmin
} = require("../middleware/auth.middleware");

const kyc = require("../controllers/adminKYC.controller");

/* ====================================================
   🔐 Security Middleware (Admin Only)
==================================================== */
router.use(authenticateToken, onlyAdmin);

/* ====================================================
   🟡 1) KYC Pending ทั้งหมด
   GET /api/admin/kyc/pending
==================================================== */
router.get(
  "/pending",
  asyncHandler(kyc.getPendingKYC)
);

/* ====================================================
   🟢 2) รายละเอียด KYC คนขับ
   GET /api/admin/kyc/driver/:driverId
==================================================== */
router.get(
  "/driver/:driverId",
  [
    param("driverId").isMongoId().withMessage("Invalid driverId")
  ],
  runValidation,
  asyncHandler(kyc.getDriverKYCDetail)
);

/* ====================================================
   🟢 3) Admin อนุมัติ KYC
   PATCH /api/admin/kyc/driver/:driverId/approve
==================================================== */
router.patch(
  "/driver/:driverId/approve",
  [
    param("driverId").isMongoId().withMessage("Invalid driverId")
  ],
  runValidation,
  asyncHandler(kyc.approveKYC)
);

/* ====================================================
   🔴 4) Admin ปฏิเสธ KYC
   PATCH /api/admin/kyc/driver/:driverId/reject
==================================================== */
router.patch(
  "/driver/:driverId/reject",
  [
    param("driverId").isMongoId().withMessage("Invalid driverId"),
    body("reason")
      .isString()
      .isLength({ min: 5 })
      .withMessage("Reason ต้องมีอย่างน้อย 5 ตัวอักษร")
  ],
  runValidation,
  asyncHandler(kyc.rejectKYC)
);

/* ====================================================
   📜 5) ประวัติ KYC (approved / rejected)
   GET /api/admin/kyc/history?status=approved
==================================================== */
router.get(
  "/history",
  [
    query("status")
      .isIn(["approved", "rejected"])
      .withMessage("status ต้องเป็น approved หรือ rejected")
  ],
  runValidation,
  asyncHandler(kyc.getKYCReviewHistory)
);

/* ====================================================
   📊 6) Dashboard KYC Statistics
   GET /api/admin/kyc/stats
==================================================== */
router.get(
  "/stats",
  asyncHandler(kyc.getKYCStats)
);

/* ====================================================
   🔍 7) Search + Pagination
   GET /api/admin/kyc/search
==================================================== */
router.get(
  "/search",
  [
    query("q").optional().isString(),
    query("status").optional().isIn(["pending", "approved", "rejected"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 })
  ],
  runValidation,
  asyncHandler(kyc.searchKYC)
);

/* ====================================================
   📝 8) Admin อัปเดตเอกสาร KYC (Re-upload)
   PATCH /api/admin/kyc/driver/:driverId/update-docs
==================================================== */
router.patch(
  "/driver/:driverId/update-docs",
  [
    param("driverId").isMongoId().withMessage("Invalid driverId")
  ],
  runValidation,
  asyncHandler(kyc.updateKycDocuments)
);

/* ====================================================
   🟥 9) Criminal Record Pending
   GET /api/admin/kyc/criminal/pending
==================================================== */
router.get(
  "/criminal/pending",
  asyncHandler(kyc.getPendingCriminalRecords)
);

/* ====================================================
   🟩 10) Criminal Record Approve
   PATCH /api/admin/kyc/criminal/:driverId/approve
==================================================== */
router.patch(
  "/criminal/:driverId/approve",
  [
    param("driverId").isMongoId().withMessage("Invalid driverId")
  ],
  runValidation,
  asyncHandler(kyc.approveCriminalRecord)
);

/* ====================================================
   🟥 11) Criminal Record Reject
   PATCH /api/admin/kyc/criminal/:driverId/reject
==================================================== */
router.patch(
  "/criminal/:driverId/reject",
  [
    param("driverId").isMongoId().withMessage("Invalid driverId"),
    body("reason")
      .isString()
      .isLength({ min: 5 })
      .withMessage("Reason ต้องมีอย่างน้อย 5 ตัวอักษร")
  ],
  runValidation,
  asyncHandler(kyc.rejectCriminalRecord)
);

/* ====================================================
   ✅ 12) Final Approve KYC
   PATCH /api/admin/kyc/driver/:driverId/final-approve
==================================================== */
router.patch(
  "/driver/:driverId/final-approve",
  [
    param("driverId").isMongoId().withMessage("Invalid driverId")
  ],
  runValidation,
  asyncHandler(kyc.finalApproveKYC)
);



module.exports = router;
