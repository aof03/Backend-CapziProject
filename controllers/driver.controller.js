const Driver = require("../models/driver.model");
const Ride = require("../models/ride.model");

/* ============================================================
   DRIVER GO ONLINE
============================================================ */
exports.goOnline = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.driverId);
    if (!driver) {
      return res.status(404).json({ error: "ไม่พบคนขับ" });
    }

    // 🔐 ตรวจ KYC
    if (
      !driver.kyc ||
      driver.kyc.status !== "approved" ||
      driver.kyc.verified !== true
    ) {
      return res.status(403).json({ error: "ยังไม่ผ่าน KYC" });
    }

    driver.status = "online";
    driver.isOnline = true;

    await driver.save();

    res.json({
      message: "Driver online แล้ว",
      status: driver.status
    });
  } catch (err) {
    console.error("goOnline:", err);
    res.status(500).json({ error: "ไม่สามารถ online ได้" });
  }
};

/* ============================================================
   DRIVER GO OFFLINE
============================================================ */
exports.goOffline = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.user.driverId,
      {
        status: "offline",
        isOnline: false
      },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ error: "ไม่พบคนขับ" });
    }

    res.json({
      message: "Driver offline แล้ว",
      status: driver.status
    });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถ offline ได้" });
  }
};

/* ============================================================
   GET AVAILABLE RIDES
============================================================ */
exports.getAvailableRides = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.driverId);
    if (!driver || driver.status !== "online") {
      return res.status(403).json({ error: "Driver ยังไม่ online" });
    }

    const rides = await Ride.find({
      status: "requested",
      driverId: { $exists: false },
      isDeleted: false
    })
      .sort({ requestedAt: 1 })
      .populate("riderId", "name phone");

    res.json({
      total: rides.length,
      rides
    });
  } catch (err) {
    res.status(500).json({ error: "ดึงงานไม่สำเร็จ" });
  }
};

/* ============================================================
   ACCEPT RIDE (atomic)
============================================================ */
exports.acceptRide = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.driverId);

    if (!driver || driver.status !== "online") {
      return res.status(403).json({ error: "Driver ยังไม่ online" });
    }

    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.rideId,
        status: "requested",
        driverId: { $exists: false }
      },
      {
        driverId: driver._id,
        status: "accepted",
        acceptedAt: new Date()
      },
      { new: true }
    ).populate("riderId", "name phone");

    if (!ride) {
      return res.status(404).json({
        error: "งานถูกยกเลิกหรือมีคนรับไปแล้ว"
      });
    }

    driver.status = "on_trip";
    await driver.save();

    res.json({
      message: "รับงานสำเร็จ",
      ride
    });
  } catch (err) {
    console.error("acceptRide:", err);
    res.status(500).json({ error: "รับงานไม่สำเร็จ" });
  }
};

/* ============================================================
   ARRIVE AT PICKUP
============================================================ */
exports.arriveAtPickup = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.rideId,
      driverId: req.user.driverId,
      status: "accepted"
    });

    if (!ride) {
      return res.status(404).json({ error: "ไม่พบงาน" });
    }

    ride.status = "arrived";
    await ride.save();

    res.json({
      message: "ถึงจุดรับแล้ว",
      ride
    });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถอัปเดตสถานะได้" });
  }
};

/* ============================================================
   START TRIP
============================================================ */
exports.startTrip = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.rideId,
      driverId: req.user.driverId,
      status: "arrived"
    });

    if (!ride) {
      return res.status(400).json({ error: "ยังไม่พร้อมเริ่มงาน" });
    }

    await ride.startTrip();

    res.json({
      message: "เริ่มเดินทาง",
      ride
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================================================
   COMPLETE TRIP
============================================================ */
exports.completeTrip = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.rideId,
      driverId: req.user.driverId,
      status: "on_trip"
    });

    if (!ride) {
      return res.status(400).json({ error: "ไม่สามารถจบงานได้" });
    }

    await ride.completeTrip();

    await Driver.findByIdAndUpdate(req.user.driverId, {
      status: "online"
    });

    res.json({
      message: "จบงานสำเร็จ",
      ride
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================================================
   UPDATE DRIVER LOCATION
============================================================ */
exports.updateDriverLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: "lat และ lng จำเป็นต้องส่งมา"
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      req.user.driverId,
      {
        location: { lat, lng }
      },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ error: "ไม่พบคนขับ" });
    }

    res.json({
      message: "อัปเดตตำแหน่งสำเร็จ",
      location: driver.location
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
