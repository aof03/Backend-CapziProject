const express = require("express");
const router = express.Router();
const { param, query, body, validationResult } = require("express-validator");
const notificationController = require("../controllers/notification.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

/* -------------------------------------------
   Helpers
------------------------------------------- */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

/* -------------------------------------------
   🔐 ทุก endpoint ต้อง login ก่อน
------------------------------------------- */
router.use(authenticateToken);

/* ============================================================
   📌 (1) ส่ง Notification ให้ผู้ใช้
   POST /notification/send
============================================================ */
router.post(
  "/send",
  [
    body("userId").isMongoId().withMessage("Invalid userId"),
    body("title").notEmpty().isString().trim().withMessage("title is required"),
    body("message").notEmpty().isString().trim().withMessage("message is required"),
    body("type").notEmpty().isString().trim().withMessage("type is required"),
    body("data").optional().isObject()
  ],
  runValidation,
  asyncHandler(notificationController.sendNotification)
);

/* ============================================================
   📌 (2) ดูรายการ Notification ของตัวเอง
   GET /notification/my?page=1&limit=20
============================================================ */
router.get(
  "/my",
  [
    query("page").optional().toInt().isInt({ min: 1 }),
    query("limit").optional().toInt().isInt({ min: 1, max: 200 })
  ],
  runValidation,
  asyncHandler(notificationController.getMyNotifications)
);

/* ============================================================
   📌 (3) อ่าน Notification รายตัว
   PATCH /notification/read/:id
============================================================ */
router.patch(
  "/read/:id",
  [ param("id").isMongoId().withMessage("Invalid Notification ID") ],
  runValidation,
  asyncHandler(notificationController.markAsRead)
);

/* ============================================================
   📌 (4) ลบ Notification (soft delete)
   DELETE /notification/:id
============================================================ */
router.delete(
  "/:id",
  [ param("id").isMongoId().withMessage("Invalid Notification ID") ],
  runValidation,
  asyncHandler(notificationController.deleteNotification)
);

module.exports = router;
