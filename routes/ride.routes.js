/**
 * @swagger
 * tags:
 *   name: Ride
 *   description: ระบบเรียกรถ, จัดการการเดินทาง และชำระเงิน
 */

/**
 * @swagger
 * /request:
 *   post:
 *     summary: ลูกค้าเรียกรถใหม่
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ข้อมูลการเรียกรถ
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - riderId
 *               - pickup
 *               - dropoff
 *             properties:
 *               riderId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *               pickup:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 13.736717
 *                   lng:
 *                     type: number
 *                     example: 100.523186
 *               dropoff:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 13.745
 *                   lng:
 *                     type: number
 *                     example: 100.534
 *               priority:
 *                 type: boolean
 *                 description: ความเร่งด่วน (เพิ่มค่าโดยสาร)
 *                 example: false
 *               promoCode:
 *                 type: string
 *                 description: รหัสส่วนลด (ถ้ามี)
 *                 example: PEAKSAFE50
 *               paymentMethod:
 *                 type: string
 *                 description: ช่องทางชำระเงิน
 *                 enum: [cash, wallet, promptpay]
 *                 example: cash
 *     responses:
 *       200:
 *         description: เรียกรถสำเร็จ พร้อมข้อมูล ride
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: เรียกรถสำเร็จ
 *                 ride:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109cb
 *                     riderId:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109cb
 *                     pickup:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                           example: 13.736717
 *                         lng:
 *                           type: number
 *                           example: 100.523186
 *                     dropoff:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                           example: 13.745
 *                         lng:
 *                           type: number
 *                           example: 100.534
 *                     fare:
 *                       type: number
 *                       example: 60
 *                     priority:
 *                       type: boolean
 *                       example: false
 *                     promoCode:
 *                       type: string
 *                       example: PEAKSAFE50
 *                     status:
 *                       type: string
 *                       example: requested
 *                     paymentMethod:
 *                       type: string
 *                       example: cash
 *                     paymentStatus:
 *                       type: string
 *                       example: pending
 *       400:
 *         description: ข้อมูลเรียกรถไม่ครบถ้วนหรือผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เรียกรถไม่สำเร็จ
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       403:
 *         description: สิทธิ์ผู้ใช้ไม่ถูกต้อง
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

/**
 * @swagger
 * /accept:
 *   post:
 *     summary: คนขับรับงานเรียกรถ
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ข้อมูลรับงาน
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rideId
 *               - driverId
 *             properties:
 *               rideId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *               driverId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cd
 *     responses:
 *       200:
 *         description: รับงานสำเร็จ พร้อมข้อมูล ride ที่อัปเดต
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: รับงานของคุณ ลูกค้า สำเร็จ
 *                 ride:
 *                   type: object
 *       404:
 *         description: ไม่พบคำขอเรียกรถ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบคำขอเรียกรถ
 *       500:
 *         description: รับงานไม่สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: รับงานไม่สำเร็จ
 */

/**
 * @swagger
 * /reroute:
 *   post:
 *     summary: คนขับ reroute เปลี่ยนเส้นทางเมื่อเจอรถติด
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ข้อมูล reroute
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rideId
 *               - currentLocation
 *               - trafficDelayMinutes
 *             properties:
 *               rideId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *               currentLocation:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 13.736717
 *                   lng:
 *                     type: number
 *                     example: 100.523186
 *               trafficDelayMinutes:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: เปลี่ยนเส้นทางสำเร็จ หรือยังไม่ถึงเกณฑ์ reroute
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: เปลี่ยนเส้นทางสำเร็จ
 *                 newRoute:
 *                   type: object
 *                   properties:
 *                     newPath:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             example: 13.737
 *                           lng:
 *                             type: number
 *                             example: 100.524
 *                     extraDistance:
 *                       type: number
 *                       example: 1.5
 *                 fareUnchanged:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: เส้นทางใหม่อ้อมเกินไป
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เส้นทางใหม่อ้อมเกินไป
 *       500:
 *         description: เปลี่ยนเส้นทางไม่สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เปลี่ยนเส้นทางไม่สำเร็จ
 */

/**
 * @swagger
 * /check-traffic/{rideId}:
 *   post:
 *     summary: ตรวจจับสภาพจราจรด้วย Google Maps API
 *     tags: [Ride]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *         description: ไอดีรายการเดินทาง
 *     responses:
 *       200:
 *         description: ผลตรวจจับสภาพจราจร และข้อมูล ride
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: เปลี่ยนเส้นทางสำเร็จ (ไม่มีค่าใช้จ่ายเพิ่ม)
 *                 delayMinutes:
 *                   type: number
 *                   example: 12
 *                 ride:
 *                   type: object
 *       400:
 *         description: ไม่พบเส้นทาง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบเส้นทาง
 *       404:
 *         description: ไม่พบ ride
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Ride not found
 *       500:
 *         description: เกิดข้อผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เกิดข้อผิดพลาด
 */

