// middleware/uploadCriminalRecord.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// สร้างโฟลเดอร์อัตโนมัติหากยังไม่มี
const uploadDir = "uploads/criminal_records/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `CR_${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

// จำกัดประเภทไฟล์
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("สามารถอัปโหลดได้เฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น"),
      false
    );
  }

  cb(null, true);
};

// จำกัดขนาดไฟล์ (สูงสุด 10 MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
