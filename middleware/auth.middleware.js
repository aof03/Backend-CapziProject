const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Driver = require("../models/driver.model");
const Admin = require("../models/admin.model");

/* ------------------------------------------------------
   🔐 Verify JWT Token (Main Authentication Middleware)
------------------------------------------------------ */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader)
      return res.status(401).json({ error: "ไม่ได้เข้าสู่ระบบ - ไม่พบ Token" });

    if (!authHeader.startsWith("Bearer "))
      return res.status(401).json({ error: "รูปแบบ Token ไม่ถูกต้อง" });

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing");
      return res.status(500).json({ error: "Server error: JWT_SECRET undefined" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch (err) {
    console.error("authenticateToken error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token หมดอายุ" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Token ไม่ถูกต้อง" });
    }

    return res.status(500).json({ error: "ตรวจสอบ Token ล้มเหลว" });
  }
}

/* ------------------------------------------------------
   🟦 Only Driver
------------------------------------------------------ */
async function onlyDriver(req, res, next) {
  try {
    const { userId, role } = req.user;

    if (role !== "driver")
      return res.status(403).json({ error: "อนุญาตเฉพาะคนขับเท่านั้น" });

    const driver = await Driver.findById(userId).select("-password");
    if (!driver)
      return res.status(404).json({ error: "ไม่พบข้อมูลคนขับ" });

    if (driver.status === "suspended")
      return res.status(403).json({ error: "บัญชีคนขับนี้ถูกระงับ" });

    req.driver = driver;
    next();
  } catch (err) {
    console.error("onlyDriver error:", err);
    res.status(500).json({ error: "ตรวจสอบสิทธิ์ล้มเหลว" });
  }
}

/* ------------------------------------------------------
   🟩 Only Rider
------------------------------------------------------ */
async function onlyRider(req, res, next) {
  try {
    const { userId, role } = req.user;

    if (role !== "rider")
      return res.status(403).json({ error: "อนุญาตเฉพาะผู้โดยสารเท่านั้น" });

    const user = await User.findById(userId).select("-password");
    if (!user)
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้โดยสาร" });

    if (user.status !== "active")
      return res.status(403).json({ error: "บัญชีนี้ถูกปิดใช้งาน" });

    req.rider = user;
    next();
  } catch (err) {
    console.error("onlyRider error:", err);
    res.status(500).json({ error: "ตรวจสอบสิทธิ์ล้มเหลว" });
  }
}

/* ------------------------------------------------------
   🟥 Only Admin
------------------------------------------------------ */
async function onlyAdmin(req, res, next) {
  try {
    const { userId, role } = req.user;

    if (!["admin", "super_admin"].includes(role))
      return res.status(403).json({ error: "อนุญาตเฉพาะ Admin เท่านั้น" });

    const admin = await Admin.findById(userId).select("-password");
    if (!admin)
      return res.status(404).json({ error: "ไม่พบข้อมูล Admin" });

    if (admin.status !== "active")
      return res.status(403).json({ error: "บัญชี Admin ถูกปิดใช้งาน" });

    req.admin = admin;
    next();
  } catch (err) {
    console.error("onlyAdmin error:", err);
    res.status(500).json({ error: "ตรวจสอบสิทธิ์ล้มเหลว" });
  }
}

/* ------------------------------------------------------
   🟥 Only Super Admin
------------------------------------------------------ */
async function onlySuperAdmin(req, res, next) {
  try {
    const { userId, role } = req.user;

    if (role !== "super_admin")
      return res.status(403).json({ error: "อนุญาตเฉพาะ Super Admin เท่านั้น" });

    const admin = await Admin.findById(userId).select("-password");
    if (!admin)
      return res.status(404).json({ error: "ไม่พบข้อมูล Super Admin" });

    if (admin.status !== "active")
      return res.status(403).json({ error: "บัญชี Super Admin ถูกปิดใช้งาน" });

    req.admin = admin;

    next();
  } catch (err) {
    console.error("onlySuperAdmin error:", err);
    res.status(500).json({ error: "ตรวจสอบสิทธิ์ล้มเหลว" });
  }
}

/* ------------------------------------------------------
   🔷 Check Multiple Roles (Reusable Middleware)
------------------------------------------------------ */
function checkRole(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const { role, userId } = req.user;

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          error: `เฉพาะ role: ${allowedRoles.join(", ")} เท่านั้น`,
        });
      }

      // auto load admin data
      if (["admin", "super_admin"].includes(role)) {
        req.admin = await Admin.findById(userId).select("-password");
      }

      next();
    } catch (err) {
      console.error("checkRole error:", err);
      res.status(500).json({ error: "ตรวจสอบสิทธิ์ล้มเหลว" });
    }
  };
}

module.exports = {
  authenticateToken,
  onlyDriver,
  onlyRider,
  onlyAdmin,
  onlySuperAdmin,
  checkRole,
};
