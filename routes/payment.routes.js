const express = require("express");
const router = express.Router();
const Ride = require("../models/ride.model");
const { authenticateToken, onlyDriver } = require("../middleware/auth.middleware");

// ✅ ยืนยันชำระเงินแบบเงินสด
router.patch("/confirm-cash/:rideId", authenticateToken, onlyDriver, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });
    if (ride.paymentMethod !== "cash") return res.status(400).json({ error: "ไม่ใช่เงินสด" });

    ride.paymentStatus = "paid";
    await ride.save();

    res.json({ message: "ยืนยันรับเงินสดเรียบร้อย", ride });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถยืนยันการชำระเงินได้" });
  }
});

// ✅ จำลองสร้าง QR Code / PromptPay Link
router.post("/generate-qr/:rideId", authenticateToken, async (req, res) => {
  const { method } = req.body; // 'promptpay' หรือ 'qr'
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

    // จำลองสร้างลิงก์/QR (จริง ๆ ควรเชื่อมกับบริการ PromptPay API, SCB, ฯลฯ)
    const paymentLink = `https://fake-payment-provider.com/pay?rideId=${ride._id}&method=${method}&amount=${ride.fare}`;

    res.json({
      message: `สร้างลิงก์ ${method} สำเร็จ`,
      paymentLink,
      fare: ride.fare
    });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการสร้าง QR" });
  }
});

// ✅ ยืนยันการชำระผ่าน Wallet (จำลอง)
router.patch("/wallet/:rideId", authenticateToken, async (req, res) => {
  const ride = await Ride.findById(req.params.rideId);
  if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

  if (ride.paymentMethod !== "wallet") {
    return res.status(400).json({ error: "ไม่ใช่ช่องทาง Wallet" });
  }

  // ในระบบจริงควรตรวจสอบยอดเงินของผู้ใช้ก่อน
  ride.paymentStatus = "paid";
  await ride.save();

  res.json({ message: "ชำระผ่าน Wallet สำเร็จ", ride });
});

module.exports = router;
