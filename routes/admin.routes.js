const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Ride = require("../models/ride.model");
const SOS = require("../models/sos.model");
const { authenticateToken, onlyAdmin } = require("../middleware/auth.middleware");

// ✅ ดูผู้ใช้งานทั้งหมด
router.get("/users", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถโหลดรายชื่อผู้ใช้ได้" });
  }
});

// ✅ ดูประวัติการเดินทางทั้งหมด
router.get("/rides", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const rides = await Ride.find();
    res.json({ rides });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถโหลดข้อมูลการเดินทางได้" });
  }
});

// ✅ ดูรายการ SOS ทั้งหมด
router.get("/sos", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const reports = await SOS.find();
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถโหลดข้อมูล SOS ได้" });
  }
});

// ✅ อัปเดตสถานะผู้ใช้ (active/suspended)
router.patch("/user/:id/status", authenticateToken, onlyAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    await User.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: "อัปเดตสถานะสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถอัปเดตสถานะได้" });
  }
});

// ✅ ดูรายการ KYC ที่รอตรวจสอบ
router.get("/kyc/pending", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const pendingDrivers = await User.find({
      role: "driver",
      status: "under_review",
      "kyc.verifiedAt": null
    }).select("-password -__v");
    res.json({ drivers: pendingDrivers });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถโหลดรายการ KYC ที่รอตรวจสอบได้" });
  }
});

// ✅ อนุมัติ KYC
router.patch("/kyc/approve/:driverId", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const driver = await User.findById(req.params.driverId);
    if (!driver || driver.role !== "driver") {
      return res.status(404).json({ error: "ไม่พบคนขับ" });
    }

    driver.kyc.verifiedAt = new Date();
    driver.kyc.verifiedByAdminId = req.user.userId;
    driver.status = "active";
    await driver.save();

    res.json({ message: "อนุมัติ KYC สำเร็จ", driverId: driver._id });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถอนุมัติ KYC ได้" });
  }
});

// ✅ ปฏิเสธ KYC
router.patch("/kyc/reject/:driverId", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const driver = await User.findById(req.params.driverId);
    if (!driver || driver.role !== "driver") {
      return res.status(404).json({ error: "ไม่พบคนขับ" });
    }

    driver.kyc = undefined;
    driver.status = "suspended";
    await driver.save();

    res.json({ message: "ปฏิเสธ KYC และระงับบัญชีคนขับเรียบร้อย" });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถปฏิเสธ KYC ได้" });
  }
});

module.exports = router;
