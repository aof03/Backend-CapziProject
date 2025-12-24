// controllers/commonAuth.controller.js
const User = require("../models/user.model");
const Driver = require("../models/driver.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

/* ============================================================
   Generate Token
============================================================ */
const generateToken = (id, role) => {
  return jwt.sign({ userId: id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/* ============================================================
   Helper Functions
============================================================ */
const sanitizePhone = (phone) => phone.replace(/\D/g, "");

// Basic validation that email contains "@"
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ============================================================
   LOGIN (Rider + Driver รองรับทั้ง Phone และ Email)
============================================================ */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "กรุณากรอก identifier และ password" });
    }

    let account = null;

    /* ------------------------------------------------------------
       CASE 1: Phone Login
    ------------------------------------------------------------ */
    const cleanedPhone = sanitizePhone(identifier);

    if (cleanedPhone && /^\d{8,15}$/.test(cleanedPhone)) {
      // Rider
      account =
        (await User.findOne({ phone: cleanedPhone }).select("+password")) ||
        (await Driver.findOne({ phone: cleanedPhone }).select("+password"));
    }

    /* ------------------------------------------------------------
       CASE 2: Email Login
    ------------------------------------------------------------ */
    if (!account && isValidEmail(identifier)) {
      const email = identifier.toLowerCase();
      account =
        (await User.findOne({ email }).select("+password")) ||
        (await Driver.findOne({ email }).select("+password"));
    }

    /* ------------------------------------------------------------
       Not Found
    ------------------------------------------------------------ */
    if (!account) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    /* ------------------------------------------------------------
       Password Check
    ------------------------------------------------------------ */
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
    }

    /* ------------------------------------------------------------
       Generate Token & Return Safe User
    ------------------------------------------------------------ */
    const token = generateToken(account._id, account.role);

    const userData = account.toObject();
    delete userData.password;

    return res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: userData,
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
};
