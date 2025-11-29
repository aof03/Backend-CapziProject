const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { 
    type: String, 
    required: true, 
    unique: true, 
    match: /^[0-9]{8,15}$/ 
  },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['rider', 'driver', 'admin'],
    default: 'rider'
  },
  status: {
    type: String,
    enum: ["active", "under_review", "suspended"],
    default: "active"
  },

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

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model("User", userSchema);


