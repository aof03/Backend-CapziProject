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
