const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  message: String,
  type: {
    type: String,
    enum: ["ride_request", "arrived", "payment", "sos", "other"],
    default: "other"
  },
  data: Object, // เก็บข้อมูลเพิ่มเติม เช่น rideId, driverId ฯลฯ
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);
