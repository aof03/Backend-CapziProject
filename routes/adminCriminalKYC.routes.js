const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const asyncHandler = require("../middleware/asyncHandler");
const runValidation = require("../middleware/runValidation");

const { authenticateToken, onlyAdmin } = require("../middleware/auth.middleware");
const c = require("../controllers/adminCriminalKYC.controller");

// Security middleware
router.use(authenticateToken, onlyAdmin);

/* ======================================================
   🔍 Get Pending Criminal Record List
====================================================== */
router.get(
  "/criminal/pending",
  asyncHandler(c.getPendingCriminalRecords)
);

/* ======================================================
   📄 Get Detail of One Driver's Criminal Record
====================================================== */
router.get(
  "/criminal/:driverId",
  asyncHandler(c.getCriminalRecordDetail)
);

/* ======================================================
   ✅ Approve Criminal Record
====================================================== */
router.patch(
  "/criminal/:driverId/approve",
  asyncHandler(c.approveCriminalRecord)
);

/* ======================================================
   ❌ Reject Criminal Record
====================================================== */
router.patch(
  "/criminal/:driverId/reject",
  [
    body("reason")
      .optional()
      .isString()
      .withMessage("Reason must be a valid text"),
  ],
  runValidation,
  asyncHandler(c.rejectCriminalRecord)
);

/* ======================================================
   🏁 Final Approve KYC (Admin ขั้นสุดท้าย)
====================================================== */
router.patch(
  "/driver/:driverId/final-approve",
  asyncHandler(c.finalApproveKYC)
);

module.exports = router;
