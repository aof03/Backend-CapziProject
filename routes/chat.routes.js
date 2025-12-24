/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: ระบบส่งข้อความและดูแชทของแต่ละ ride
 */

const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");

const Chat = require("../models/chat.model");
const Ride = require("../models/ride.model");
const { authenticateToken } = require("../middleware/auth.middleware");
const mongoose = require("mongoose");

/* -------------------------------------------
   Helpers
------------------------------------------- */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

const sanitizeMessage = (s) =>
  typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";

/* -------------------------------------------
   POST /send - ส่งข้อความใน ride
------------------------------------------- */
router.post(
  "/send",
  authenticateToken,
  [
    body("rideId").isMongoId().withMessage("rideId ไม่ถูกต้อง"),
    body("receiverId").isMongoId().withMessage("receiverId ไม่ถูกต้อง"),
    body("message")
      .isString()
      .isLength({ min: 1, max: 2000 })
      .withMessage("ข้อความต้องมีความยาว 1–2000 ตัวอักษร"),
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const senderId = req.user.userId;
    const { rideId, receiverId } = req.body;
    const message = sanitizeMessage(req.body.message);

    if (!message)
      return res.status(400).json({ error: "ข้อความต้องไม่ว่าง" });

    const ride = await Ride.findById(rideId).select("riderId driverId");
    if (!ride) return res.status(404).json({ error: "ไม่พบ ride" });

    const senderIsParticipant =
      ride.riderId?.toString() === senderId ||
      ride.driverId?.toString() === senderId;

    const receiverIsParticipant =
      ride.riderId?.toString() === receiverId ||
      ride.driverId?.toString() === receiverId;

    if (!senderIsParticipant)
      return res.status(403).json({ error: "คุณไม่ได้อยู่ใน ride นี้" });

    if (!receiverIsParticipant)
      return res
        .status(400)
        .json({ error: "ผู้รับไม่ใช่ผู้ร่วมการเดินทางใน ride นี้" });

    if (senderId === receiverId)
      return res.status(400).json({ error: "ไม่สามารถส่งข้อความถึงตัวเองได้" });

    const chat = await Chat.create({
      rideId,
      senderId,
      receiverId,
      message,
    });

    await chat.populate([
      { path: "senderId", select: "name avatar" },
      { path: "receiverId", select: "name avatar" },
    ]);

    return res.status(201).json({
      message: "ส่งข้อความสำเร็จ",
      chat,
    });
  })
);

/* -------------------------------------------
   GET /:rideId - โหลดแชททั้งหมดของ ride (pagination)
------------------------------------------- */
router.get(
  "/:rideId",
  authenticateToken,
  [
    param("rideId").isMongoId().withMessage("rideId ไม่ถูกต้อง"),
    query("page")
      .optional()
      .toInt()
      .isInt({ min: 1 })
      .withMessage("page ต้องเป็นตัวเลข >= 1"),
    query("limit")
      .optional()
      .toInt()
      .isInt({ min: 1, max: 200 })
      .withMessage("limit ต้อง 1–200"),
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const requesterId = req.user.userId;
    const { rideId } = req.params;
    const page = req.query.page || 1;
    const limit = req.query.limit || 100;
    const skip = (page - 1) * limit;

    const ride = await Ride.findById(rideId).select("riderId driverId");
    if (!ride) return res.status(404).json({ error: "ไม่พบ ride" });

    const isParticipant =
      ride.riderId?.toString() === requesterId ||
      ride.driverId?.toString() === requesterId;

    if (!isParticipant)
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ดูแชทนี้" });

    const [chats, total] = await Promise.all([
      Chat.find({ rideId })
        .sort({ timestamp: 1 })
        .skip(skip)
        .limit(limit)
        .populate("senderId", "name avatar")
        .populate("receiverId", "name avatar"),

      Chat.countDocuments({ rideId }),
    ]);

    return res.json({
      chats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

module.exports = router;
