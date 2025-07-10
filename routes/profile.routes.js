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
