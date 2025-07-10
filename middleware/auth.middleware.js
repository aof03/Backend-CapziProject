// backend/middleware/auth.middleware.js

const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user.model");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "ไม่ได้ส่ง Token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(403).json({ error: "Token หมดอายุแล้ว" });
      }
      return res.status(403).json({ error: "Token ไม่ถูกต้อง" });
    }

    req.user = user;
    next();
  });
}

function onlyDriver(req, res, next) {
  if (req.user.role !== "driver") {
    return res.status(403).json({ error: "ต้องเป็นคนขับเท่านั้น" });
  }
  next();
}

function onlyRider(req, res, next) {
  if (req.user.role !== "rider") {
    return res.status(403).json({ error: "ต้องเป็นผู้โดยสารเท่านั้น" });
  }
  next();
}

async function onlyAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "อนุญาตเฉพาะแอดมินเท่านั้น" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "ตรวจสอบสิทธิ์ล้มเหลว" });
  }
}

module.exports = {
  authenticateToken,
  onlyDriver,
  onlyRider,
  onlyAdmin
};
