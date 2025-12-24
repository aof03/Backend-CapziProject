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
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Ride = require("../models/ride.model");
const { authenticateToken, onlyAdmin } = require("../middleware/auth.middleware");
const { body, param, query, validationResult } = require("express-validator");

const ObjectId = mongoose.Types.ObjectId;

/* Helpers */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const isValidUrl = (s) => typeof s === "string" && /^https?:\/\/\S+\.\S+/.test(s);

/* -------------------------------------------
   GET /me - ดูโปรไฟล์ของตัวเอง
------------------------------------------- */
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).select("-password -__v");
    if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้" });

    const base = { user };

    if (user.role === "rider") {
      const rideCount = await Ride.countDocuments({ riderId: user._id, isDeleted: { $ne: true } });
      return res.json({ ...base, rideCount });
    }

    if (user.role === "driver") {
      const jobCount = await Ride.countDocuments({ driverId: user._id, status: { $ne: "canceled" }, isDeleted: { $ne: true } });

      const agg = await Ride.aggregate([
        { $match: { driverId: user._id, status: "completed", isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: "$fare" } } }
      ]);

      const totalEarnings = agg[0]?.total || 0;
      return res.json({ ...base, jobCount, totalEarnings });
    }

    return res.json(base);
  })
);

/* -------------------------------------------
   PATCH /upload-photo - อัปเดตรูปโปรไฟล์
   body: { profileImage }
------------------------------------------- */
router.patch(
  "/upload-photo",
  authenticateToken,
  [
    body("profileImage").isString().trim().notEmpty().withMessage("profileImage is required")
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { profileImage } = req.body;
    if (!isValidUrl(profileImage)) return res.status(400).json({ error: "URL รูปภาพไม่ถูกต้อง" });

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { profileImage },
      { new: true, select: "-password -__v" }
    );

    if (!updated) return res.status(404).json({ error: "ไม่พบผู้ใช้" });

    res.json({ message: "อัปเดตรูปโปรไฟล์สำเร็จ", user: updated });
  })
);

/* -------------------------------------------
   PATCH /kyc - อัปโหลดข้อมูล KYC (driver only)
   body: { idCardNumber, driverLicenseNumber, profilePhotoUrl, idCardPhotoUrl, licensePhotoUrl }
------------------------------------------- */
router.patch(
  "/kyc",
  authenticateToken,
  [
    body("idCardNumber").isString().trim().notEmpty().withMessage("idCardNumber is required"),
    body("driverLicenseNumber").isString().trim().notEmpty().withMessage("driverLicenseNumber is required"),
    body("profilePhotoUrl").isString().trim().notEmpty().withMessage("profilePhotoUrl is required"),
    body("idCardPhotoUrl").isString().trim().notEmpty().withMessage("idCardPhotoUrl is required"),
    body("licensePhotoUrl").isString().trim().notEmpty().withMessage("licensePhotoUrl is required")
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { idCardNumber, driverLicenseNumber, profilePhotoUrl, idCardPhotoUrl, licensePhotoUrl } = req.body;

    if (![profilePhotoUrl, idCardPhotoUrl, licensePhotoUrl].every(isValidUrl)) {
      return res.status(400).json({ error: "รูปภาพต้องเป็น URL ที่ถูกต้อง" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    if (user.role !== "driver") return res.status(403).json({ error: "เฉพาะคนขับเท่านั้นที่อัปโหลด KYC ได้" });

    user.kyc = {
      idCardNumber: idCardNumber.trim(),
      driverLicenseNumber: driverLicenseNumber.trim(),
      profilePhotoUrl: profilePhotoUrl.trim(),
      idCardPhotoUrl: idCardPhotoUrl.trim(),
      licensePhotoUrl: licensePhotoUrl.trim(),
      verifiedAt: null,
      verifiedByAdminId: null,
      note: null
    };
    user.status = "under_review";
    await user.save();

    res.json({ message: "ส่งข้อมูล KYC สำเร็จ กำลังรอตรวจสอบ" });
  })
);

/* -------------------------------------------
   GET /admin/kyc-pending - ดูรายการคนขับที่รอตรวจสอบ KYC (admin)
   query: page, limit
------------------------------------------- */
router.get(
  "/admin/kyc-pending",
  authenticateToken,
  onlyAdmin,
  [
    query("page").optional().toInt().isInt({ min: 1 }).withMessage("page must be >=1"),
    query("limit").optional().toInt().isInt({ min: 1, max: 200 }).withMessage("limit must be 1-200")
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const page = req.query.page || 1;
    const limit = Math.min(req.query.limit || 50, 200);
    const skip = (page - 1) * limit;

    const [pendingDrivers, total] = await Promise.all([
      User.find({ role: "driver", status: "under_review" })
        .select("name phone kyc createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: "driver", status: "under_review" })
    ]);

    res.json({
      pendingDrivers,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  })
);

/* -------------------------------------------
   PATCH /admin/kyc-review/:driverId - แอดมินอนุมัติหรือปฏิเสธ KYC
   body: { decision: 'approve'|'reject', note?: string }
------------------------------------------- */
router.patch(
  "/admin/kyc-review/:driverId",
  authenticateToken,
  onlyAdmin,
  [
    param("driverId").isMongoId().withMessage("driverId ไม่ถูกต้อง"),
    body("decision").isIn(["approve", "reject"]).withMessage("ต้องระบุ decision เป็น approve หรือ reject"),
    body("note").optional().isString().trim().isLength({ max: 1000 })
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { decision, note } = req.body;
    const { driverId } = req.params;

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== "driver") return res.status(404).json({ error: "ไม่พบคนขับ" });

    if (!driver.kyc) return res.status(400).json({ error: "คนขับยังไม่ได้ส่งข้อมูล KYC" });

    if (decision === "approve") {
      driver.status = "active";
      driver.kyc.verifiedAt = new Date();
      driver.kyc.verifiedByAdminId = ObjectId(req.user.userId);
      driver.kyc.note = note || null;
    } else {
      driver.status = "suspended";
      // keep kyc data but mark as rejected
      driver.kyc.verifiedAt = null;
      driver.kyc.verifiedByAdminId = ObjectId(req.user.userId);
      driver.kyc.note = note || "KYC rejected by admin";
    }

    await driver.save();
    res.json({ message: `KYC ถูก${decision === "approve" ? "อนุมัติ" : "ปฏิเสธ"}เรียบร้อย` });
  })
);

module.exports = router;
