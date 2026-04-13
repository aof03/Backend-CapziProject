const Ride = require("../models/ride.model");
const Driver = require("../models/driver.model");

/* ============================================================
   REQUEST RIDE (RIDER)
============================================================ */
exports.requestRide = async (req, res) => {
  try {
    const riderId = req.user.userId;
    const { pickup, destination } = req.body;

    if (!pickup || !destination) {
      return res.status(400).json({ error: "ต้องระบุ pickup และ destination" });
    }

    /* ----------------------------------------
       ตรวจว่ามี driver online อยู่หรือไม่
       (ไม่ผูก ride กับ driver ตอนนี้)
    ----------------------------------------- */
    const hasDriver = await Driver.exists({
      status: "active",
      isAvailable: true
    });

    if (!hasDriver) {
      return res.status(404).json({
        error: "ไม่มีคนขับใกล้เคียง"
      });
    }

    /* ----------------------------------------
       สร้าง Ride (ให้ driver มา accept ทีหลัง)
    ----------------------------------------- */
    const ride = await Ride.create({
      riderId,                 // ✅ ใช้ชื่อเดียวกับทั้งระบบ
      pickup,
      dropoff: destination,    // ✅ map ให้ตรง model
      status: "requested"
      // ❌ ไม่ใส่ driverId
    });

    res.status(201).json({
      message: "เรียกรถสำเร็จ",
      ride
    });

  } catch (err) {
    console.error("requestRide error:", err);
    res.status(500).json({ error: "ไม่สามารถเรียกรถได้" });
  }
};
