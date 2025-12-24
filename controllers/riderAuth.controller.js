const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ฟังก์ชันสร้าง JWT
const generateToken = (id, role) => {
  return jwt.sign({ userId: id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/* ======================================================
   REGISTER RIDER
====================================================== */
exports.registerRider = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    }

    const cleanedPhone = phone.replace(/\D/g, "");
    if (!/^[0-9]{8,15}$/.test(cleanedPhone)) {
      return res.status(400).json({ error: "รูปแบบเบอร์โทรไม่ถูกต้อง" });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase())) {
      return res.status(400).json({ error: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    const existingPhone = await User.findOne({ phone: cleanedPhone });
    if (existingPhone) {
      return res.status(400).json({ error: "เบอร์นี้ถูกใช้งานแล้ว" });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const rider = await User.create({
      name,
      phone: cleanedPhone,
      email: email?.toLowerCase() || null,
      password: hashedPassword,
      role: "rider",
      status: "active",
    });

    const token = generateToken(rider._id, rider.role);

    res.status(201).json({
      message: "สมัคร Rider สำเร็จ",
      token,
      user: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        email: rider.email,
        role: rider.role,
      },
    });
  } catch (err) {
    console.error("Rider register error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่ Server" });
  }
};

/* ======================================================
   LOGIN RIDER  (แก้เวอร์ชันสมบูรณ์)
====================================================== */
exports.loginRider = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log("DEBUG req.body =", req.body); // 👈 เพิ่มบรรทัดนี้
    if (!phone || !password) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    }

    const cleanedPhone = phone.replace(/\D/g, "");

    // IMPORTANT: ต้อง select password เพื่อ BCrypt
    const rider = await User.findOne({
      phone: cleanedPhone,
      role: "rider",
    }).select("+password");

    if (!rider) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });
    }

    const isMatch = await bcrypt.compare(password, rider.password);
    if (!isMatch) {
      return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = generateToken(rider._id, rider.role);

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        email: rider.email,
        role: rider.role,
      },
    });
  } catch (err) {
    console.error("Rider login error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่ Server" });
  }
};
