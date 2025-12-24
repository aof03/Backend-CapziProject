const Driver = require("../models/driver.model");
const Admin = require("../models/admin.model");

/* ====================================================
   Helper: ตรวจสอบเอกสาร KYC ครบหรือไม่
==================================================== */
const isKycDocumentComplete = (kyc) => {
  return (
    kyc.idCardFrontImage &&
    kyc.idCardBackImage &&
    kyc.drivingLicenseImage &&
    kyc.selfieWithID &&
    kyc.criminalRecordStatus === "approved"
  );
};

/* ====================================================
   1) ดึงรายการ KYC Pending
==================================================== */
exports.getPendingKYC = async (req, res) => {
  try {
    const drivers = await Driver.find({ "kyc.status": "pending" })
      .select("-password -phoneVerificationToken -phoneVerificationExpire");

    res.json({ total: drivers.length, pending: drivers });
  } catch (err) {
    console.error("getPendingKYC:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลได้" });
  }
};

/* ====================================================
   2) รายละเอียด KYC รายบุคคล
==================================================== */
exports.getDriverKYCDetail = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId)
      .select("-password -phoneVerificationToken -phoneVerificationExpire");

    if (!driver) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });
    }

    res.json({ driver });
  } catch (err) {
    console.error("getDriverKYCDetail:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};

/* ====================================================
   3) อัปเดต / Re-upload เอกสาร KYC
   - เอกสารไม่ครบ → rejected (system)
   - เอกสารครบ → pending
==================================================== */
exports.updateKycDocuments = async (req, res) => {
  try {
    const { driverId } = req.params;
    const data = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });
    }

    Object.assign(driver.kyc, data);

    if (!isKycDocumentComplete(driver.kyc)) {
      driver.kyc.status = "rejected";
      driver.kyc.rejectionReason = "เอกสาร KYC ยังไม่ครบ";
      driver.kyc.rejectedAt = new Date();
      driver.status = "kyc_rejected";
    } else {
      driver.kyc.status = "pending";
      driver.kyc.rejectionReason = null;
      driver.kyc.rejectedAt = null;
      driver.status = "kyc_review";
    }

    await driver.save();

    res.json({
      message: "อัปเดตเอกสารเรียบร้อย",
      kycStatus: driver.kyc.status
    });
  } catch (err) {
    console.error("updateKycDocuments:", err);
    res.status(500).json({ error: "อัปเดตเอกสารไม่สำเร็จ" });
  }
};

/* ====================================================
   4) Admin อนุมัติ KYC
==================================================== */
exports.approveKYC = async (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });
    }

    if (driver.kyc.status !== "pending") {
      return res.status(400).json({
        error: "สามารถอนุมัติได้เฉพาะ KYC ที่อยู่ในสถานะ pending"
      });
    }

    if (!isKycDocumentComplete(driver.kyc)) {
      driver.kyc.status = "rejected";
      driver.kyc.rejectionReason = "เอกสาร KYC ยังไม่ครบ";
      driver.kyc.rejectedAt = new Date();
      driver.status = "kyc_rejected";

      await driver.save();

      return res.status(400).json({
        error: "เอกสารไม่ครบ ระบบปฏิเสธอัตโนมัติ"
      });
    }

    driver.kyc.status = "approved";
    driver.kyc.verified = true;
    driver.kyc.verifiedAt = new Date();
    driver.kyc.reviewedBy = req.admin._id;
    driver.kyc.reviewedAt = new Date();
    driver.kyc.rejectionReason = null;
    driver.kyc.rejectedAt = null;

    driver.status = "active";

    await driver.save();

    res.json({
      message: "อนุมัติ KYC สำเร็จ",
      driverId: driver._id
    });
  } catch (err) {
    console.error("approveKYC:", err);
    res.status(500).json({ error: "อนุมัติไม่สำเร็จ" });
  }
};

/* ====================================================
   5) Admin ปฏิเสธ KYC (Manual)
==================================================== */
exports.rejectKYC = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        error: "กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร"
      });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });
    }

    driver.kyc.status = "rejected";
    driver.kyc.verified = false;
    driver.kyc.rejectionReason = reason;
    driver.kyc.rejectedAt = new Date();
    driver.kyc.reviewedBy = req.admin._id;
    driver.kyc.reviewedAt = new Date();
    driver.status = "kyc_rejected";

    await driver.save();

    res.json({ message: "ปฏิเสธ KYC สำเร็จ", reason });
  } catch (err) {
    console.error("rejectKYC:", err);
    res.status(500).json({ error: "ปฏิเสธไม่สำเร็จ" });
  }
};

