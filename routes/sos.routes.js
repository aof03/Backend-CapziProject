const express = require("express");
const router = express.Router();
const SOS = require("../models/sos.model");
const User = require("../models/user.model");
const { authenticateToken } = require("../middleware/auth.middleware");

// ✅ แจ้งเหตุฉุกเฉิน (เฉพาะลูกค้าที่เข้าสู่ระบบ)
router.post("/report", authenticateToken, async (req, res) => {
  const { riderId, driverId, rideId, location, reason } = req.body;

  if (!reason || !location) {
    return res.status(400).json({ error: "กรุณาระบุเหตุผลและพิกัด" });
  }

  try {
    const sosReport = new SOS({ riderId, driverId, rideId, location, reason });
    await sosReport.save();

    // ✅ แบนคนขับทันที
    await User.findByIdAndUpdate(driverId, { status: "suspended" });

    // TODO: แจ้งแอดมิน/ศูนย์ (เช่น Firebase Notification, Email ฯลฯ)

    res.json({ message: "รับแจ้งเหตุแล้ว คนขับถูกระงับชั่วคราว", sos: sosReport });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถแจ้งเหตุได้" });
  }
});

module.exports = router;
