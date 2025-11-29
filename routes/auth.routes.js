/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: ระบบสมัครสมาชิกและล็อกอิน
 */

const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const bcrypt = require("bcrypt"); // ถ้าโปรเจกต์ใช้ bcryptjs ให้เปลี่ยนเป็น "bcryptjs"
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middleware/auth.middleware");

// 🔐 ฟังก์ชันสร้าง Token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "1d" }
  );
};

/**
 * @swagger
 * /register:
 *   post:
 *     summary: สมัครสมาชิก
 *     tags: [Auth]
 *     requestBody:
 *       description: ข้อมูลผู้ใช้สำหรับสมัครสมาชิก
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "0812345678"
 *               role:
 *                 type: string
 *                 enum: [rider, driver]
 *                 example: rider
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       201:
 *         description: สมัครสำเร็จ พร้อมส่ง token และข้อมูล user
 *       400:
 *         description: เบอร์นี้ถูกใช้งานแล้ว หรือข้อมูลไม่ครบ
 *       500:
 *         description: สมัครไม่สำเร็จ (server error)
 */
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;
    console.log("Register payload role:", role);

    if (!name || !phone || !password) {
      return res.status(400).json({ error: "กรุณากรอก name, phone, password" });
    }

    const allowedRoles = ["rider", "driver", "admin"];
    const normalizedRole = allowedRoles.includes(role) ? role : "rider";

    const existing = await User.findOne({ phone });
    if (existing) return res.status(409).json({ error: "เบอร์นี้ถูกใช้แล้ว" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      phone,
      password: hashed,
      role: normalizedRole
    });

    await user.save();
    console.log("Saved user role:", user.role);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.status(201).json({
      message: "สมัครสำเร็จ",
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
      token
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "เซิร์ฟเวอร์ผิดพลาด" });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: ล็อกอินด้วยหมายเลขโทรศัพท์และรหัสผ่าน
 *     tags: [Auth]
 *     requestBody:
 *       description: ข้อมูลสำหรับล็อกอิน
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0812345678"
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: ล็อกอินสำเร็จ พร้อมส่ง token และข้อมูล user
 *       400:
 *         description: รหัสผ่านไม่ถูกต้อง
 *       404:
 *         description: ไม่พบผู้ใช้
 *       500:
 *         description: เกิดข้อผิดพลาด (server error)
 */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: "กรุณากรอก phone และ password" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ error: "ไม่พบผู้ใช้" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "เซิร์ฟเวอร์ผิดพลาด" });
  }
});

module.exports = router;
