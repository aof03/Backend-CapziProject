/**
 * routes/ride.routes.js
 *
 * Ride management routes (request, accept, complete, reroute, payments, history, traffic check)
 * Includes Swagger docs for each endpoint.
 */

const express = require("express");
const router = express.Router();
const axios = require("axios");
const mongoose = require("mongoose");
const { body, param, query, validationResult } = require("express-validator");

const Ride = require("../models/ride.model");
const User = require("../models/user.model");
const Driver = require("../models/driver.model");
const Notification = require("../models/notification.model");

const {
  authenticateToken,
  onlyDriver,
  onlyRider,
} = require("../middleware/auth.middleware");

const {
  matchDriver,
  calculateFare,
  calculateDistance
} = require("../ai/engine"); // engine should export matchDriver, calculateFare, calculateDistance

/* ----------------------
   Helpers
   ---------------------- */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const sanitizeCoords = (c) =>
  c && typeof c.lat === "number" && typeof c.lng === "number";

const toObjectId = (id) => {
  try {
    return mongoose.Types.ObjectId(id);
  } catch (e) {
    return null;
  }
};

/* ===========================================================
   Swagger tag (top-level)
   =========================================================== */
/**
 * @swagger
 * tags:
 *   name: Ride
 *   description: Ride lifecycle (request, accept, arrive, start, complete), routing, payment
 */

/* ===========================================================
   POST /api/rides/request
   - Rider requests a ride. System matches driver (engine.matchDriver) and creates ride
   =========================================================== */
/**
 * @swagger
 * /api/rides/request:
 *   post:
 *     summary: Rider requests a ride (assigns driver if available)
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickup, dropoff]
 *             properties:
 *               pickup:
 *                 type: object
 *                 properties:
 *                   lat: { type: number }
 *                   lng: { type: number }
 *               dropoff:
 *                 type: object
 *                 properties:
 *                   lat: { type: number }
 *                   lng: { type: number }
 *               priority:
 *                 type: string
 *                 enum: [normal, high]
 *               promoCode:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, wallet, promptpay, card]
 *     responses:
 *       201:
 *         description: Ride requested and driver assigned
 */
router.post(
  "/request",
  authenticateToken,
  onlyRider,
  [
    body("pickup").notEmpty(),
    body("dropoff").notEmpty(),
    body("priority").optional().isIn(["normal", "high"]),
    body("promoCode").optional().isString().trim(),
    body("paymentMethod").optional().isIn(["cash", "wallet", "promptpay", "card"]),
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { pickup, dropoff, priority, promoCode, paymentMethod } = req.body;

    if (!sanitizeCoords(pickup) || !sanitizeCoords(dropoff)) {
      return res.status(400).json({ error: "กรุณาระบุ pickup และ dropoff ให้ถูกต้อง (lat,lng)" });
    }

    // Find available drivers (limiting) and use engine.matchDriver
    const availableDrivers = await Driver.find({
      status: "available",
      // optionally more filters e.g. location radius, vehicleType etc.
    }).limit(100).lean();

    let driver = null;
    if (availableDrivers.length) {
      driver = typeof matchDriver === "function" ? matchDriver(pickup, availableDrivers) : availableDrivers[0];
    }

    if (!driver) return res.status(404).json({ error: "ไม่มีคนขับใกล้เคียง" });

    // compute distance using engine (if available) else fallback placeholder
    let distanceKm = 0;
    try {
      distanceKm = typeof calculateDistance === "function"
        ? calculateDistance(pickup, dropoff)
        : 8;
    } catch (e) {
      distanceKm = 8;
    }

    // calculate fare
    const finalFare = typeof calculateFare === "function"
      ? calculateFare(distanceKm, { priority: priority === "high", promoCode, vehicleType: driver.vehicle?.type || "car" })
      : Math.max(20, Math.round(distanceKm * 10));

    const ride = new Ride({
      riderId: toObjectId(req.user.userId),
      driverId: toObjectId(driver._id),
      pickup,
      dropoff,
      pickupGeo: { type: "Point", coordinates: [pickup.lng, pickup.lat] },
      dropoffGeo: { type: "Point", coordinates: [dropoff.lng, dropoff.lat] },
      distance: Number(distanceKm.toFixed(2)),
      fare: finalFare,
      estimatedFare: finalFare,
      priority: priority || "normal",
      promoCode: promoCode || null,
      status: "requested",
      paymentMethod: paymentMethod || "cash",
      paymentStatus: "pending",
      requestedAt: new Date()
    });

    await ride.save();

    // Notify driver (best-effort)
    try {
      await Notification.create({
        userId: toObjectId(driver._id),
        title: "คำขอเรียกรถใหม่",
        message: `มีคำขอเรียกรถใกล้คุณ (${ride._id})`,
        type: "ride_request",
        data: { rideId: ride._id.toString() }
      });
    } catch (e) {
      // ignore notification errors
      console.error("Notification error:", e.message);
    }

    // populate minimal driver info for response
    const populatedRide = await Ride.findById(ride._id)
      .populate({ path: "driverId", select: "name vehicle rating" })
      .populate({ path: "riderId", select: "name" });

    return res.status(201).json({ message: "เรียกรถสำเร็จ", ride: populatedRide });
  })
);