/**
 * @swagger
 * /complete:
 *   post:
 *     summary: คนขับจบงาน
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ไอดีรายการเดินทาง
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rideId
 *             properties:
 *               rideId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *     responses:
 *       200:
 *         description: จบงานสำเร็จ พร้อมข้อมูล ride ที่อัปเดต
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: จบงานเรียบร้อย
 *                 ride:
 *                   type: object
 *       404:
 *         description: ไม่พบรายการเดินทาง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบรายการเดินทาง
 *       500:
 *         description: จบงานไม่สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: จบงานไม่สำเร็จ
 */

/**
 * @swagger
 * /confirm-arrival:
 *   post:
 *     summary: ลูกค้ายืนยันถึงปลายทาง
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ไอดีรายการเดินทาง
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rideId
 *             properties:
 *               rideId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *     responses:
 *       200:
 *         description: ยืนยันถึงที่หมายสำเร็จ พร้อมข้อมูล ride ที่อัปเดต
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ยืนยันถึงที่หมายเรียบร้อย
 *                 ride:
 *                   type: object
 *       500:
 *         description: ยืนยันไม่สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ยืนยันไม่สำเร็จ
 */

/**
 * @swagger
 * /confirm-payment/{rideId}:
 *   patch:
 *     summary: คนขับยืนยันรับเงินสด
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *         description: ไอดีรายการเดินทาง
 *     responses:
 *       200:
 *         description: ยืนยันรับเงินสดสำเร็จ พร้อมข้อมูล ride ที่อัปเดต
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ยืนยันรับเงินสดเรียบร้อย
 *                 ride:
 *                   type: object
 *       400:
 *         description: ไม่ใช่การชำระแบบเงินสด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่ใช่การชำระแบบเงินสด
 *       404:
 *         description: ไม่พบรายการเดินทาง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบรายการเดินทาง
 *       500:
 *         description: ไม่สามารถยืนยันรับเงินสดได้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่สามารถยืนยันรับเงินสดได้
 */

/**
 * @swagger
 * /history:
 *   get:
 *     summary: ดูประวัติการเดินทางของผู้ใช้ (ทั้ง rider และ driver)
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการประวัติการเดินทาง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: สิทธิ์ผู้ใช้ไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: อนุญาตเฉพาะผู้โดยสารหรือคนขับเท่านั้น
 *       500:
 *         description: เกิดข้อผิดพลาดในการดึงประวัติ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่สามารถดึงประวัติการเดินทางได้
 */

const express = require("express");
const router = express.Router();
const axios = require("axios");
const Ride = require("../models/ride.model");
const { authenticateToken, onlyDriver, onlyRider } = require("../middleware/auth.middleware");
const Notification = require("../models/notification.model");

// ✅ ตัวอย่างโค้ดส่วนลด
const promoCodes = {
  PEAKSAFE50: 20,
  FASTGO: 15
};

// ✅ ลูกค้าเรียกรถ
router.post("/request", authenticateToken, onlyRider, async (req, res) => {
  const { riderId, pickup, dropoff, priority, promoCode, paymentMethod } = req.body;

  const distanceKm = 8; // (ควรใช้ Google Maps API คำนวณจริง)
  let baseFare = distanceKm * 5;

  if (priority) baseFare += 20;
  if (promoCode && promoCodes[promoCode]) baseFare -= promoCodes[promoCode];
  const finalFare = Math.max(baseFare, 20);

  try {
    const ride = new Ride({
      riderId,
      pickup,
      dropoff,
      fare: finalFare,
      priority: priority || false,
      promoCode: promoCode || null,
      status: "requested",
      paymentMethod: paymentMethod || "cash", // ✅ เพิ่มระบบชำระเงิน
      paymentStatus: "pending"
    });
    await ride.save();
    res.json({ message: "เรียกรถสำเร็จ", ride });
  } catch (err) {
    res.status(500).json({ error: "เรียกรถไม่สำเร็จ" });
  }
});

// ✅ คนขับรับงาน
router.post("/accept", authenticateToken, onlyDriver, async (req, res) => {
  const { rideId, driverId } = req.body;

  try {
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      {
        driverId,
        status: "accepted"
      },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ error: "ไม่พบคำขอเรียกรถ" });
    }

    const rider = await User.findById(ride.riderId);
    const riderName = rider?.name || "ลูกค้า";

    res.json({
      message: `รับงานของคุณ ${riderName} สำเร็จ`,
      ride
    });
  } catch (err) {
    res.status(500).json({ error: "รับงานไม่สำเร็จ" });
  }
});


