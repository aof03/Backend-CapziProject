const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
  },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, default: "admin" }
}, { timestamps: true });

// ✅ Hash password ก่อนบันทึก
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ เมธอดเปรียบเทียบรหัสผ่านตอนล็อกอิน
adminSchema.methods.comparePassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

// ✅ Index
adminSchema.index({ email: 1 });

module.exports = mongoose.model("Admin", adminSchema);
