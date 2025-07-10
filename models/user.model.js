const mongoose = require("mongoose");



const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },

  role: { type: String, enum: ["rider", "driver"], default: "rider" },
  status: {
    type: String,
    enum: ["active", "under_review", "suspended"],
    default: "active"
  },

  // ✅ เฉพาะคนขับเท่านั้นที่จำเป็นต้องมี KYC
  kyc: {
    idCardNumber: String,
    driverLicenseNumber: String,
    profilePhotoUrl: String,
    idCardPhotoUrl: String,
    licensePhotoUrl: String,
    verifiedAt: Date,
    verifiedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
