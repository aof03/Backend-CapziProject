// routes/sos.routes.js
/**
 * Production-ready SOS routes
 * - robust validation
 * - safe rate-limiter (IPv4/IPv6)
 * - optional emergency call service (graceful fallback)
 * - clear logs and non-blocking external calls
 */

const express = require("express");
const router = express.Router();
const SOS = require("../models/sos.model");
const Driver = require("../models/driver.model");
const { authenticateToken } = require("../middleware/auth.middleware");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");

// try to require makeCall service — if not present, fallback to noop
let makeCall = null;
try {
  // if ../services/call.service.js exists and exports makeCall, use it
  // otherwise keep makeCall null and skip emergency dialing gracefully
  const callService = require("../services/call.service");
  if (typeof callService.makeCall === "function") makeCall = callService.makeCall;
} catch (err) {
  // not installed — silently fallback
  makeCall = null;
}

/* -------------------------
   Helpers
------------------------- */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

/* -------------------------
   Rate limiter (per IP)
   - keyGenerator returns req.ip directly (works for IPv6 too)
   - conservative limits for production: 3 requests / 15min per IP
------------------------- */
const sosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,

  // ใช้ keyGenerator แบบที่ library อนุญาตอย่างเป็นทางการ
  keyGenerator: rateLimit.ipKeyGenerator,

  message: {
    error: "คุณแจ้งเหตุ SOS มากเกินไป โปรดลองอีกครั้งภายหลัง"
  }
});


/* ===========================================================
   Swagger tag (optional — keep if you use swagger-jsdoc)
=========================================================== */
/**
 * @swagger
 * tags:
 *   name: SOS
 *   description: SOS emergency reporting system
 */

/* ===========================================================
   POST /api/sos/report
   - Auth required
   - Body: { riderId?, driverId?, rideId?, location: { lat, lng }, reason }
   - Rate-limited
=========================================================== */
router.post(
  "/report",
  authenticateToken,
  sosLimiter,
  [
    body("riderId")
      .optional({ nullable: true })
      .custom((v) => (v === null ? true : mongoose.isValidObjectId(v)))
      .withMessage("riderId ไม่ถูกต้อง"),
    body("driverId")
      .optional({ nullable: true })
      .custom((v) => (v === null ? true : mongoose.isValidObjectId(v)))
      .withMessage("driverId ไม่ถูกต้อง"),
    body("rideId")
      .optional({ nullable: true })
      .custom((v) => (v === null ? true : mongoose.isValidObjectId(v)))
      .withMessage("rideId ไม่ถูกต้อง"),
    body("location").exists().withMessage("location is required"),
    body("location.lat")
      .exists()
      .withMessage("location.lat is required")
      .isFloat({ min: -90, max: 90 })
      .withMessage("location.lat invalid"),
    body("location.lng")
      .exists()
      .withMessage("location.lng is required")
      .isFloat({ min: -180, max: 180 })
      .withMessage("location.lng invalid"),
    body("reason")
      .exists()
      .withMessage("reason is required")
      .isString()
      .trim()
      .isLength({ min: 3, max: 1000 })
      .withMessage("reason required 3-1000 chars")
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const {
      riderId = null,
      driverId = null,
      rideId = null,
      location,
      reason
    } = req.body;

    // normalize numeric lat/lng
    const lat = Number(location.lat);
    const lng = Number(location.lng);

    // defensive checks
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    // build SOS doc (reportedBy from token)
    const sosDoc = new SOS({
      riderId: riderId || null,
      driverId: driverId || null,
      rideId: rideId || null,
      location: { lat, lng },
      reason: String(reason).trim(),
      reportedBy: req.user.userId
    });

    // Save (wrap in try/catch — DB errors are handled)
    let saved;
    try {
      saved = await sosDoc.save();
    } catch (err) {
      console.error("SOS save error:", err);
      return res.status(500).json({ error: "ไม่สามารถบันทึกข้อมูล SOS ได้" });
    }

    // Non-blocking: if driverId provided, mark driver under_review (best-effort)
    if (driverId) {
      (async () => {
        try {
          const d = await Driver.findById(driverId);
          if (d) {
            d.status = "under_review";
            await d.save();
          }
        } catch (err) {
          console.error("Failed to update driver status for SOS:", err);
        }
      })();
    }

    // Severity detection (simple keyword-based)
    const severeKeywords = [
      "โจร",
      "ทำร้าย",
      "ข่มขืน",
      "ลักทรัพย์",
      "ทำร้ายร่างกาย",
      "ฆ่า",
      "รุนแรง",
      "ยิง",
      "แทง"
    ];

    const lowerReason = String(reason).toLowerCase();
    const isSevere = severeKeywords.some((k) => lowerReason.includes(k));

    // If severe and we have makeCall function — attempt emergency call (non-blocking)
    if (isSevere && makeCall) {
      (async () => {
        try {
          // call is best-effort, do not block response
          const phone = process.env.EMERGENCY_DISPATCH_PHONE || "191";
          const text = `Capzi SOS: ${reason} @ ${lat},${lng} (ride:${rideId || "n/a"})`;
          await makeCall(phone, text);
        } catch (callErr) {
          console.error("Emergency call failed:", callErr);
        }
      })();
    }

    // Return success (201)
    return res.status(201).json({
      message: "รับแจ้งเหตุแล้ว ข้อมูลถูกบันทึก",
      sos: saved,
      flaggedAsSevere: Boolean(isSevere)
    });
  })
);

module.exports = router;