// ✅ คนขับ reroute
router.post("/reroute", authenticateToken, onlyDriver, async (req, res) => {
  const { rideId, currentLocation, trafficDelayMinutes } = req.body;

  if (trafficDelayMinutes < 5) {
    return res.json({ message: "ยังไม่ถึงเกณฑ์ reroute" });
  }

  const newRoute = {
    newPath: [
      { lat: currentLocation.lat + 0.001, lng: currentLocation.lng + 0.001 },
      { lat: currentLocation.lat + 0.002, lng: currentLocation.lng + 0.002 }
    ],
    extraDistance: 1.5
  };

  if (newRoute.extraDistance > 2) {
    return res.status(400).json({ error: "เส้นทางใหม่อ้อมเกินไป" });
  }

  try {
    await Ride.findByIdAndUpdate(rideId, {
      rerouted: true,
      newRoute: newRoute.newPath,
      extraDistance: newRoute.extraDistance
    });
    res.json({ message: "เปลี่ยนเส้นทางสำเร็จ", newRoute, fareUnchanged: true });
  } catch (err) {
    res.status(500).json({ error: "เปลี่ยนเส้นทางไม่สำเร็จ" });
  }
});

// ✅ ตรวจจับรถติดด้วย Google Maps API
router.post("/check-traffic/:rideId", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    const { pickup, dropoff } = ride;
    const origin = `${pickup.lat},${pickup.lng}`;
    const destination = `${dropoff.lat},${dropoff.lng}`;

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&departure_time=now&key=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;

    if (!data.routes || data.routes.length === 0) {
      return res.status(400).json({ error: "ไม่พบเส้นทาง" });
    }

    const route = data.routes[0];
    const legs = route.legs[0];

    const durationNormal = legs.duration.value;
    const durationInTraffic = legs.duration_in_traffic.value;
    const delayMinutes = (durationInTraffic - durationNormal) / 60;

    if (delayMinutes > 10) {
      ride.rerouted = true;
      ride.originalRoute = ride.originalRoute.length ? ride.originalRoute : [route.summary];
      ride.newRoute = [route.summary];
      ride.extraDistance = (legs.distance.value / 1000).toFixed(2);
      await ride.save();

      return res.json({
        message: "เปลี่ยนเส้นทางสำเร็จ (ไม่มีค่าใช้จ่ายเพิ่ม)",
        delayMinutes,
        ride
      });
    }

    return res.json({ message: "ยังไม่ถึงเกณฑ์เปลี่ยนเส้นทาง", delayMinutes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

// ✅ คนขับจบงาน
router.post("/complete", authenticateToken, onlyDriver, async (req, res) => {
  const { rideId } = req.body;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

    // ✅ อัปเดตสถานะ
    ride.status = "completed";
    await ride.save();

    // ✅ แจ้งเตือน admin ถ้ายังไม่มีการ confirm-arrival จากผู้โดยสาร
    if (ride.status !== "completed") {
      await Notification.create({
        userId: process.env.ADMIN_ID,
        title: "⚠️ แจ้งเตือนคนขับจบงาน",
        message: `คนขับ (${ride.driverId}) จบงาน ${ride._id} โดยยังไม่มีการยืนยันจากผู้โดยสาร`,
        type: "suspicious_ride",
        data: {
          rideId: ride._id,
          driverId: ride.driverId,
          riderId: ride.riderId
        }
      });
    }

    res.json({ message: "จบงานเรียบร้อย", ride });
  } catch (err) {
    res.status(500).json({ error: "จบงานไม่สำเร็จ" });
  }
});

// ✅ ลูกค้ายืนยันถึงปลายทาง
router.post("/confirm-arrival", authenticateToken, onlyRider, async (req, res) => {
  const { rideId } = req.body;
  try {
    const ride = await Ride.findByIdAndUpdate(rideId, {
      status: "completed"
    }, { new: true });
    res.json({ message: "ยืนยันถึงที่หมายเรียบร้อย", ride });
  } catch (err) {
    res.status(500).json({ error: "ยืนยันไม่สำเร็จ" });
  }
});

// ✅ คนขับยืนยันรับเงินสด
router.patch("/confirm-payment/:rideId", authenticateToken, onlyDriver, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ error: "ไม่พบรายการเดินทาง" });

    if (ride.paymentMethod !== "cash") {
      return res.status(400).json({ error: "ไม่ใช่การชำระแบบเงินสด" });
    }

    ride.paymentStatus = "paid";
    await ride.save();

    res.json({ message: "ยืนยันรับเงินสดเรียบร้อย", ride });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถยืนยันรับเงินสดได้" });
  }
});

// ✅ ประวัติการเดินทางของผู้ใช้ (ทั้ง rider และ driver)
router.get("/history", authenticateToken, async (req, res) => {
  try {
    let rides;

    if (req.user.role === "rider") {
      rides = await Ride.find({ riderId: req.user.userId }).sort({ createdAt: -1 });
    } else if (req.user.role === "driver") {
      rides = await Ride.find({ driverId: req.user.userId }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ error: "อนุญาตเฉพาะผู้โดยสารหรือคนขับเท่านั้น" });
    }

    res.json({ history: rides });
  } catch (err) {
    console.error("Fetch history error:", err);
    res.status(500).json({ error: "ไม่สามารถดึงประวัติการเดินทางได้" });
  }
});


module.exports = router;

