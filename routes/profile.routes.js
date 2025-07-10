/**
 * @swagger
 * tags:
 *   name: User
 *   description: ระบบจัดการโปรไฟล์ผู้ใช้ และการตรวจสอบ KYC สำหรับคนขับ
 */

/**
 * @swagger
 * /me:
 *   get:
 *     summary: ดูโปรไฟล์ของตัวเอง พร้อมข้อมูลเพิ่มเติมตามบทบาท
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ข้อมูลผู้ใช้และข้อมูลเพิ่มเติม (เช่น จำนวน ride หรือรายได้)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     phone:
 *                       type: string
 *                       example: "0812345678"
 *                     role:
 *                       type: string
 *                       example: driver
 *                     status:
 *                       type: string
 *                       example: active
 *                     profileImage:
 *                       type: string
 *                       example: https://example.com/image.jpg
 *                     kyc:
 *                       type: object
 *                       nullable: true
 *                       example:
 *                         idCardNumber: "1234567890123"
 *                         driverLicenseNumber: "D1234567"
 *                         profilePhotoUrl: "https://example.com/profile.jpg"
 *                         idCardPhotoUrl: "https://example.com/idcard.jpg"
 *                         licensePhotoUrl: "https://example.com/license.jpg"
 *                         verifiedAt: null
 *                         verifiedByAdminId: null
 *                 rideCount:
 *                   type: integer
 *                   description: จำนวน ride สำหรับผู้โดยสาร (rider)
 *                   example: 5
 *                 jobCount:
 *                   type: integer
 *                   description: จำนวนงานสำหรับคนขับ (driver)
 *                   example: 10
 *                 totalEarnings:
 *                   type: number
 *                   description: รายได้รวมสำหรับคนขับ (driver)
 *                   example: 1500.5
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือ token ไม่ถูกต้อง
 *       404:
 *         description: ไม่พบผู้ใช้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบผู้ใช้
 *       500:
 *         description: เกิดข้อผิดพลาดในการโหลดโปรไฟล์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เกิดข้อผิดพลาดในการโหลดโปรไฟล์
 */

/**
 * @swagger
 * /upload-photo:
 *   patch:
 *     summary: อัปเดตรูปโปรไฟล์ของผู้ใช้
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: URL รูปภาพโปรไฟล์ใหม่
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileImage
 *             properties:
 *               profileImage:
 *                 type: string
 *                 example: https://example.com/new-profile.jpg
 *     responses:
 *       200:
 *         description: อัปเดตรูปโปรไฟล์สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: อัปเดตรูปโปรไฟล์สำเร็จ
 *       400:
 *         description: กรณีไม่มี URL รูปภาพส่งมา
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: กรุณาระบุ URL รูปภาพ
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือ token ไม่ถูกต้อง
 *       500:
 *         description: ไม่สามารถอัปเดตรูปได้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่สามารถอัปเดตรูปได้
 */

/**
 * @swagger
 * /kyc:
 *   patch:
 *     summary: อัปโหลดข้อมูล KYC สำหรับคนขับ
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ข้อมูล KYC ที่ต้องการส่ง
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idCardNumber
 *               - driverLicenseNumber
 *               - profilePhotoUrl
 *               - idCardPhotoUrl
 *               - licensePhotoUrl
 *             properties:
 *               idCardNumber:
 *                 type: string
 *                 example: "1234567890123"
 *               driverLicenseNumber:
 *                 type: string
 *                 example: "D1234567"
 *               profilePhotoUrl:
 *                 type: string
 *                 example: https://example.com/profile.jpg
 *               idCardPhotoUrl:
 *                 type: string
 *                 example: https://example.com/idcard.jpg
 *               licensePhotoUrl:
 *                 type: string
 *                 example: https://example.com/license.jpg
 *     responses:
 *       200:
 *         description: ส่งข้อมูล KYC สำเร็จ กำลังรอตรวจสอบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ส่งข้อมูล KYC สำเร็จ กำลังรอตรวจสอบ
 *       400:
 *         description: ข้อมูล KYC ไม่ครบถ้วน
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ข้อมูล KYC ไม่ครบถ้วน
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือ token ไม่ถูกต้อง
 *       403:
 *         description: เฉพาะคนขับเท่านั้นที่อัปโหลด KYC ได้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เฉพาะคนขับเท่านั้นที่อัปโหลด KYC ได้
 *       404:
 *         description: ไม่พบผู้ใช้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบผู้ใช้
 *       500:
 *         description: เกิดข้อผิดพลาดในการส่งข้อมูล KYC
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เกิดข้อผิดพลาดในการส่งข้อมูล KYC
 */

/**
 * @swagger
 * /admin/kyc-pending:
 *   get:
 *     summary: ดูรายการคนขับที่รอตรวจสอบ KYC (สำหรับแอดมิน)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการคนขับที่กำลังรอตรวจสอบ KYC
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingDrivers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60d0fe4f5311236168a109ca
 *                       name:
 *                         type: string
 *                         example: John Doe
 *                       phone:
 *                         type: string
 *                         example: "0812345678"
 *                       kyc:
 *                         type: object
 *                         example:
 *                           idCardNumber: "1234567890123"
 *                           driverLicenseNumber: "D1234567"
 *                           profilePhotoUrl: "https://example.com/profile.jpg"
 *                           idCardPhotoUrl: "https://example.com/idcard.jpg"
 *                           licensePhotoUrl: "https://example.com/license.jpg"
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือไม่ใช่แอดมิน
 *       500:
 *         description: โหลดรายการไม่สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: โหลดรายการไม่สำเร็จ
 */

