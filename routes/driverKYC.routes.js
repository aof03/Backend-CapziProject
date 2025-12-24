const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { authenticateToken, onlyDriver } = require("../middleware/auth.middleware");
const kycController = require("../controllers/driverKYC.controller");

/* ========================================================
   🔧 สร้างโฟลเดอร์อัตโนมัติ (ถ้ายังไม่มี)
======================================================== */
const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

ensureFolder("uploads/kyc/criminal");
ensureFolder("uploads/kyc/idcard");
ensureFolder("uploads/kyc/license");
ensureFolder("uploads/kyc/selfie");

/* ========================================================
   🗂️ Multer Storage — ตั้งชื่อไฟล์ให้ไม่ซ้ำ
======================================================== */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "uploads/";

    if (req.url.includes("criminal-record")) folder = "uploads/kyc/criminal";
    else if (req.url.includes("id-card")) folder = "uploads/kyc/idcard";
    else if (req.url.includes("driving-license")) folder = "uploads/kyc/license";
    else if (req.url.includes("selfie")) folder = "uploads/kyc/selfie";

    ensureFolder(folder);
    cb(null, folder);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeExt = ext.toLowerCase();
    const fileName = Date.now() + "_" + Math.round(Math.random() * 1e9) + safeExt;
    cb(null, fileName);
  }
});

/* ========================================================
   🛡️ File Filter — ป้องกัน spoof MIME
======================================================== */
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("อนุญาตเฉพาะไฟล์รูปภาพ JPG/PNG/WebP เท่านั้น"), false);
  }

  cb(null, true);
};

/* ========================================================
   🔐 Multer Config
======================================================== */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

/* ========================================================
   📌 1) Criminal Record
======================================================== */
router.post(
  "/criminal-record",
  authenticateToken,
  onlyDriver,
  upload.single("file"),
  (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: "ต้องอัปโหลดรูปภาพ criminal record" });
    next();
  },
  kycController.uploadCriminalRecord
);

/* ========================================================
   📌 2) ID Card (front + back)
======================================================== */
router.post(
  "/id-card",
  authenticateToken,
  onlyDriver,
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "back", maxCount: 1 }
  ]),
  (req, res, next) => {
    if (!req.files || !req.files.front || !req.files.back) {
      return res.status(400).json({ error: "ต้องอัปโหลดบัตรประชาชนทั้งด้านหน้าและด้านหลัง" });
    }
    next();
  },
  kycController.uploadIDCard
);

/* ========================================================
   📌 3) Driving License
======================================================== */
router.post(
  "/driving-license",
  authenticateToken,
  onlyDriver,
  upload.single("file"),
  (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: "ต้องอัปโหลดรูปใบขับขี่" });
    next();
  },
  kycController.uploadDrivingLicense
);

/* ========================================================
   📌 4) Selfie with ID
======================================================== */
router.post(
  "/selfie",
  authenticateToken,
  onlyDriver,
  upload.single("file"),
  (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: "ต้องอัปโหลดรูปเซลฟี่พร้อมบัตรประชาชน" });
    next();
  },
  kycController.uploadSelfieKYC
);

module.exports = router;
