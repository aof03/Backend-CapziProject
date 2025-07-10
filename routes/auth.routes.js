const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// 🔐 ฟังก์ชันสร้าง Token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // ✅ หมดอายุภายใน 1 วัน
  );
};

// ✅ สมัครสมาชิก
router.post("/register", async (req, res) => {
  const { name, phone, role } = req.body;
  try {
    // ป้องกันเบอร์ซ้ำ
    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ error: "เบอร์นี้ถูกใช้งานแล้ว" });

    const user = new User({ name, phone, role });
    await user.save();

    const token = generateToken(user);
    res.json({ message: "ลงทะเบียนสำเร็จ", token, user });
  } catch (err) {
    res.status(500).json({ error: "สมัครไม่สำเร็จ" });
  }
});

// ✅ ล็อกอิน
router.post("/login", async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้" });

    const token = generateToken(user);
    res.json({ message: "ล็อกอินสำเร็จ", token, user });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;
