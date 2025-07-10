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

