// models/user.model.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{8,15}$/,
      index: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["rider", "driver", "admin"],
      default: "rider",
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },

    avatar: {
      type: String,
      default: null,
      trim: true,
    },

    address: {
      type: String,
      default: null,
      trim: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ============================================================
   🔧 Pre-save: sanitize + hash password
============================================================ */
userSchema.pre("save", async function (next) {
  if (this.name) this.name = this.name.trim();
  if (this.email) this.email = this.email.trim().toLowerCase();
  if (this.phone) this.phone = this.phone.replace(/\D/g, "");

  if (this.isModified("password")) {
    if (!this.password) return next(); // แก้สำคัญ

    if (this.password.length < 6) {
      return next(new Error("Password must be at least 6 characters"));
    }

    if (!this.password.startsWith("$2b$")) {
      try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      } catch (err) {
        return next(err);
      }
    }
  }

  next();
});

/* ============================================================
   🔒 Compare Password
============================================================ */
userSchema.methods.comparePassword = async function (entered) {
  // โหลด password หากไม่ได้ถูก select
  if (!this.password) {
    const freshUser = await this.constructor
      .findById(this._id)
      .select("+password");

    if (!freshUser || !freshUser.password) {
      throw new Error("Password not available for comparison");
    }

    return bcrypt.compare(entered, freshUser.password);
  }

  return bcrypt.compare(entered, this.password);
};

/* ============================================================
   🔧 Set Password Programmatically
============================================================ */
userSchema.methods.setPassword = async function (plain) {
  if (!plain || plain.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(plain, salt);
  return this;
};

/* ============================================================
   🛡️ Hide sensitive fields
============================================================ */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