/* ===========================================================
   POST /api/rides/accept
   - Driver accepts assigned ride (or claims unassigned)
   =========================================================== */
/**
 * @swagger
 * /api/rides/accept:
 *   post:
 *     summary: Driver accepts a ride
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rideId]
 *             properties:
 *               rideId: { type: string }
 *     responses:
 *       200:
 *         description: Ride accepted
 */
router.post(
  "/accept",
  authenticateToken,
  onlyDriver,
  [body("rideId").isMongoId().withMessage("rideId ไม่ถูกต้อง")],
  runValidation,
  asyncHandler(async (req, res) => {
    const driverId = req.user.userId;
    const { rideId } = req.body;
    const ride = await Ride.findById(toObjectId(rideId));
    if (!ride) return res.status(404).json({ error: "ไม่พบคำขอเรียกรถ" });

    // if ride already assigned to other driver -> forbid
    if (ride.driverId && ride.driverId.toString() !== driverId.toString()) {
      return res.status(403).json({ error: "คุณไม่ได้รับสิทธิ์รับงานนี้" });
    }

    // use instance method if exists to keep logic consistent
    try {
      if (typeof ride.accept === "function") {
        await ride.accept(toObjectId(driverId));
      } else {
        // fallback: assign and change status
        ride.driverId = toObjectId(driverId);
        ride.status = "accepted";
        ride.acceptedAt = new Date();
        ride.driverConfirmed = true;
        await ride.save();
      }
    } catch (err) {
      return res.status(400).json({ error: err.message || "ไม่สามารถรับงานได้" });
    }

    // notify rider
    try {
      await Notification.create({
        userId: toObjectId(ride.riderId),
        title: "คนขับรับงานแล้ว",
        message: `คนขับได้ยอมรับการเรียกรถของคุณ`,
        type: "ride_update",
        data: { rideId: ride._id.toString() }
      });
    } catch (e) { /* ignore */ }

    const updated = await Ride.findById(ride._id)
      .populate({ path: "driverId", select: "name vehicle rating" })
      .populate({ path: "riderId", select: "name" });

    return res.json({ message: "รับงานสำเร็จ", ride: updated });
  })
);

/* ===========================================================
   POST /api/rides/check-traffic/:rideId
   - Driver checks traffic using Google Directions and optionally records reroute
   =========================================================== */
/**
 * @swagger
 * /api/rides/check-traffic/{rideId}:
 *   post:
 *     summary: Driver checks traffic for a ride and suggests reroute if heavy
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Traffic checked (may record reroute)
 */
