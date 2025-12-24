const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

/* ======================================================
   🧱 Admin Schema
====================================================== */
const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "ชื่อเป็นข้อมูลที่จำเป็น"],
      trim: true,
      minlength: [3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"],
      maxlength: [100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"]
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
      required: [true, "รหัสผ่านเป็นข้อมูลที่จำเป็น"],
      minlength: [8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"],
      select: false
    },

    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin"
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active"
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
      default: null,
      validate: {
        validator: function (val) {
          if (!val) return true;
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(val);
        },
        message: "Avatar URL ไม่ถูกต้อง"
      }
    },

    lastLogin: {
      type: Date,
      default: null
    },

    /* 🔐 Security Fields */
    loginAttempts: {
      type: Number,
      default: 0
    },

    lockUntil: {
      type: Date,
      default: null
    },

    resetToken: {
      type: String,
      select: false,
      default: null
    },

    resetTokenExpire: {
      type: Date,
      select: false,
      default: null
    },

    lastPasswordChange: {
      type: Date,
      default: null
    },

    /* 📌 Extra Information */
    notes: {
      type: String,
      default: null,
      maxlength: 500
    },

    department: {
      type: String,
      default: null
    },

    phone: {
      type: String,
      default: null,
      match: [/^[0-9]{8,15}$/, "เบอร์โทรศัพท์ไม่ถูกต้อง"]
    }
  },
  { timestamps: true }
);

/* ======================================================
   🔐 ก่อน save: Hash Password
====================================================== */
adminSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    if (this.isNew) {
      this.lastPasswordChange = new Date();
    } else {
      this.lastPasswordChange = new Date();
    }

    next();
  } catch (err) {
    next(err);
  }
});

/* ======================================================
   🔐 เปรียบเทียบ Password
====================================================== */
adminSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

/* ======================================================
   🔐 Login Attempts (ป้องกัน brute-force)
====================================================== */
adminSchema.methods.incLoginAttempts = function () {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 mins

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

adminSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/* ======================================================
   🔐 สร้าง Reset Token
====================================================== */
adminSchema.methods.generateResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.resetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetTokenExpire = Date.now() + 15 * 60 * 1000;

  return rawToken;
};

/* ======================================================
   📌 Virtual Field (avatar)
====================================================== */
adminSchema.virtual("avatarUrl").get(function () {
  return this.avatar ? this.avatar : null;
});

/* ======================================================
   🧹 Clean JSON Output
====================================================== */
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
