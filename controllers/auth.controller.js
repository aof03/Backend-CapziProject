const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Driver = require("../models/driver.model");

/* ============================================================
   VALIDATION
============================================================ */
const validateEmail = (email) =>
  typeof email === "string" &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePhone = (phone) =>
  typeof phone === "string" &&
  /^[0-9]{8,15}$/.test(phone);

const sanitizePhone = (p) =>
  typeof p === "string" ? p.replace(/\D/g, "") : "";

const validatePassword = (pw) =>
  typeof pw === "string" &&
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(pw);

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/* ============================================================
   REGISTER RIDER
============================================================ */
exports.registerRider = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password)
      return res.status(400).json({ error: "ข้อมูลไม่ครบ" });

    const cleanedPhone = sanitizePhone(phone);
    if (!validatePhone(cleanedPhone))
      return res.status(400).json({ error: "เบอร์โทรไม่ถูกต้อง" });

    if (!validatePassword(password))
      return res.status(400).json({
        error: "รหัสผ่านต้องมีตัวใหญ่ ตัวเล็ก ตัวเลข และสัญลักษณ์",
      });

    if (email && !validateEmail(email))
      return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });

    const duplicate =
      (await User.findOne({ $or: [{ phone: cleanedPhone }, { email }] })) ||
      (await Driver.findOne({ $or: [{ phone: cleanedPhone }, { email }] }));

    if (duplicate)
      return res.status(400).json({ error: "เบอร์หรืออีเมลซ้ำในระบบ" });

    const user = await User.create({
      name: name.trim(),
      phone: cleanedPhone,
      email: email?.toLowerCase() || null,
      password,
      role: "rider",
    });

    const token = generateToken(user._id, "rider");

    const data = user.toObject();
    delete data.password;

    res.status(201).json({
      message: "สมัคร Rider สำเร็จ",
      token,
      user: data,
    });
  } catch (err) {
    console.error("registerRider error:", err);
    res.status(500).json({ error: "สมัครไม่สำเร็จ" });
  }
};

/* ============================================================
   REGISTER DRIVER
============================================================ */
exports.registerDriver = async (req, res) => {
  try {
    const { name, phone, email, password, vehicle, location } = req.body;

    if (!name || !phone || !password)
      return res.status(400).json({ error: "ข้อมูลไม่ครบ" });

    const cleanedPhone = sanitizePhone(phone);
    if (!validatePhone(cleanedPhone))
      return res.status(400).json({ error: "เบอร์โทรไม่ถูกต้อง" });

    if (!validatePassword(password))
      return res.status(400).json({
        error: "รหัสผ่านต้องมีตัวใหญ่ ตัวเล็ก ตัวเลข และสัญลักษณ์",
      });

    if (email && !validateEmail(email))
      return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });

    const duplicate =
      (await User.findOne({ $or: [{ phone: cleanedPhone }, { email }] })) ||
      (await Driver.findOne({ $or: [{ phone: cleanedPhone }, { email }] }));

    if (duplicate)
      return res.status(400).json({ error: "เบอร์หรืออีเมลซ้ำในระบบ" });

    if (!vehicle || !vehicle.model || !vehicle.plate || !vehicle.color)
      return res.status(400).json({ error: "ต้องมีข้อมูลรถครบถ้วน" });

    if (
      !location ||
      typeof location.lat !== "number" ||
      typeof location.lng !== "number"
    )
      return res
        .status(400)
        .json({ error: "location.lat/lng ต้องเป็นตัวเลข" });

    const driver = await Driver.create({
      name: name.trim(),
      phone: cleanedPhone,
      email: email?.toLowerCase() || null,
      password,

      vehicle: {
        model: vehicle.model,
        plate: vehicle.plate.toUpperCase(),
        color: vehicle.color,
        year: vehicle.year || null,
      },

      location,
      role: "driver",
      status: "inactive",
      kyc: { status: "pending", verified: false },
    });

    const token = generateToken(driver._id, "driver");

    const data = driver.toObject();
    delete data.password;

    res.status(201).json({
      message: "สมัคร Driver สำเร็จ",
      token,
      user: data,
    });
  } catch (err) {
    console.error("registerDriver error:", err);
    res.status(500).json({ error: "สมัครไม่สำเร็จ" });
  }
};

/* ============================================================
   LOGIN (Rider / Driver)
============================================================ */
exports.login = async (req, res) => {
  try {
    const identifier =
      req.body.identifier || req.body.phone || req.body.email;
    const { password } = req.body;

    if (!identifier || !password)
      return res.status(400).json({ error: "กรอกข้อมูลให้ครบ" });

    let account = null;

    const cleaned = sanitizePhone(identifier);

    if (validatePhone(cleaned)) {
      account =
        (await User.findOne({ phone: cleaned }).select("+password")) ||
        (await Driver.findOne({ phone: cleaned }).select("+password"));
    }

    if (!account && validateEmail(identifier)) {
      const lower = identifier.toLowerCase();
      account =
        (await User.findOne({ email: lower }).select("+password")) ||
        (await Driver.findOne({ email: lower }).select("+password"));
    }

    if (!account)
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });

    const match = await bcrypt.compare(password, account.password);
    if (!match)
      return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });

    if (account.role === "driver" && account.status === "inactive")
      return res
        .status(403)
        .json({ error: "ผู้ขับยังไม่ผ่านการตรวจสอบ" });

    const token = generateToken(account._id, account.role);

    const data = account.toObject();
    delete data.password;

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: data,
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
};

/* ============================================================
   OTP (Demo)
============================================================ */
const otpStore = {};
const OTP_EXPIRY_MINUTES = 5;

exports.sendOTP = async (req, res) => {
  try {
    const cleanedPhone = sanitizePhone(req.body.phone);

    if (!validatePhone(cleanedPhone))
      return res.status(400).json({ error: "เบอร์ไม่ถูกต้อง" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[cleanedPhone] = {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60000,
    };

    console.log("OTP:", otp);
    res.json({ message: "ส่ง OTP แล้ว" });
  } catch {
    res.status(500).json({ error: "ส่ง OTP ไม่สำเร็จ" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const cleanedPhone = sanitizePhone(req.body.phone);
    const { otp } = req.body;

    const record = otpStore[cleanedPhone];
    if (!record)
      return res.status(400).json({ error: "ไม่มี OTP นี้" });

    if (Date.now() > record.expiresAt) {
      delete otpStore[cleanedPhone];
      return res.status(400).json({ error: "OTP หมดอายุ" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: "OTP ไม่ถูกต้อง" });
    }

    delete otpStore[cleanedPhone];
    res.json({ message: "ยืนยัน OTP สำเร็จ" });
  } catch {
    res.status(500).json({ error: "OTP ไม่สำเร็จ" });
  }
};