router.post(
  "/check-traffic/:rideId",
  authenticateToken,
  onlyDriver,
  [param("rideId").isMongoId().withMessage("rideId ไม่ถูกต้อง")],
  runValidation,
  asyncHandler(async (req, res) => {
    const ride = await Ride.findById(toObjectId(req.params.rideId));
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

    const callerDriverId = req.user.userId;
    if (!ride.driverId || ride.driverId.toString() !== callerDriverId.toString()) {
      return res.status(403).json({ error: "คุณไม่ได้รับสิทธิ์ตรวจสอบการจราจรของงานนี้" });
    }

    const pickup = ride.pickup;
    const dropoff = ride.dropoff;
    if (!sanitizeCoords(pickup) || !sanitizeCoords(dropoff)) {
      return res.status(400).json({ error: "ตำแหน่ง pickup/dropoff ไม่สมบูรณ์" });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Google Maps API key not configured" });

    const origin = `${pickup.lat},${pickup.lng}`;
    const destination = `${dropoff.lat},${dropoff.lng}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departure_time=now&key=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;
    if (!data.routes || data.routes.length === 0) return res.status(400).json({ error: "ไม่พบเส้นทาง" });

    const legs = data.routes[0].legs[0];
    const durationNormal = legs.duration?.value ?? 0;
    const durationInTraffic = legs.duration_in_traffic?.value ?? durationNormal;
    const delayMinutes = Math.max(0, (durationInTraffic - durationNormal) / 60);

    const steps = legs.steps || [];
    const coords = steps.map(s => ({ lat: s.start_location.lat, lng: s.start_location.lng }));
    if (legs.end_location) coords.push({ lat: legs.end_location.lat, lng: legs.end_location.lng });

    if (delayMinutes > 10) {
      if (!ride.originalRoute || ride.originalRoute.length === 0) ride.originalRoute = coords;
      ride.newRoute = coords;
      ride.rerouted = true;
      if (legs.distance && typeof legs.distance.value === "number") {
        ride.extraDistance = Number((legs.distance.value / 1000).toFixed(2)); // km
      }
      await ride.save();
      return res.json({ message: "เปลี่ยนเส้นทางสำเร็จ (บันทึกในระบบ)", delayMinutes, ride });
    }

    return res.json({ message: "ยังไม่ถึงเกณฑ์เปลี่ยนเส้นทาง", delayMinutes });
  })
);

/* ===========================================================
   POST /api/rides/reroute
   - Driver requests manual reroute (example)
   =========================================================== */
/**
 * @swagger
 * /api/rides/reroute:
 *   post:
 *     summary: Driver requests a reroute (manual)
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rideId, currentLocation, trafficDelayMinutes]
 *             properties:
 *               rideId: { type: string }
 *               currentLocation:
 *                 type: object
 *                 properties: { lat: { type: number }, lng: { type: number } }
 *               trafficDelayMinutes: { type: number }
 */
router.post(
  "/reroute",
  authenticateToken,
  onlyDriver,
  [
    body("rideId").isMongoId().withMessage("rideId ไม่ถูกต้อง"),
    body("currentLocation").notEmpty(),
    body("trafficDelayMinutes").isNumeric()
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { rideId, currentLocation, trafficDelayMinutes } = req.body;
    if (!sanitizeCoords(currentLocation)) return res.status(400).json({ error: "currentLocation ต้องมี lat,lng" });

    const ride = await Ride.findById(toObjectId(rideId));
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

    if (!ride.driverId || ride.driverId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "คุณไม่ได้รับสิทธิ์เปลี่ยนเส้นทางนี้" });
    }

    if (trafficDelayMinutes < 5) return res.json({ message: "ยังไม่ถึงเกณฑ์ reroute" });

    // example new path (in production, call mapping service)
    const newPath = [
      { lat: currentLocation.lat + 0.001, lng: currentLocation.lng + 0.001 },
      { lat: currentLocation.lat + 0.002, lng: currentLocation.lng + 0.002 }
    ];
    const extraDistance = 1.5;

    if (extraDistance > 2) return res.status(400).json({ error: "เส้นทางใหม่อ้อมเกินไป" });

    ride.rerouted = true;
    ride.newRoute = newPath;
    ride.extraDistance = extraDistance;
    await ride.save();

    return res.json({ message: "เปลี่ยนเส้นทางสำเร็จ", newRoute: { newPath, extraDistance }, fareUnchanged: true });
  })
);

/* ===========================================================
   POST /api/rides/complete
   - Driver marks ride as complete
   =========================================================== */
/**
 * @swagger
 * /api/rides/complete:
 *   post:
 *     summary: Driver completes the ride
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rideId]
 *             properties:
 *               rideId: { type: string }
 */
router.post(
  "/complete",
  authenticateToken,
  onlyDriver,
  [body("rideId").isMongoId().withMessage("rideId ไม่ถูกต้อง")],
  runValidation,
  asyncHandler(async (req, res) => {
    const { rideId } = req.body;
    const ride = await Ride.findById(toObjectId(rideId));
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

    if (!ride.driverId || ride.driverId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "คุณไม่ได้รับสิทธิ์จบงานนี้" });
    }

    let suspicious = false;
    try {
      if (typeof ride.completeTrip === "function") {
        await ride.completeTrip({
          fare: ride.fare,
          distance: ride.distance,
          duration: ride.duration
        });
      } else {
        // fallback: mark completed
        ride.status = "completed";
        ride.completedAt = new Date();
        await ride.save();
      }
    } catch (err) {
      // mark suspicious but still complete
      suspicious = true;
      ride.status = "completed";
      ride.completedAt = new Date();
      await ride.save();
    }

    if (suspicious) {
      try {
        await Notification.create({
          userId: toObjectId(process.env.ADMIN_ID),
          title: "แจ้งเตือนการจบงานผิดปกติ",
          message: `คนขับ ${ride.driverId} จบงาน ${ride._id} โดยไม่ผ่านสถานะปกติ`,
          type: "suspicious_ride",
          data: { rideId: ride._id.toString(), driverId: ride.driverId.toString(), riderId: ride.riderId.toString() }
        });
      } catch (e) { /* ignore */ }
    }

    const updated = await Ride.findById(ride._id)
      .populate({ path: "driverId", select: "name" })
      .populate({ path: "riderId", select: "name" });

    return res.json({ message: "จบงานเรียบร้อย", ride: updated });
  })
);

/* ===========================================================
   PATCH /api/rides/confirm-payment/:rideId
   - Driver confirms cash payment
   =========================================================== */
/**
 * @swagger
 * /api/rides/confirm-payment/{rideId}:
 *   patch:
 *     summary: Driver confirms cash payment for a ride
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 */
router.patch(
  "/confirm-payment/:rideId",
  authenticateToken,
  onlyDriver,
  [param("rideId").isMongoId().withMessage("rideId ไม่ถูกต้อง")],
  runValidation,
  asyncHandler(async (req, res) => {
    const ride = await Ride.findById(toObjectId(req.params.rideId));
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

    if (!ride.driverId || ride.driverId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: "คุณไม่ได้รับสิทธิ์ยืนยันการชำระเงิน" });
    }

    if (ride.paymentMethod !== "cash") return res.status(400).json({ error: "ไม่ใช่การชำระแบบเงินสด" });
    if (ride.paymentStatus === "paid") return res.status(400).json({ error: "การชำระเงินถูกยืนยันแล้ว" });

    ride.paymentStatus = "paid";
    ride.paymentTxId = `cash_${new mongoose.Types.ObjectId().toString()}`;
    await ride.save();

    return res.json({ message: "ยืนยันรับเงินสดเรียบร้อย", ride });
  })
);

/* ===========================================================
   GET /api/rides/history
   - Ride history (rider or driver)
   =========================================================== */
/**
 * @swagger
 * /api/rides/history:
 *   get:
 *     summary: Get ride history for the authenticated user (rider/driver)
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 */
router.get(
  "/history",
  authenticateToken,
  [
    query("page").optional().toInt().isInt({ min: 1 }),
    query("limit").optional().toInt().isInt({ min: 1, max: 200 })
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const skip = (page - 1) * limit;

    const filter = { isDeleted: { $ne: true } };
    if (req.user.role === "rider") filter.riderId = toObjectId(req.user.userId);
    else if (req.user.role === "driver") filter.driverId = toObjectId(req.user.userId);
    else return res.status(403).json({ error: "อนุญาตเฉพาะผู้โดยสารหรือคนขับเท่านั้น" });

    const [rides, total] = await Promise.all([
      Ride.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate({ path: "driverId", select: "name vehicle" })
        .populate({ path: "riderId", select: "name" }),
      Ride.countDocuments(filter)
    ]);

    return res.json({ history: rides, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  })
);

module.exports = router;
