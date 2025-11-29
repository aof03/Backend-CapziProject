require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/user.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/capzi";

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log("Admin already exists:", existing.phone);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("StrongPassword123", 10);

    const admin = new User({
      name: "Admin Capzi1",
      phone: "0912345678",
      password: hashedPassword,
      role: "admin",
      status: "active"
    });

    await admin.save();
    console.log("Admin created:", admin.phone);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
