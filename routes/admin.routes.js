const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Ride = require("../models/ride.model");
const SOS = require("../models/sos.model");
const Notification = require("../models/notification.model");
const AdminLog = require("../models/adminLog.model");
const { authenticateToken, onlyAdmin } = require("../middleware/auth.middleware"); 

/**
 * Pagination helper
 */
function paginate(query, req) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  return query.skip((page - 1) * limit).limit(limit);
}

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: API สำหรับผู้ดูแลระบบ (Admin)
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: ดูผู้ใช้งานทั้งหมด
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: หน้าที่ต้องการ
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: จำนวนต่อหน้า
 *     responses:
 *       200:
 *         description: รายชื่อผู้ใช้ทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get("/users", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const users = await paginate(User.find().sort({ createdAt: -1 }), req);
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถโหลดรายชื่อผู้ใช้ได้" });
  }
});

router.get("/rides", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const rides = await paginate(Ride.find().sort({ createdAt: -1 }), req);
    res.json({ rides });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถโหลดข้อมูลการเดินทางได้" });
  }
});

router.get("/sos", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const reports = await paginate(SOS.find().sort({ createdAt: -1 }), req);
    res.json({ reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถโหลดข้อมูล SOS ได้" });
  }
});

// อัปเดตสถานะผู้ใช้
router.patch("/user/:id/status", authenticateToken, onlyAdmin, async (req, res) => {
  const { status } = req.body;

  if (!["active", "suspended", "under_review"].includes(status)) {
    return res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้" });

    user.status = status;
    await user.save();

    await Notification.create({
      userId: user._id,
      title: "Account Status Updated",
      message: `สถานะบัญชีของคุณถูกเปลี่ยนเป็น ${status}`,
      type: "other"
    });

    await AdminLog.create({
      adminId: req.user.userId,
      action: "update_user_status",
      targetUserId: user._id,
      details: { newStatus: status }
    });

    res.json({ message: "อัปเดตสถานะสำเร็จ", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถอัปเดตสถานะได้" });
  }
});

// KYC
router.get("/kyc/pending", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const pendingDrivers = await User.find({
      role: "driver",
      status: "under_review",
      "kyc.verifiedAt": null
    }).select("-password -__v");
    res.json({ drivers: pendingDrivers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถโหลดรายการ KYC ที่รอตรวจสอบได้" });
  }
});

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

    await Notification.create({
      userId: driver._id,
      title: "KYC Approved",
      message: "เอกสารของคุณได้รับการอนุมัติแล้ว 🎉",
      type: "other"
    });

    await AdminLog.create({
      adminId: req.user.userId,
      action: "approve_kyc",
      targetUserId: driver._id
    });

    res.json({ message: "อนุมัติ KYC สำเร็จ", driverId: driver._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถอนุมัติ KYC ได้" });
  }
});

router.patch("/kyc/reject/:driverId", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const driver = await User.findById(req.params.driverId);
    if (!driver || driver.role !== "driver") {
      return res.status(404).json({ error: "ไม่พบคนขับ" });
    }

    driver.kyc = undefined;
    driver.status = "suspended";
    await driver.save();

    await Notification.create({
      userId: driver._id,
      title: "KYC Rejected",
      message: "เอกสารของคุณถูกปฏิเสธ กรุณาติดต่อฝ่ายสนับสนุน",
      type: "other"
    });

    await AdminLog.create({
      adminId: req.user.userId,
      action: "reject_kyc",
      targetUserId: driver._id
    });

    res.json({ message: "ปฏิเสธ KYC และระงับบัญชีคนขับเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถปฏิเสธ KYC ได้" });
  }
});

module.exports = router;
