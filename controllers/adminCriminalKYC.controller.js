const Driver = require("../models/driver.model");

/* ======================================================
   1. ดึงรายการ Criminal Record ที่รอตรวจสอบ
====================================================== */
exports.getPendingCriminalRecords = async (req, res) => {
  try {
    const drivers = await Driver.find({
      "kyc.criminalRecordStatus": "pending"
    }).select("-password -phoneVerificationToken -phoneVerificationExpire");

    return res.json({
      total: drivers.length,
      pending: drivers
    });
  } catch (err) {
    console.error("getPendingCriminalRecords error:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลได้" });
  }
};

/* ======================================================
   2. ดึงรายละเอียด Criminal Record รายบุคคล
====================================================== */
exports.getCriminalRecordDetail = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId)
      .select("-password -phoneVerificationToken -phoneVerificationExpire");

    if (!driver) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });
    }

    if (!driver.kyc.criminalRecordImage) {
      return res
        .status(400)
        .json({ error: "คนขับยังไม่ได้อัปโหลดใบรับรองความประพฤติ" });
    }

    return res.json({ driver });

  } catch (err) {
    console.error("getCriminalRecordDetail error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};

/* ======================================================
   3. อนุมัติ Criminal Record
====================================================== */
exports.approveCriminalRecord = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });

    if (!driver.kyc.criminalRecordImage) {
      return res.status(400).json({ error: "ไม่มีเอกสารให้ตรวจสอบ" });
    }

    driver.kyc.criminalRecordStatus = "approved";
    driver.kyc.criminalRecordRejectionReason = null;
    driver.kyc.criminalRecordVerifiedAt = new Date();
    driver.kyc.reviewedBy = req.admin._id; // บันทึกผู้ตรวจสอบ
    driver.kyc.reviewedAt = new Date();

    await driver.save();

    return res.json({
      message: "อนุมัติใบรับรองความประพฤติสำเร็จ",
      driverId: driver._id,
      status: driver.kyc.criminalRecordStatus
    });

  } catch (err) {
    console.error("approveCriminalRecord error:", err);
    res.status(500).json({ error: "อนุมัติไม่สำเร็จ" });
  }
};

/* ======================================================
   4. ปฏิเสธ Criminal Record
====================================================== */
exports.rejectCriminalRecord = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        error: "กรุณาระบุเหตุผลให้ชัดเจน (ขั้นต่ำ 5 ตัวอักษร)"
      });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });

    if (!driver.kyc.criminalRecordImage) {
      return res.status(400).json({ error: "ไม่มีเอกสารให้ตรวจสอบ" });
    }

    driver.kyc.criminalRecordStatus = "rejected";
    driver.kyc.criminalRecordRejectionReason = reason;
    driver.kyc.criminalRecordVerifiedAt = null;
    driver.kyc.reviewedBy = req.admin._id;
    driver.kyc.reviewedAt = new Date();

    await driver.save();

    return res.json({
      message: "ปฏิเสธเอกสารสำเร็จ",
      reason
    });

  } catch (err) {
    console.error("rejectCriminalRecord error:", err);
    res.status(500).json({ error: "ปฏิเสธไม่สำเร็จ" });
  }
};

/* ======================================================
   5. Final Approve KYC (Approve ทั้งชุด)
====================================================== */
exports.finalApproveKYC = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });
    }

    const kyc = driver.kyc;

    // ตรวจสอบเงื่อนไขก่อน final approve
    if (kyc.criminalRecordStatus !== "approved") {
      return res.status(400).json({
        error: "ยังไม่ผ่านการตรวจสอบ Criminal Record"
      });
    }

    if (
      !kyc.idCardFrontImage ||
      !kyc.idCardBackImage ||
      !kyc.drivingLicenseImage
    ) {
      return res.status(400).json({
        error: "เอกสาร KYC ยังไม่ครบ"
      });
    }

    // Final approve
    kyc.status = "approved";
    kyc.finalApprovedAt = new Date();
    kyc.finalApprovedBy = req.admin._id;

    await driver.save();

    return res.json({
      message: "อนุมัติ KYC ขั้นสุดท้ายสำเร็จ",
      driverId: driver._id,
      status: kyc.status
    });

  } catch (err) {
    console.error("finalApproveKYC error:", err);
    res.status(500).json({ error: "Final approve ไม่สำเร็จ" });
  }
};
