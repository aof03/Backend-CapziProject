/**
 * @swagger
 * tags:
 *   name: Ride
 *   description: ระบบจัดการการเดินทางและการชำระเงิน
 */

/**
 * @swagger
 * /confirm-cash/{rideId}:
 *   patch:
 *     summary: ยืนยันชำระเงินแบบเงินสด (เฉพาะคนขับ)
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         schema:
 *           type: string
 *         required: true
 *         description: ไอดีของรายการเดินทางที่ต้องการยืนยันชำระเงิน
 *     responses:
 *       200:
 *         description: ยืนยันรับเงินสดเรียบร้อย พร้อมข้อมูล ride ล่าสุด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ยืนยันรับเงินสดเรียบร้อย
 *                 ride:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109cb
 *                     paymentMethod:
 *                       type: string
 *                       example: cash
 *                     paymentStatus:
 *                       type: string
 *                       example: paid
 *                     fare:
 *                       type: number
 *                       example: 150
 *                     // ... properties ของ ride model อื่น ๆ ตามจริง
 *       400:
 *         description: ไม่ใช่เงินสด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่ใช่เงินสด
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือไม่ใช่คนขับ
 *       404:
 *         description: ไม่พบรายการเดินทาง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบรายการเดินทาง
 *       500:
 *         description: ไม่สามารถยืนยันการชำระเงินได้ (server error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่สามารถยืนยันการชำระเงินได้
 */

/**
 * @swagger
 * /generate-qr/{rideId}:
 *   post:
 *     summary: สร้าง QR Code หรือ PromptPay Link สำหรับการชำระเงิน (จำลอง)
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         schema:
 *           type: string
 *         required: true
 *         description: ไอดีของรายการเดินทาง
 *     requestBody:
 *       description: ระบุวิธีการชำระเงิน (promptpay หรือ qr)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *             properties:
 *               method:
 *                 type: string
 *                 example: promptpay
 *     responses:
 *       200:
 *         description: สร้างลิงก์ QR Code สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: สร้างลิงก์ promptpay สำเร็จ
 *                 paymentLink:
 *                   type: string
 *                   example: https://fake-payment-provider.com/pay?rideId=60d0fe4f5311236168a109cb&method=promptpay&amount=150
 *                 fare:
 *                   type: number
 *                   example: 150
 *       404:
 *         description: ไม่พบรายการเดินทาง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบรายการเดินทาง
 *       500:
 *         description: เกิดข้อผิดพลาดในการสร้าง QR
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เกิดข้อผิดพลาดในการสร้าง QR
 */

/**
 * @swagger
 * /wallet/{rideId}:
 *   patch:
 *     summary: ยืนยันการชำระเงินผ่าน Wallet (จำลอง)
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         schema:
 *           type: string
 *         required: true
 *         description: ไอดีของรายการเดินทาง
 *     responses:
 *       200:
 *         description: ชำระผ่าน Wallet สำเร็จ พร้อมข้อมูล ride ล่าสุด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ชำระผ่าน Wallet สำเร็จ
 *                 ride:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109cb
 *                     paymentMethod:
 *                       type: string
 *                       example: wallet
 *                     paymentStatus:
 *                       type: string
 *                       example: paid
 *                     fare:
 *                       type: number
 *                       example: 150
 *                     // ... properties ของ ride model อื่น ๆ ตามจริง
 *       400:
 *         description: ไม่ใช่ช่องทาง Wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่ใช่ช่องทาง Wallet
 *       404:
 *         description: ไม่พบรายการเดินทาง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบรายการเดินทาง
 *       500:
 *         description: เกิดข้อผิดพลาด (server error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เกิดข้อผิดพลาด
 */

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
