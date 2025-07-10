/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: ระบบส่งข้อความและดูแชทของแต่ละ ride
 */

/**
 * @swagger
 * /send:
 *   post:
 *     summary: ส่งข้อความใน ride
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ข้อมูลข้อความที่จะส่ง
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rideId
 *               - receiverId
 *               - message
 *             properties:
 *               rideId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *               receiverId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *               message:
 *                 type: string
 *                 example: สวัสดีครับ
 *     responses:
 *       200:
 *         description: ส่งข้อความสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ส่งข้อความสำเร็จ
 *                 chat:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d1fe4f5311236168a109cc
 *                     rideId:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109cb
 *                     senderId:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109cd
 *                     receiverId:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     message:
 *                       type: string
 *                       example: สวัสดีครับ
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-01-01T12:00:00.000Z
 *       400:
 *         description: กรอกข้อมูลไม่ครบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: กรอกข้อมูลไม่ครบ
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือ token ไม่ถูกต้อง
 *       500:
 *         description: ไม่สามารถส่งข้อความได้ (server error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่สามารถส่งข้อความได้
 */

/**
 * @swagger
 * /{rideId}:
 *   get:
 *     summary: โหลดแชททั้งหมดของ ride หนึ่ง
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID ของ ride ที่ต้องการดูแชท
 *     responses:
 *       200:
 *         description: แชททั้งหมดของ ride
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60d1fe4f5311236168a109cc
 *                       rideId:
 *                         type: string
 *                         example: 60d0fe4f5311236168a109cb
 *                       senderId:
 *                         type: string
 *                         example: 60d0fe4f5311236168a109cd
 *                       receiverId:
 *                         type: string
 *                         example: 60d0fe4f5311236168a109ca
 *                       message:
 *                         type: string
 *                         example: สวัสดีครับ
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: 2023-01-01T12:00:00.000Z
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือ token ไม่ถูกต้อง
 *       500:
 *         description: ไม่สามารถโหลดแชทได้ (server error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่สามารถโหลดแชทได้
 */

const express = require("express");
const router = express.Router();
const Chat = require("../models/chat.model");
const { authenticateToken } = require("../middleware/auth.middleware");

// ✅ ส่งข้อความ
router.post("/send", authenticateToken, async (req, res) => {
  const { rideId, receiverId, message } = req.body;
  if (!rideId || !receiverId || !message)
    return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });

  try {
    const chat = new Chat({
      rideId,
      senderId: req.user.userId,
      receiverId,
      message
    });
    await chat.save();
    res.json({ message: "ส่งข้อความสำเร็จ", chat });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถส่งข้อความได้" });
  }
});

// ✅ โหลดแชทใน ride เดียวกัน
router.get("/:rideId", authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({ rideId: req.params.rideId }).sort({ timestamp: 1 });
    res.json({ chats });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถโหลดแชทได้" });
  }
});

module.exports = router;
