const express = require("express");
const router = express.Router();
const { param, body, validationResult } = require("express-validator");
const Ride = require("../models/ride.model");
const mongoose = require("mongoose");

const {
  authenticateToken,
  requireDriver,   // ✅ FIX
} = require("../middleware/auth.middleware");

/* Helpers */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const ALLOWED_QR_METHODS = ["promptpay", "qr"];

/* =====================================================
   ✔ PATCH /confirm-cash/:rideId
===================================================== */
router.patch(
  "/confirm-cash/:rideId",
  authenticateToken,
  requireDriver, // ✅ FIX
  [param("rideId").isMongoId().withMessage("Invalid rideId")],
  runValidation,
  asyncHandler(async (req, res) => {
    const { rideId } = req.params;

    const driverId = req.user.id; // ✅ FIX

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

    if (!ride.driverId || ride.driverId.toString() !== driverId.toString()) {
      return res.status(403).json({ error: "คุณไม่ใช่คนขับของรายการนี้" });
    }

    if (ride.paymentMethod !== "cash") {
      return res.status(400).json({ error: "ไม่ใช่เงินสด" });
    }

    if (ride.paymentStatus === "paid") {
      return res.status(400).json({ error: "การชำระเงินถูกยืนยันแล้ว" });
    }

    ride.paymentStatus = "paid";
    ride.paymentTxId = `cash_${new mongoose.Types.ObjectId()}`;
    await ride.save();

    res.json({ message: "ยืนยันรับเงินสดเรียบร้อย", ride });
  })
);

/* =====================================================
   ✔ POST /generate-qr/:rideId
===================================================== */
router.post(
  "/generate-qr/:rideId",
  authenticateToken,
  requireDriver, // (แนะนำให้ fix ด้วย ถ้าเฉพาะ driver สร้าง)
  [
    param("rideId").isMongoId(),
    body("method")
      .isString()
      .trim()
      .custom((m) => ALLOWED_QR_METHODS.includes(m))
      .withMessage("method must be 'promptpay' or 'qr'")
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const { method } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

    if (ride.paymentStatus === "paid") {
      return res.status(400).json({ error: "การชำระเงินถูกยืนยันแล้ว" });
    }

    const amount = Number(ride.fare || ride.estimatedFare || 0);
    if (amount <= 0) {
      return res.status(400).json({ error: "ยอดค่าบริการไม่ถูกต้อง" });
    }

    const token = new mongoose.Types.ObjectId();

    const paymentLink = `https://fake-payment-provider.local/pay?rideId=${ride._id}&method=${method}&amount=${amount}&token=${token}`;

    ride.paymentMethod = method === "promptpay" ? "promptpay" : "qr";
    ride.paymentTxId = `link_${token}`;
    await ride.save();

    res.json({
      message: `สร้างลิงก์ ${method} สำเร็จ`,
      paymentLink,
      fare: amount
    });
  })
);

/* =====================================================
   ✔ PATCH /wallet/:rideId
===================================================== */
router.patch(
  "/wallet/:rideId",
  authenticateToken,
  [param("rideId").isMongoId()],
  runValidation,
  asyncHandler(async (req, res) => {
    const { rideId } = req.params;

    const userId = req.user.id; // ✅ FIX

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

    if (!ride.riderId || ride.riderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ยืนยันการชำระเงินนี้" });
    }

    if (ride.paymentMethod !== "wallet") {
      return res.status(400).json({ error: "ไม่ใช่ช่องทาง Wallet" });
    }

    if (ride.paymentStatus === "paid") {
      return res.status(400).json({ error: "ชำระเงินแล้ว" });
    }

    ride.paymentStatus = "paid";
    ride.paymentTxId = `wallet_${new mongoose.Types.ObjectId()}`;
    await ride.save();

    res.json({ message: "ชำระผ่าน Wallet สำเร็จ", ride });
  })
);

module.exports = router;