/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: ระบบการสมัครสมาชิกและล็อกอิน
 */

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
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "0812345678"
 *               role:
 *                 type: string
 *                 example: user
 *     responses:
 *       200:
 *         description: ลงทะเบียนสำเร็จ พร้อมส่ง token และข้อมูล user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ลงทะเบียนสำเร็จ
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     phone:
 *                       type: string
 *                       example: "0812345678"
 *                     role:
 *                       type: string
 *                       example: user
 *       400:
 *         description: เบอร์นี้ถูกใช้งานแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เบอร์นี้ถูกใช้งานแล้ว
 *       500:
 *         description: สมัครไม่สำเร็จ (server error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: สมัครไม่สำเร็จ
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: ล็อกอินด้วยหมายเลขโทรศัพท์
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
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0812345678"
 *     responses:
 *       200:
 *         description: ล็อกอินสำเร็จ พร้อมส่ง token และข้อมูล user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ล็อกอินสำเร็จ
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     phone:
 *                       type: string
 *                       example: "0812345678"
 *                     role:
 *                       type: string
 *                       example: user
 *       404:
 *         description: ไม่พบผู้ใช้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบผู้ใช้
 *       500:
 *         description: เกิดข้อผิดพลาด (server error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เกิดข้อผิดพลาด
 */

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
