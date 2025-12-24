const Chat = require("../models/chat.model");
const Ride = require("../models/ride.model");

/* ============================================================
   📩 ส่งข้อความ (Rider <-> Driver)
============================================================ */
exports.sendMessage = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { message, messageType = "text", attachmentUrl = null, replyToId = null } = req.body;
    const senderId = req.user.userId;

    // 1) Validate message
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "ข้อความไม่สามารถเว้นว่างได้" });
    }

    // 2) Verify ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "ไม่พบการเดินทาง" });

    // 3) Validate sender identity (must be rider or driver of the ride)
    if (
      senderId !== ride.riderId.toString() &&
      senderId !== ride.driverId?.toString()
    ) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ส่งข้อความใน ride นี้" });
    }

    // 4) Validate receiver (must exist)
    const receiverId =
      ride.riderId.toString() === senderId
        ? ride.driverId
        : ride.riderId;

    if (!receiverId) {
      return res.status(400).json({ error: "ยังไม่สามารถแชทได้ (คนขับยังไม่ถูกมอบหมาย)" });
    }

    // 5) Validate messageType
    const allowedTypes = ["text", "image", "file", "location"];
    if (!allowedTypes.includes(messageType)) {
      return res.status(400).json({ error: "messageType ไม่ถูกต้อง" });
    }

    // 6) Validate replyToId
    if (replyToId) {
      const repliedMsg = await Chat.findById(replyToId);
      if (!repliedMsg || repliedMsg.rideId.toString() !== rideId) {
        return res.status(400).json({ error: "replyToId ไม่ถูกต้อง" });
      }
    }

    // 7) Save message
    const chat = await Chat.saveMessage({
      rideId,
      senderId,
      receiverId,
      message: message.trim(),
      messageType,
      attachmentUrl,
      replyToId
    });

    // 8) Populate sender/receiver
    await chat.populate([
      { path: "senderId", select: "name avatar" },
      { path: "receiverId", select: "name avatar" }
    ]);

    res.status(201).json({
      message: "ส่งข้อความสำเร็จ",
      chat: chat.toJSON()
    });

  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: "ส่งข้อความล้มเหลว" });
  }
};

/* ============================================================
   📥 ดึงข้อความของ ride
============================================================ */
exports.getRideChats = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "ไม่พบการเดินทาง" });

    // ใครดูแชทได้บ้าง? → rider และ driver เท่านั้น
    if (
      userId !== ride.riderId.toString() &&
      userId !== ride.driverId.toString()
    ) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ดูแชทนี้" });
    }

    const result = await Chat.findChatsByRide(rideId, {
      page: Number(page),
      limit: Number(limit)
    });

    res.json({
      message: "ดึงแชทสำเร็จ",
      chats: result.chats,
      pagination: result.pagination
    });

  } catch (err) {
    console.error("getRideChats error:", err);
    res.status(500).json({ error: "ดึงแชทไม่สำเร็จ" });
  }
};

/* ============================================================
   ✔ Mark as Read
============================================================ */
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findById(messageId);
    if (!chat) return res.status(404).json({ error: "ไม่พบข้อความนี้" });

    // คนอ่านข้อความต้องเป็น receiver เท่านั้น
    if (chat.receiverId.toString() !== userId) {
      return res.status(403).json({ error: "คุณไม่สามารถ markAsRead ข้อความนี้ได้" });
    }

    if (chat.readAt) {
      return res.json({
        message: "อ่านแล้ว",
        chat: chat.toJSON()
      });
    }

    await chat.markAsRead();

    res.json({
      message: "ทำเครื่องหมายว่าอ่านแล้ว",
      chat: chat.toJSON()
    });

  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ error: "ไม่สามารถทำเครื่องหมายว่าอ่านแล้ว" });
  }
};
