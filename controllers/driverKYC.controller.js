const Driver = require("../models/driver.model");

/* ===========================================================
   📌 Upload Criminal Record
=========================================================== */
exports.uploadCriminalRecord = async (req, res) => {
  try {
    const driverId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: "กรุณาอัปโหลดรูปหรือเอกสารประวัติอาชญากรรม" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "ไม่พบบัญชีคนขับ" });

    driver.kyc.criminalRecordImage = req.file.path;
    driver.kyc.criminalRecordStatus = "pending";

    driver.kyc.status = "pending";
    driver.status = "under_review";

    await driver.save();

    res.json({
      message: "อัปโหลดเอกสารประวัติอาชญากรรมสำเร็จ กำลังรอตรวจสอบ",
      file: req.file.path
    });

  } catch (err) {
    console.error("uploadCriminalRecord error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปโหลด" });
  }
};


/* ===========================================================
   📌 Upload ID Card (บัตรประชาชน หน้า–หลัง)
=========================================================== */
exports.uploadIDCard = async (req, res) => {
  try {
    const driverId = req.user.userId;

    if (!req.files?.front || !req.files?.back) {
      return res.status(400).json({ error: "กรุณาอัปโหลดบัตรประชาชนทั้งด้านหน้าและด้านหลัง" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "ไม่พบบัญชีคนขับ" });

    driver.kyc.idCardFrontImage = req.files.front[0].path;
    driver.kyc.idCardBackImage = req.files.back[0].path;

    driver.kyc.status = "pending";
    driver.status = "under_review";

    await driver.save();

    res.json({
      message: "อัปโหลดรูปบัตรประชาชนสำเร็จ",
      files: {
        front: req.files.front[0].path,
        back: req.files.back[0].path
      }
    });

  } catch (err) {
    console.error("uploadIDCard error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปโหลด" });
  }
};


/* ===========================================================
   📌 Upload Driving License (ใบขับขี่)
=========================================================== */
exports.uploadDrivingLicense = async (req, res) => {
  try {
    const driverId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: "กรุณาอัปโหลดรูปใบขับขี่" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "ไม่พบบัญชีคนขับ" });

    driver.kyc.drivingLicenseImage = req.file.path;

    driver.kyc.status = "pending";
    driver.status = "under_review";

    await driver.save();

    res.json({
      message: "อัปโหลดใบขับขี่สำเร็จ",
      file: req.file.path
    });

  } catch (err) {
    console.error("uploadDrivingLicense error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปโหลด" });
  }
};


/* ===========================================================
   📌 Upload Selfie KYC (ถือบัตร)
=========================================================== */
exports.uploadSelfieKYC = async (req, res) => {
  try {
    const driverId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: "กรุณาอัปโหลดรูปหน้าตรงพร้อมถือบัตร" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "ไม่พบบัญชีคนขับ" });

    driver.kyc.selfieWithID = req.file.path;

    driver.kyc.status = "pending";
    driver.status = "under_review";

    await driver.save();

    res.json({
      message: "อัปโหลดรูปยืนยันตัวตนสำเร็จ",
      file: req.file.path
    });

  } catch (err) {
    console.error("uploadSelfieKYC error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปโหลด" });
  }
};

exports.getKycStatus = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.userId)
      .select("kyc status");

    if (!driver) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });
    }

    res.json({
      message: "ดึงสถานะ KYC สำเร็จ",
      kyc: driver.kyc,
      status: driver.status
    });

  } catch (err) {
    console.error("getKycStatus Error:", err);
    res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ" });
  }
};
