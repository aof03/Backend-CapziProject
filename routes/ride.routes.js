const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");

const Ride = require("../models/ride.model");
const Driver = require("../models/driver.model");

const {
  authenticateToken,
  requireDriver,
  requireRider,
} = require("../middleware/auth.middleware");

const {
  matchDriver,
  calculateFare,
  calculateDistance
} = require("../ai/engine");

/* ---------------------- helpers ---------------------- */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const sanitizeCoords = (c) =>
  c && typeof c.lat === "number" && typeof c.lng === "number";

const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
};

/* ===========================================================
   REQUEST RIDE
=========================================================== */
router.post(
  "/request",
  authenticateToken,
  requireRider,
  [
    body("pickup").notEmpty(),
    body("dropoff").notEmpty(),
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { pickup, dropoff } = req.body;

    if (!sanitizeCoords(pickup) || !sanitizeCoords(dropoff)) {
      return res.status(400).json({ error: "invalid coords" });
    }

    const drivers = await Driver.find({
      status: "available",
    }).limit(50).lean();

    if (!drivers.length) {
      return res.status(404).json({ error: "no drivers" });
    }

    const driver = matchDriver ? matchDriver(pickup, drivers) : drivers[0];

    const distance = calculateDistance
      ? calculateDistance(pickup, dropoff)
      : 8;

    const fare = calculateFare
      ? calculateFare(distance, {})
      : distance * 10;

    const ride = await Ride.create({
      riderId: req.user.id,   // ✅ FIX: ใช้ id (มาตรฐาน auth middleware ของคุณ)
      driverId: driver._id,
      pickup,
      dropoff,
      distance,
      fare,
      status: "requested",
    });

    return res.status(201).json({
      message: "ride created",
      ride,
    });
  })
);

/* ===========================================================
   ACCEPT RIDE
=========================================================== */
router.post(
  "/accept",
  authenticateToken,
  requireDriver,
  [body("rideId").isMongoId()],
  runValidation,
  asyncHandler(async (req, res) => {
    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "not found" });

    ride.driverId = req.user.id; // ✅ FIX
    ride.status = "accepted";
    ride.acceptedAt = new Date();

    await ride.save();

    return res.json({ message: "accepted", ride });
  })
);

/* ===========================================================
   COMPLETE RIDE
=========================================================== */
router.post(
  "/complete",
  authenticateToken,
  requireDriver,
  [body("rideId").isMongoId()],
  runValidation,
  asyncHandler(async (req, res) => {
    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "not found" });

    ride.status = "completed";
    ride.completedAt = new Date();

    await ride.save();

    return res.json({ message: "completed", ride });
  })
);

/* ===========================================================
   HISTORY
=========================================================== */
router.get(
  "/history",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const filter = {};

    // ✅ FIX: ใช้ req.user.id (ไม่ใช่ userId)
    if (req.user.role === "rider") {
      filter.riderId = req.user.id;
    }

    if (req.user.role === "driver") {
      filter.driverId = req.user.id;
    }

    const rides = await Ride.find(filter).sort({ createdAt: -1 });

    return res.json({ rides });
  })
);

module.exports = router;