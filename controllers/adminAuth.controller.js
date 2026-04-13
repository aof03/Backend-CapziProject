const Admin = require("../models/admin.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* ============================================================
   📌 Helper Validators
============================================================ */
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password) => {
  // ต้องมี: ตัวใหญ่ ตัวเล็ก ตัวเลข สัญลักษณ์ และ ≥ 8 ตัว
  const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  return regex.test(password);
};

/* ============================================================
   📌 Generate JWT
============================================================ */
const generateToken = (adminId, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("❌ JWT_SECRET missing");
  }

  return jwt.sign(
    { userId: adminId, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/* ============================================================
   🔐 Login Admin
============================================================ */
exports.login = async (req, res) => {
  try {
    const { phoneOrEmail, password } = req.body;

    if (!phoneOrEmail || !password) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    }

    const admin = await Admin.findOne({
      $or: [
        { email: phoneOrEmail.toLowerCase() },
        { phone: phoneOrEmail }
      ]
    }).select("+password");

    if (!admin) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });
    }

    // ✅ เช็ก account ถูก lock
    if (admin.isLocked()) {
      return res.status(423).json({
        error: "บัญชีถูกล็อกชั่วคราว กรุณาลองใหม่ภายหลัง"
      });
    }

    // ✅ เช็ก status
    if (admin.status !== "active") {
      return res.status(403).json({ error: "บัญชีถูกปิดใช้งาน" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      await admin.incLoginAttempts(); // 🔥 สำคัญ
      return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
    }

    // ✅ login สำเร็จ → reset attempts
    await admin.resetLoginAttempts();

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id, admin.role);

    return res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      }
    });

  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};
/* ============================================================
   📝 Register Admin (Super Admin เท่านั้น)
============================================================ */
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    // อนุญาตเฉพาะ super_admin
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ error: "อนุญาตเฉพาะ Super Admin เท่านั้น" });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: "รหัสผ่านต้องมีตัวใหญ่ เล็ก ตัวเลข สัญลักษณ์ และอย่างน้อย 8 ตัว",
      });
    }

    // ป้องกัน super_admin ถูกสร้างเพิ่มโดยตั้งใจ / ไม่ตั้งใจ
    const allowedRoles = ["admin", "super_admin"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ error: "ไม่สามารถสร้าง role นี้ได้" });
    }

    const exist = await Admin.findOne({ email: email.toLowerCase() });
    if (exist) {
      return res.status(400).json({ error: "อีเมลนี้ใช้แล้ว" });
    }

    // Hash password (ในกรณี model ไม่มี pre-save)
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      phone: phone || null,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "admin",
      status: "active",
    });

    const token = generateToken(admin._id, admin.role);

    return res.status(201).json({
      message: "สร้าง Admin สำเร็จ",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};

/* ============================================================
   👤 Get Profile
============================================================ */
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.userId);

    if (!admin) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });
    }

    res.json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        lastLogin: admin.lastLogin,
      },
    });

  } catch (err) {
    console.error("❌ Profile Error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};

/* ============================================================
   ✏️ Update Profile
============================================================ */
exports.updateProfile = async (req, res) => {
  try {
    const updates = {};

    if (req.body.name) updates.name = req.body.name.trim();
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.avatar) updates.avatar = req.body.avatar;

    const admin = await Admin.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({ error: "ไม่พบ Admin" });
    }

    res.json({ message: "อัปเดตโปรไฟล์สำเร็จ", admin });

  } catch (err) {
    console.error("❌ Update Profile Error:", err);
    res.status(500).json({ error: "อัปเดตไม่สำเร็จ" });
  }
};

/* ============================================================
   🔄 Change Password
============================================================ */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    }

    const admin = await Admin.findById(req.user.userId).select("+password");

    if (!admin) return res.status(404).json({ error: "ไม่พบ Admin" });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: "รหัสผ่านใหม่ต้องมีตัวใหญ่ เล็ก ตัวเลข สัญลักษณ์ อย่างน้อย 8 ตัว",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      return res.status(400).json({ error: "ห้ามใช้รหัสผ่านเดิม" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });

  } catch (err) {
    console.error("❌ Change Password Error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};

/* ============================================================
   🚪 Logout
============================================================ */
exports.logout = (req, res) => {
  return res.json({ message: "Logout สำเร็จ" });
};
