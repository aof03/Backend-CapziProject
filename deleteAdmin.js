require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/capzi";

async function deleteAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const result = await User.deleteOne({ role: "admin" });
    console.log("Deleted admin:", result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

deleteAdmin();