/* ====================================================
   6) ประวัติ KYC Approved / Rejected
==================================================== */
exports.getKYCReviewHistory = async (req, res) => {
  try {
    const { status } = req.query;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status ไม่ถูกต้อง" });
    }

    const drivers = await Driver.find({ "kyc.status": status })
      .select("-password")
      .populate("kyc.reviewedBy", "name email role");

    res.json({ total: drivers.length, drivers });
  } catch (err) {
    console.error("getKYCReviewHistory:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลได้" });
  }
};

/* ====================================================
   7) Dashboard Stats
==================================================== */
exports.getKYCStats = async (req, res) => {
  try {
    const total = await Driver.countDocuments();
    const pending = await Driver.countDocuments({ "kyc.status": "pending" });
    const approved = await Driver.countDocuments({ "kyc.status": "approved" });
    const rejected = await Driver.countDocuments({ "kyc.status": "rejected" });

    res.json({
      totalDrivers: total,
      pending,
      approved,
      rejected
    });
  } catch (err) {
    console.error("getKYCStats:", err);
    res.status(500).json({ error: "ไม่สามารถคำนวณสถิติได้" });
  }
};

/* ====================================================
   8) Criminal Record - Pending
==================================================== */
exports.getPendingCriminalRecords = async (req, res) => {
  try {
    const drivers = await Driver.find({
      "kyc.criminalRecordStatus": "pending"
    }).select("-password");

    res.json({ total: drivers.length, pending: drivers });
  } catch (err) {
    console.error("getPendingCriminalRecords:", err);
    res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ" });
  }
};

/* ====================================================
   9) Criminal Record - Approve
==================================================== */
exports.approveCriminalRecord = async (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });
    }

    driver.kyc.criminalRecordStatus = "approved";
    driver.kyc.criminalRecordVerifiedAt = new Date();
    driver.kyc.reviewedBy = req.admin._id;
    driver.kyc.reviewedAt = new Date();

    await driver.save();

    res.json({ message: "อนุมัติใบรับรองความประพฤติสำเร็จ" });
  } catch (err) {
    console.error("approveCriminalRecord:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};

/* ====================================================
   10) Criminal Record - Reject
==================================================== */
exports.rejectCriminalRecord = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.length < 5) {
      return res.status(400).json({ error: "กรุณาระบุเหตุผลให้ชัดเจน" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });
    }

    driver.kyc.criminalRecordStatus = "rejected";
    driver.kyc.criminalRecordRejectionReason = reason;
    driver.kyc.reviewedBy = req.admin._id;
    driver.kyc.reviewedAt = new Date();

    await driver.save();

    res.json({ message: "ปฏิเสธใบรับรองสำเร็จ", reason });
  } catch (err) {
    console.error("rejectCriminalRecord:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};
/* ====================================================
   12) Final Approve KYC (เอกสารครบทั้งหมด)
==================================================== */
exports.finalApproveKYC = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });
    }

    const kyc = driver.kyc;

    // 🔍 ตรวจเอกสารที่จำเป็นทั้งหมด
    const missingDocs = [];

    if (!kyc.idCardFrontImage) missingDocs.push("idCardFrontImage");
    if (!kyc.idCardBackImage) missingDocs.push("idCardBackImage");
    if (!kyc.drivingLicenseImage) missingDocs.push("drivingLicenseImage");
    if (!kyc.selfieWithID) missingDocs.push("selfieWithID");

    if (kyc.criminalRecordStatus !== "approved") {
      missingDocs.push("criminalRecordNotApproved");
    }

    // ❌ เอกสารไม่ครบ → reject ทันที
    if (missingDocs.length > 0) {
      kyc.status = "rejected";
      kyc.verified = false;
      kyc.rejectionReason = `เอกสารไม่ครบ: ${missingDocs.join(", ")}`;
      kyc.rejectedAt = new Date();
      kyc.reviewedBy = req.admin._id;
      kyc.reviewedAt = new Date();

      driver.status = "kyc_incomplete";

      await driver.save();

      return res.status(400).json({
        error: "เอกสาร KYC ยังไม่ครบ",
        missingDocuments: missingDocs
      });
    }

    // ✅ ผ่านครบทุกเงื่อนไข
    kyc.status = "approved";
    kyc.verified = true;
    kyc.verifiedAt = new Date();
    kyc.rejectionReason = null;
    kyc.rejectedAt = null;
    kyc.reviewedBy = req.admin._id;
    kyc.reviewedAt = new Date();

    driver.status = "active";

    await driver.save();

    res.json({
      message: "Final Approve KYC สำเร็จ",
      driverId: driver._id,
      kycStatus: kyc.status
    });

  } catch (err) {
    console.error("finalApproveKYC:", err);
    res.status(500).json({ error: "ไม่สามารถ Final Approve KYC ได้" });
  }
};