/**
 * @swagger
 * /admin/kyc-review/{driverId}:
 *   patch:
 *     summary: แอดมินอนุมัติหรือปฏิเสธ KYC ของคนขับ
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         schema:
 *           type: string
 *         required: true
 *         description: ไอดีของคนขับที่ต้องการตรวจสอบ KYC
 *     requestBody:
 *       description: การตัดสินใจอนุมัติหรือปฏิเสธ
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decision
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *     responses:
 *       200:
 *         description: ผลลัพธ์การอนุมัติหรือปฏิเสธ KYC
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: KYC ถูกอนุมัติเรียบร้อย
 *       400:
 *         description: กรณีระบุ decision ไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ต้องระบุ decision เป็น approve หรือ reject
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ หรือไม่ใช่แอดมิน
 *       404:
 *         description: ไม่พบคนขับ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบคนขับ
 *       500:
 *         description: เกิดข้อผิดพลาดในการตรวจสอบ KYC
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เกิดข้อผิดพลาดในการตรวจสอบ KYC
 */

const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Ride = require("../models/ride.model");
const { authenticateToken, onlyAdmin } = require("../middleware/auth.middleware");

// ✅ ดูโปรไฟล์ของตัวเอง
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-__v");
    if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้" });

    let extraData = {};

    if (user.role === "rider") {
      const rideCount = await Ride.countDocuments({ riderId: user._id });
      extraData = { rideCount };
    } else if (user.role === "driver") {
      const jobCount = await Ride.countDocuments({ driverId: user._id });
      const totalEarnings = await Ride.aggregate([
        { $match: { driverId: user._id.toString(), status: "completed" } },
        { $group: { _id: null, total: { $sum: "$fare" } } }
      ]);
      extraData = {
        jobCount,
        totalEarnings: totalEarnings[0]?.total || 0
      };
    }

    res.json({ user, ...extraData });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการโหลดโปรไฟล์" });
  }
});

// ✅ อัปเดตรูปโปรไฟล์
router.patch("/upload-photo", authenticateToken, async (req, res) => {
  const { profileImage } = req.body; // URL ของรูปภาพ

  if (!profileImage) return res.status(400).json({ error: "กรุณาระบุ URL รูปภาพ" });

  try {
    await User.findByIdAndUpdate(req.user.userId, { profileImage });
    res.json({ message: "อัปเดตรูปโปรไฟล์สำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถอัปเดตรูปได้" });
  }
});

// ✅ อัปโหลด KYC สำหรับคนขับ
router.patch("/kyc", authenticateToken, async (req, res) => {
  const { idCardNumber, driverLicenseNumber, profilePhotoUrl, idCardPhotoUrl, licensePhotoUrl } = req.body;

  if (!idCardNumber || !driverLicenseNumber || !profilePhotoUrl || !idCardPhotoUrl || !licensePhotoUrl) {
    return res.status(400).json({ error: "ข้อมูล KYC ไม่ครบถ้วน" });
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    if (user.role !== "driver") return res.status(403).json({ error: "เฉพาะคนขับเท่านั้นที่อัปโหลด KYC ได้" });

    user.kyc = {
      idCardNumber,
      driverLicenseNumber,
      profilePhotoUrl,
      idCardPhotoUrl,
      licensePhotoUrl,
      verifiedAt: null,
      verifiedByAdminId: null
    };
    user.status = "under_review";
    await user.save();

    res.json({ message: "ส่งข้อมูล KYC สำเร็จ กำลังรอตรวจสอบ" });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการส่งข้อมูล KYC" });
  }
});

// ✅ แสดงรายการคนขับที่รอตรวจสอบ KYC
router.get("/admin/kyc-pending", authenticateToken, onlyAdmin, async (req, res) => {
  try {
    const pendingDrivers = await User.find({ role: "driver", status: "under_review" }).select("name phone kyc");
    res.json({ pendingDrivers });
  } catch (err) {
    res.status(500).json({ error: "โหลดรายการไม่สำเร็จ" });
  }
});

// ✅ แอดมินอนุมัติหรือปฏิเสธ KYC
router.patch("/admin/kyc-review/:driverId", authenticateToken, onlyAdmin, async (req, res) => {
  const { decision } = req.body; // "approve" หรือ "reject"

  if (!["approve", "reject"].includes(decision)) {
    return res.status(400).json({ error: "ต้องระบุ decision เป็น approve หรือ reject" });
  }

  try {
    const driver = await User.findById(req.params.driverId);
    if (!driver || driver.role !== "driver") {
      return res.status(404).json({ error: "ไม่พบคนขับ" });
    }

    if (decision === "approve") {
      driver.status = "active";
      driver.kyc.verifiedAt = new Date();
      driver.kyc.verifiedByAdminId = req.user.userId;
    } else {
      driver.status = "suspended";
    }

    await driver.save();
    res.json({ message: `KYC ถูก${decision === "approve" ? "อนุมัติ" : "ปฏิเสธ"}เรียบร้อย` });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการตรวจสอบ KYC" });
  }
});

module.exports = router;
