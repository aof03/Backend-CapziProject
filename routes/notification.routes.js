/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: ระบบแจ้งเตือนของผู้ใช้
 */

/**
 * @swagger
 * /send:
 *   post:
 *     summary: ส่ง Notification ไปยังผู้ใช้
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ข้อมูล Notification ที่จะส่ง
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *               title:
 *                 type: string
 *                 example: แจ้งเตือนการเดินทาง
 *               message:
 *                 type: string
 *                 example: คนขับมาถึงที่หมายแล้ว
 *               type:
 *                 type: string
 *                 description: ประเภทของ Notification เช่น ride_request, arrived, payment, sos
 *                 example: arrived
 *               data:
 *                 type: object
 *                 description: ข้อมูลเพิ่มเติมที่แนบมา (optional)
 *                 example: { "rideId": "60d0fe4f5311236168a109cb" }
 *     responses:
 *       200:
 *         description: ส่ง Notification สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ส่ง Notification สำเร็จ
 *                 notification:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d1fe4f5311236168a109cc
 *                     userId:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     title:
 *                       type: string
 *                       example: แจ้งเตือนการเดินทาง
 *                     message:
 *                       type: string
 *                       example: คนขับมาถึงที่หมายแล้ว
 *                     type:
 *                       type: string
 *                       example: arrived
 *                     data:
 *                       type: object
 *                       example: { "rideId": "60d0fe4f5311236168a109cb" }
 *                     read:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-01-01T12:00:00.000Z
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ข้อมูลไม่ครบถ้วน
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือ token ไม่ถูกต้อง
 *       500:
 *         description: ไม่สามารถส่งแจ้งเตือนได้ (server error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่สามารถส่งแจ้งเตือนได้
 */

/**
 * @swagger
 * /my:
 *   get:
 *     summary: ดูรายการแจ้งเตือนของตัวเอง
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: แจ้งเตือนทั้งหมดของผู้ใช้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60d1fe4f5311236168a109cc
 *                       userId:
 *                         type: string
 *                         example: 60d0fe4f5311236168a109ca
 *                       title:
 *                         type: string
 *                         example: แจ้งเตือนการเดินทาง
 *                       message:
 *                         type: string
 *                         example: คนขับมาถึงที่หมายแล้ว
 *                       type:
 *                         type: string
 *                         example: arrived
 *                       data:
 *                         type: object
 *                         example: { "rideId": "60d0fe4f5311236168a109cb" }
 *                       read:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2023-01-01T12:00:00.000Z
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือ token ไม่ถูกต้อง
 *       500:
 *         description: โหลดแจ้งเตือนไม่สำเร็จ (server error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: โหลดแจ้งเตือนไม่สำเร็จ
 */

/**
 * @swagger
 * /read/{id}:
 *   patch:
 *     summary: อัปเดตสถานะแจ้งเตือนว่าอ่านแล้ว
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ไอดีของ Notification ที่จะอัปเดต
 *     responses:
 *       200:
 *         description: อ่านแจ้งเตือนแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: อ่านแจ้งเตือนแล้ว
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือ token ไม่ถูกต้อง
 *       500:
 *         description: ไม่สามารถอัปเดตสถานะแจ้งเตือนได้ (server error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่สามารถอัปเดตสถานะแจ้งเตือนได้
 */


const express = require("express");
const router = express.Router();
const Notification = require("../models/notification.model");
const { authenticateToken } = require("../middleware/auth.middleware");

// ✅ ส่ง Notification
router.post("/send", authenticateToken, async (req, res) => {
  const { userId, title, message, type, data } = req.body;

  if (!userId || !title || !message || !type) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
  }

  try {
    const noti = new Notification({
      userId,
      title,
      message,
      type, // เช่น: ride_request, arrived, payment, sos
      data: data || {},
    });

    await noti.save();

    // ✅ (สามารถเชื่อม Firebase FCM หรือ Socket.io ตรงนี้ได้ในอนาคต)
    res.json({ message: "ส่ง Notification สำเร็จ", notification: noti });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถส่งแจ้งเตือนได้" });
  }
});

// ✅ ดูแจ้งเตือนของตัวเอง
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const notiList = await Notification.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ notifications: notiList });
  } catch (err) {
    res.status(500).json({ error: "โหลดแจ้งเตือนไม่สำเร็จ" });
  }
});

// ✅ อ่านแจ้งเตือนแล้ว
router.patch("/read/:id", authenticateToken, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: "อ่านแจ้งเตือนแล้ว" });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถอัปเดตสถานะแจ้งเตือนได้" });
  }
});

module.exports = router;
