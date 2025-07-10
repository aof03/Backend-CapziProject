const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // จะถูก hash อัตโนมัติ
  name: String,
  role: { type: String, default: "admin" }
});

// ✅ Hash password ก่อนบันทึก
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ เมธอดเปรียบเทียบรหัสผ่านตอนล็อกอิน
adminSchema.methods.comparePassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
