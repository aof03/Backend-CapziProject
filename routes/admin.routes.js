const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Ride = require("../models/ride.model");
const SOS = require("../models/sos.model");
const { authenticateToken, onlyAdmin } = require("../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: ดูผู้ใช้งานทั้งหมด
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายชื่อผู้ใช้ทั้งหมด
 */
// ✅ ดูผู้ใช้งานทั้งหมด
router.get("/users", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถโหลดรายชื่อผู้ใช้ได้" });
  }
});

/**
 * @swagger
 * /api/admin/rides:
 *   get:
 *     summary: ดูประวัติการเดินทางทั้งหมด
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการการเดินทางทั้งหมด
 */
// ✅ ดูประวัติการเดินทางทั้งหมด
router.get("/rides", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const rides = await Ride.find();
    res.json({ rides });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถโหลดข้อมูลการเดินทางได้" });
  }
});

/**
 * @swagger
 * /api/admin/sos:
 *   get:
 *     summary: ดูรายการ SOS ทั้งหมด
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการแจ้งเหตุฉุกเฉิน
 */
// ✅ ดูรายการ SOS ทั้งหมด
router.get("/sos", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const reports = await SOS.find();
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถโหลดข้อมูล SOS ได้" });
  }
});
/**
 * @swagger
 * /api/admin/user/{id}/status:
 *   patch:
 *     summary: อัปเดตสถานะผู้ใช้ (active/suspended)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: suspended
 *     responses:
 *       200:
 *         description: อัปเดตสถานะสำเร็จ
 */
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

/**
 * @swagger
 * /api/admin/kyc/pending:
 *   get:
 *     summary: ดูรายการ KYC ที่รอตรวจสอบ
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายชื่อคนขับที่รอการอนุมัติ KYC
 */
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

/**
 * @swagger
 * /api/admin/kyc/approve/{driverId}:
 *   patch:
 *     summary: อนุมัติ KYC
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: driverId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: อนุมัติ KYC สำเร็จ
 */
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

/**
 * @swagger
 * /api/admin/kyc/reject/{driverId}:
 *   patch:
 *     summary: ปฏิเสธ KYC
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: driverId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ปฏิเสธ KYC สำเร็จและระงับบัญชี
 */
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
