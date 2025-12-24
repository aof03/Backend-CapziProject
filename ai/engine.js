const geolib = require("geolib");

/* ==========================================================
   📌 คำนวณระยะทางระหว่างจุด 2 จุด (รองรับ lat/lng หรือ latitude/longitude)
========================================================== */
const calculateDistance = (point1, point2) => {
  const p1 = {
    latitude: point1?.lat ?? point1?.latitude,
    longitude: point1?.lng ?? point1?.longitude,
  };

  const p2 = {
    latitude: point2?.lat ?? point2?.latitude,
    longitude: point2?.lng ?? point2?.longitude,
  };

  if (
    typeof p1.latitude !== "number" ||
    typeof p1.longitude !== "number" ||
    typeof p2.latitude !== "number" ||
    typeof p2.longitude !== "number"
  ) {
    throw new Error("Invalid coordinates: lat/lng must be numbers");
  }

  // geolib → ระยะทางเป็น "เมตร"
  const meters = geolib.getDistance(p1, p2);

  return meters / 1000; // km
};

/* ==========================================================
   🚕 เลือกคนขับที่ดีที่สุด:
   - ออนไลน์
   - ไม่ติดงาน
   - ผ่าน KYC แล้ว
   - มี location valid
   - อยู่ใกล้ที่สุด
========================================================== */
const matchDriver = (pickup, drivers = []) => {
  if (!drivers.length) return null;

  let bestDriver = null;
  let minDistance = Infinity;

  drivers.forEach((driver) => {
    try {
      // คัดเฉพาะคนที่พร้อมรับงาน
      if (
        driver.status !== "online" ||
        driver.inRide === true ||
        driver?.kyc?.status !== "approved"
      ) {
        return;
      }

      // ตรวจสอบ location format
      if (
        !driver.location ||
        typeof driver.location.lat !== "number" ||
        typeof driver.location.lng !== "number"
      ) {
        return;
      }

      const distance = calculateDistance(pickup, driver.location);

      if (distance < minDistance) {
        minDistance = distance;
        bestDriver = driver;
      }
    } catch (err) {
      // ถ้าคนขับบางคน location ผิดรูปแบบ จะไม่ทำให้ระบบล่ม
      console.warn("Invalid driver location:", driver?._id || "unknown");
    }
  });

  return bestDriver;
};

/* ==========================================================
   🛡 ระบบตรวจสอบความปลอดภัยพื้นฐาน
========================================================== */
const safetyCheck = (data = {}) => {
  const alerts = [];

  if (data.speed > 120) alerts.push("Overspeeding");
  if (data.brakeForce > 0.7) alerts.push("Hard Brake");
  if (data.turnForce > 0.7) alerts.push("Dangerous Turn");
  if (data.stopTime > 300) alerts.push("Stopped too long");

  return {
    safe: alerts.length === 0,
    alerts,
  };
};

/* ==========================================================
   💰 ระบบคำนวณค่าโดยสาร Capzi (ปรับอัลกอริทึม + กันค่าติดลบ)
========================================================== */
const calculateFare = (distanceKm, options = {}) => {
  const {
    priority = false,
    promoCode = null,
    vehicleType = "bike", // bike | car | premium
  } = options;

  if (typeof distanceKm !== "number" || distanceKm <= 0) {
    throw new Error("Invalid distanceKm: must be positive number");
  }

  // ฐานราคาต่อประเภท
  const ratePerKm = {
    bike: 5,
    car: 8,
    premium: 15,
  };

  const rate = ratePerKm[vehicleType] || ratePerKm["bike"];

  let fare = distanceKm * rate;

  // Priority เพิ่มราคา (ด่วน)
  if (priority) fare += 20;

  // โปรโมชั่น
  const promo = {
    PEAKSAFE50: 20,
    FASTGO: 15,
    NEWUSER20: 20,
  };

  if (promoCode && promo[promoCode]) {
    fare -= promo[promoCode];
  }

  // ห้ามต่ำกว่า 20 บาท
  return Math.max(20, Math.round(fare));
};

module.exports = {
  calculateDistance,
  matchDriver,
  safetyCheck,
  calculateFare,
};
