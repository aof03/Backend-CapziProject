const mongoose = require("mongoose");

const sosSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride" },

  reason: { type: String, required: true }, // เช่น "ถูกทิ้งกลางทาง", "ขับอ้อม"

  location: {
    lat: Number,
    lng: Number
  },

  resolved: { type: Boolean, default: false },       // ✅ กรณีแอดมินตรวจสอบแล้ว
  actionTaken: { type: String, default: null },       // ✅ เช่น "คนขับถูกแบน", "คืนเงิน"

  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SOS", sosSchema);

