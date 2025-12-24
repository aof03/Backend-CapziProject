// admin-test.js
const axios = require("axios");

const API_BASE = "http://localhost:5000/api";

const adminCredentials = {
  phone: "0812345678", // ใช้เบอร์ Admin จริงจาก database
  password: "admin123" // ใช้รหัส Admin จริง
};

async function runAdminTests() {
  try {
    console.log("🔐 LOGIN ADMIN...");
    const loginRes = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    const token = loginRes.data.token;

    console.log("✅ Admin logged in successfully");
    console.log("🔑 Token:", token);

    const headers = { Authorization: `Bearer ${token}` };

    console.log("\n📌 CHECKING PENDING DRIVERS...");
    const pendingRes = await axios.get(`${API_BASE}/profile/admin/kyc-pending`, { headers });

    const pendingDrivers = pendingRes.data.pendingDrivers || [];
    console.log("📋 Pending Drivers:", pendingDrivers);

    if (pendingDrivers.length === 0) {
      console.log("⚠️ ไม่มีคนขับที่รอตรวจสอบ KYC");
      return;
    }

    const driverId = pendingDrivers[0]._id;
    console.log(`\n📌 Reviewing DriverID = ${driverId}`);

    const reviewRes = await axios.patch(
      `${API_BASE}/profile/admin/kyc-review/${driverId}`,
      { decision: "approve" },   // or "reject"
      { headers }
    );

    console.log("🎉 KYC Review Result:", reviewRes.data);

  } catch (err) {
    console.error("\n❌ ERROR OCCURRED:");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

runAdminTests();
