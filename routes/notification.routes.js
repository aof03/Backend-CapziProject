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
