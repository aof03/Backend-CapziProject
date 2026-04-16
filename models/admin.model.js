const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "ชื่อเป็นข้อมูลที่จำเป็น"],
      trim: true,
      minlength: 3,
      maxlength: 100
    },

    email: {
      type: String,
      required: [true, "อีเมลเป็นข้อมูลที่จำเป็น"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "รูปแบบอีเมลไม่ถูกต้อง"],
      index: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },

    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin",
      index: true
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true
    },

    permissions: [
      {
        type: String,
        enum: [
          "manage_users",
          "manage_drivers",
          "manage_rides",
          "manage_payments",
          "manage_admins"
        ]
      }
    ],

    avatar: {
      type: String,
      default: null
    },

    phone: {
      type: String,
      match: [/^[0-9]{8,15}$/, "เบอร์โทรศัพท์ไม่ถูกต้อง"]
    },

    department: String,
    notes: {
      type: String,
      maxlength: 500
    },

    lastLogin: Date,

    /* 🔐 Security */
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    resetToken: { type: String, select: false },
    resetTokenExpire: { type: Date, select: false },

    lastPasswordChange: Date,

    /* 🧹 Soft Delete */
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

/* ================================
   🔐 Hash Password
================================ */
adminSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    this.lastPasswordChange = new Date();

    next();
  } catch (err) {
    next(err);
  }
});

/* ================================
   🔐 Compare Password
================================ */
adminSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

/* ================================
   🔐 Login Attempts
================================ */
adminSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

adminSchema.methods.incLoginAttempts = function () {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000;

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

adminSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

/* ================================
   🔐 Reset Token
================================ */
adminSchema.methods.generateResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.resetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetTokenExpire = Date.now() + 15 * 60 * 1000;

  return rawToken;
};

adminSchema.methods.verifyResetToken = function (token) {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  return this.resetToken === hashed && this.resetTokenExpire > Date.now();
};

/* ================================
   🧹 Clean JSON
================================ */
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetToken;
  delete obj.resetTokenExpire;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("Admin", adminSchema);