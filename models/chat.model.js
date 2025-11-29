const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  attachmentUrl: { type: String, default: null }, // ✅ แนบไฟล์หรือรูป
  status: { 
    type: String, 
    enum: ["sent", "delivered", "read"], 
    default: "sent" 
  },
  timestamp: { type: Date, default: Date.now }
});

// ✅ index เพื่อ query chat ตาม ride ได้ไวขึ้น
chatSchema.index({ rideId: 1, timestamp: 1 });

module.exports = mongoose.model("Chat", chatSchema);

