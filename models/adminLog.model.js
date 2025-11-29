const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  action: { type: String, required: true }, // เช่น approve_kyc, reject_kyc, suspend_user
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  details: { type: Object }, // เก็บข้อมูลเพิ่มเติม (optional)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AdminLog", adminLogSchema);
