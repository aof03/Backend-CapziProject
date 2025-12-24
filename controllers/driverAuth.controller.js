const Driver = require("../models/driver.model");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ===============================
// Token Generator
// ===============================
const generateToken = (id, role) => {
  return jwt.sign({ userId: id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// ===============================
// Helper
// ===============================
const sanitizePhone = (p) => p.replace(/\D/g, "");

const validatePhone = (phone) => /^[0-9]{8,15}$/.test(phone);

const validateEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password) =>
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
    password
  );

// ===============================
// Register Driver
// ===============================
exports.registerDriver = async (req, res) => {
  try {
    const { name, phone, email, password, vehicle, location } = req.body;

    // 1. Required fields
    if (!name || !phone || !password || !vehicle || !location) {
      return res.status(400).json({
        error: "ต้องกรอก name, phone, password, vehicle, location ครบถ้วน",
      });
    }

    // 2. Validate fields
    const cleanedPhone = sanitizePhone(phone);

    if (!validatePhone(cleanedPhone)) {
      return res.status(400).json({ error: "เบอร์โทรไม่ถูกต้อง" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error:
          "รหัสผ่านต้องมีตัวใหญ่ 1 ตัว, ตัวเล็ก 1 ตัว, ตัวเลข 1 ตัว, สัญลักษณ์ 1 ตัว และยาว 8 ตัวขึ้นไป",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });
    }

    // 3. Duplicate phone
    const existDriver = await Driver.findOne({ phone: cleanedPhone });
    const existUser = await User.findOne({ phone: cleanedPhone });

    if (existDriver || existUser) {
      return res.status(400).json({ error: "เบอร์นี้ถูกใช้งานแล้ว" });
    }

    // 4. Validate vehicle
    if (!vehicle.model || !vehicle.plate || !vehicle.color) {
      return res.status(400).json({
        error: "ต้องมี vehicle.model, vehicle.plate, vehicle.color",
      });
    }

    // 5. Validate location
    if (
      typeof location.lat !== "number" ||
      typeof location.lng !== "number"
    ) {
      return res.status(400).json({
        error: "location.lat และ location.lng ต้องเป็นตัวเลข",
      });
    }

    // 6. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Create Driver
    const driver = await Driver.create({
      name: name.trim(),
      phone: cleanedPhone,
      email: email?.toLowerCase().trim() || null,
      password: hashedPassword,

      vehicle: {
        model: vehicle.model,
        plate: vehicle.plate.toUpperCase(),
        color: vehicle.color,
        year: vehicle.year || null,
        insurer: vehicle.insurer || null,
        insuranceExpiry: vehicle.insuranceExpiry || null,
      },

      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
      },

      role: "driver",
      status: "inactive",
      isAvailable: false,

      kyc: {
        status: "pending",
        verified: false,
      },
    });

    // 8. Token
    const token = generateToken(driver._id, "driver");

    // 9. Safe Response
    res.status(201).json({
      message: "สมัคร Driver สำเร็จ",
      token,
      user: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        role: driver.role,
        status: driver.status,
      },
    });
  } catch (err) {
    console.error("Driver register error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
};
