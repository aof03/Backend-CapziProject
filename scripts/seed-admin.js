// scripts/seed-admin.js
const mongoose = require("mongoose");
require("dotenv").config();
const Admin = require("../models/admin.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/capzi";

async function connectDB() {
  return mongoose.connect(MONGO_URI);
}

async function seedAdmin() {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    // ตรวจสอบว่ามี super_admin อยู่แล้วหรือไม่
    const existing = await Admin.findOne({ role: "super_admin" }).lean();
    if (existing) {
      console.log("⚠️ Super Admin already exists:", existing.email);
      await mongoose.disconnect();
      return process.exit(0);
    }

    // ⭐ สร้าง super admin ใหม่
    const superAdmin = new Admin({
      name: "Super Admin",
      email: "super@capzi.com",
      phone: "0898765432",
      password: "SuperAdmin@123",   // ผ่าน hashing ด้วย pre-save ใน model
      role: "super_admin",
      status: "active",
      permissions: ["manage_admins", "manage_rides", "manage_payments"]
    });

    await superAdmin.save();
    console.log("🎉 Super Admin created:", superAdmin.email);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

seedAdmin();
