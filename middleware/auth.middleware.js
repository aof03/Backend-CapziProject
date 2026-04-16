const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Driver = require("../models/driver.model");
const Admin = require("../models/admin.model");

/* =========================================================
   🔥 DEBUG HELPERS (ADDED)
========================================================= */

function debugAuthHeader(req, res, next) {
  console.log("🧪 [AUTH DEBUG] Headers:", req.headers.authorization);
  next();
}

function decodeTokenUnsafe(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return next();
    }

    const token = header.split(" ")[1];
    const decoded = jwt.decode(token);

    console.log("🧪 [DECODED TOKEN]:", decoded);

    req.decodedToken = decoded;
    next();
  } catch (e) {
    console.log("🧪 decode error:", e.message);
    next();
  }
}

/* =========================================================
   AUTHENTICATE TOKEN (STANDARDIZED)
========================================================= */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;

    if (payload.role === "rider") {
      user = await User.findById(payload.userId).lean();
    }

    if (payload.role === "driver") {
      user = await Driver.findById(payload.userId).lean(); // ✅ FIX สำคัญ
    }

    if (["admin", "super_admin"].includes(payload.role)) {
      user = await Admin.findById(payload.userId).lean();
    }

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user?.isDeleted || user?.status === "suspended") {
      return res.status(403).json({ error: "Account disabled" });
    }

    req.user = {
      id: payload.userId,
      role: payload.role,
      data: user,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.status(403).json({
      error: "Invalid token",
      debug: {
        name: err.name,
        message: err.message,
      },
    });
  }
}

/* =========================================================
   ROLE CHECK
========================================================= */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

/* =========================================================
   PERMISSIONS (ADMIN ONLY)
========================================================= */
function authorizePermissions(...permissions) {
  return (req, res, next) => {
    if (!req.user || !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Admin only" });
    }

    const perms = req.user.data?.permissions || [];

    const ok = permissions.some((p) => perms.includes(p));

    if (!ok) {
      return res.status(403).json({ error: "Permission denied" });
    }

    next();
  };
}

/* =========================================================
   SPECIFIC ROLE SHORTCUTS
========================================================= */
function requireDriver(req, res, next) {
  if (!req.user || req.user.role !== "driver") {
    return res.status(403).json({ error: "Driver only" });
  }
  next();
}

function requireRider(req, res, next) {
  if (!req.user || req.user.role !== "rider") {
    return res.status(403).json({ error: "Rider only" });
  }
  next();
}

function onlyAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

function onlySuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Super admin only" });
  }
  next();
}

/* =========================================================
   BACKWARD COMPATIBILITY
========================================================= */
const onlyDriver = requireDriver;
const onlyRider = requireRider;

/* =========================================================
   EXPORT
========================================================= */
module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizePermissions,
  requireDriver,
  requireRider,
  onlyAdmin,
  onlySuperAdmin,

  onlyDriver,
  onlyRider,

  // 🔥 DEBUG EXPORT (IMPORTANT)
  debugAuthHeader,
  decodeTokenUnsafe,
};