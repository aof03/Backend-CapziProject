const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["ride_request", "arrived", "payment", "sos", "other"],
    default: "other"
  },
  data: { type: Object, default: {} }, // ✅ flexible
  read: { type: Boolean, default: false },
  deviceToken: { type: String, default: null }, // ✅ สำหรับ push notification
  expiresAt: { type: Date, default: null }, // ✅ auto delete if needed
  createdAt: { type: Date, default: Date.now }
});

// ✅ เพิ่ม index
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

