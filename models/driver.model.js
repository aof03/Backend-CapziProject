const mongoose = require("mongoose");

/* ===============================
   SUB SCHEMA: KYC
================================ */
const kycSchema = new mongoose.Schema(
  {
    idCardNumber: { type: String, required: true },
    fullName: { type: String, required: true },

    idCardImage: { type: String, required: true },     // URL / path
    selfieImage: { type: String, required: true },     // URL / path
    driverLicenseImage: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },

    verified: {
      type: Boolean,
      default: false
    },

    rejectedReason: {
      type: String,
      default: null
    },

    submittedAt: {
      type: Date,
      default: Date.now
    },

    reviewedAt: Date
  },
  { _id: false }
);

/* ===============================
   DRIVER SCHEMA
================================ */
const driverSchema = new mongoose.Schema(
  {
    /**
     * ใช้ userId เป็น driverId
     * JWT → req.user.userId จะหา Driver ได้ตรง
     */
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    /* ===============================
       VEHICLE (บังคับตอนสมัคร)
    ============================== */
    vehicle: {
      model: {
        type: String,
        required: true,
      },
      color: {
        type: String,
        required: true,
      },
      plate: {
        type: String,
        required: true,
        unique: true,
      },
    },

    vehicleType: {
      type: String,
      enum: ["car", "bike"],
      default: "car",
      index: true,
    },

    /* ===============================
       DRIVER STATUS
    ============================== */
    status: {
      type: String,
      enum: ["offline", "online", "on_trip"],
      default: "offline",
      index: true,
    },

    isAvailable: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ===============================
       LOCATION (GeoJSON)
    ============================== */
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
    },

    lastLocationUpdate: {
      type: Date,
    },

    /* ===============================
       KYC
    ============================== */
    kyc: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      verified: {
        type: Boolean,
        default: false,
      },
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

/* ===============================
   INDEXES
================================ */
driverSchema.index({ location: "2dsphere" });
driverSchema.index({ status: 1, isAvailable: 1 });
driverSchema.index({ userId: 1 });
driverSchema.index({ "vehicle.plate": 1 }, { unique: true });

/* ===============================
   IMPORT OTHER MODELS
================================ */
const Ride = require("./ride.model");

/* ===============================
   INSTANCE METHODS
================================ */

// รับงาน
driverSchema.methods.acceptRide = async function (rideId) {
  if (this.status !== "online" || !this.isAvailable) {
    throw new Error("คนขับยังไม่พร้อมรับงาน");
  }

  const ride = await Ride.acceptById(rideId, this._id);

  this.status = "on_trip";
  this.isAvailable = false;
  await this.save();

  return ride;
};

// จบงาน
driverSchema.methods.completeRide = async function (rideId) {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new Error("ไม่พบงาน");
  }

  if (!ride.driverId.equals(this._id)) {
    throw new Error("คุณไม่ใช่คนขับของงานนี้");
  }

  await ride.completeTrip();

  this.status = "online";
  this.isAvailable = true;
  await this.save();

  return ride;
};

module.exports = mongoose.model("Driver", driverSchema);
