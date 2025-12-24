// models/driver.model.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * GeoJSON schema for storing location (lng, lat)
 */
const geoSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: [0, 0],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length === 2 &&
                 v[0] >= -180 && v[0] <= 180 &&
                 v[1] >= -90 && v[1] <= 90;
        },
        message: "Invalid GeoJSON Point coordinates"
      }
    }
  },
  { _id: false }
);

/* -----------------------------------------
   Main driver schema
----------------------------------------- */
const driverSchema = new mongoose.Schema(
  {
    // Personal
    name: {
      type: String,
      required: [true, "ชื่อเป็นข้อมูลที่จำเป็น"],
      trim: true,
      minlength: [3, "ชื่อต้องมีความยาวอย่างน้อย 3 ตัวอักษร"],
      maxlength: [100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"]
    },

    phone: {
      type: String,
      required: [true, "เบอร์โทรศัพท์เป็นข้อมูลที่จำเป็น"],
      unique: true,
      match: [/^[0-9]{8,15}$/, "เบอร์โทรศัพท์ไม่ถูกต้อง"],
      index: true
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "รูปแบบอีเมลไม่ถูกต้อง"],
      index: true
    },

    password: {
      type: String,
      required: [true, "รหัสผ่านเป็นข้อมูลที่จำเป็น"],
      minlength: [8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร"],
      select: false
    },

    // Vehicle
    vehicle: {
      model: { type: String, required: [true, "รุ่นรถเป็นข้อมูลที่จำเป็น"] },
      plate: {
        type: String,
        required: [true, "ทะเบียนรถเป็นข้อมูลที่จำเป็น"],
        unique: true,
        uppercase: true,
        trim: true
      },
      color: { type: String, required: [true, "สีรถเป็นข้อมูลที่จำเป็น"] },
      year: { type: Number, min: 1990, max: new Date().getFullYear() },
      insurer: { type: String },
      insuranceExpiry: { type: Date }
    },

    // Status & role
    status: {
      type: String,
      enum: ["inactive", "active", "available", "on_ride", "under_review", "rejected", "suspended"],
      default: "inactive",
      index: true
    },

    role: {
      type: String,
      enum: ["driver"],
      default: "driver"
    },

    // Location (GeoJSON)
    location: {
      type: geoSchema,
      default: { type: "Point", coordinates: [0, 0] },
      index: "2dsphere"
    },
    lastLocationUpdate: { type: Date, default: null },

    // Availability
    isAvailable: { type: Boolean, default: false },
    availableFrom: { type: Date, default: null },
    availableUntil: { type: Date, default: null },

    // Rating
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: null }
    },

    totalRides: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0, min: 0, max: 100 },
    cancellationRate: { type: Number, default: 0, min: 0, max: 100 },

    // Verification
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    phoneVerificationToken: { type: String, select: false, default: null },
    phoneVerificationExpire: { type: Date, select: false, default: null },

    /* ----------------------------
       KYC block
       - single, non-duplicated
    ---------------------------- */
    kyc: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        index: true
      },

      fullName: { type: String, default: null },

      idType: { type: String, enum: ["passport", "id_card", "driver_license"], default: null },

      idCardNumber: { type: String, unique: true, sparse: true },
      idCardFrontImage: { type: String, default: null },
      idCardBackImage: { type: String, default: null },

      drivingLicenseNumber: { type: String, unique: true, sparse: true },
      drivingLicenseImage: { type: String, default: null },
      drivingLicenseExpiry: { type: Date, default: null },

      // Criminal record (police clearance)
      criminalRecordImage: { type: String, default: null },
      criminalRecordStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      criminalRecordVerifiedAt: { type: Date, default: null },
      criminalRecordRejectionReason: { type: String, default: null },

      // Selfie with ID (for liveness / identity)
      selfieWithID: { type: String, default: null },

      // verification meta
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: null },
      rejectedAt: { type: Date, default: null },

      // who reviewed (ref Admin) - optional
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
      reviewedAt: { type: Date, default: null }
    },

    // Bank account
    bankAccount: {
      accountName: { type: String, default: null },
      accountNumber: { type: String, select: false, default: null },
      bankName: { type: String, default: null },
      accountType: { type: String, enum: ["savings", "checking"], default: null }
    },

    // Security
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLogin: { type: Date, default: null },

    // Documents array (generic)
    documents: [
      {
        type: {
          type: String,
          enum: ["insurance", "inspection", "registration", "other"]
        },
        url: { type: String },
        expiryDate: { type: Date, default: null },
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],

    notes: { type: String, maxlength: 1000, default: null }
  },
  { timestamps: true }
);

/* -------------------------------------------
   Indexes
------------------------------------------- */
driverSchema.index({ status: 1, isAvailable: 1 });
driverSchema.index({ "rating.average": -1 });
driverSchema.index({ "kyc.status": 1 });
driverSchema.index({ createdAt: -1 });

/* -------------------------------------------
   Pre-save: hash password
------------------------------------------- */
driverSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (err) {
    next(err);
  }
});

/* -------------------------------------------
   Methods
------------------------------------------- */
driverSchema.methods.comparePassword = async function (inputPassword) {
  try {
    // if password not selected, fetch it
    if (!this.password) {
      const fresh = await this.constructor.findById(this._id).select("+password");
      if (!fresh) throw new Error("User not found for password comparison");
      return await bcrypt.compare(inputPassword, fresh.password);
    }
    return await bcrypt.compare(inputPassword, this.password);
  } catch (err) {
    console.error("comparePassword error:", err);
    throw err;
  }
};

driverSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

driverSchema.methods.incLoginAttempts = function () {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: "" } });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

driverSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: "" } });
};

driverSchema.methods.updateLocation = async function (lat, lng) {
  try {
    this.location = { type: "Point", coordinates: [Number(lng), Number(lat)] };
    this.lastLocationUpdate = new Date();
    await this.save();
    return this;
  } catch (err) {
    console.error("updateLocation error:", err);
    throw err;
  }
};

driverSchema.methods.updateRating = async function (newRating) {
  try {
    const totalRating = (this.rating.average || 0) * (this.rating.count || 0) + Number(newRating);
    this.rating.count = (this.rating.count || 0) + 1;
    this.rating.average = Math.round((totalRating / this.rating.count) * 10) / 10;
    this.rating.lastUpdated = new Date();
    await this.save();
    return this;
  } catch (err) {
    console.error("updateRating error:", err);
    throw err;
  }
};

/* -------------------------------------------
   toJSON - remove sensitive fields
------------------------------------------- */
driverSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.phoneVerificationToken;
  delete obj.phoneVerificationExpire;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  if (obj.bankAccount) delete obj.bankAccount.accountNumber;
  return obj;
};

module.exports = mongoose.model("Driver", driverSchema);
