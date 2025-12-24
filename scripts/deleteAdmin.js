require("dotenv").config();
const mongoose = require("mongoose");
// path fixed: seed/ มาอยู่คนละโฟลเดอร์กับ models
const User = require("../models/user.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/capzi";

async function deleteAdmin() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("MongoDB connected");

    // use deleteOne to remove a single admin; use deleteMany to remove all admins
    const result = await User.deleteOne({ role: "admin" });
    console.log("Deleted admin result:", result);

    if (result.deletedCount === 0) {
      console.log("No admin user found to delete.");
    } else {
      console.log(`Deleted ${result.deletedCount} admin user(s).`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error deleting admin:", err);
    try { await mongoose.disconnect(); } catch(e){ /* ignore */ }
    process.exit(1);
  }
}

deleteAdmin();
