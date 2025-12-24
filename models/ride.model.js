const mongoose = require("mongoose");

const coordSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const routePointSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const rideSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },

  pickup: { type: coordSchema, required: true },
  dropoff: { type: coordSchema, required: true },

  estimatedFare: Number,
  fare: Number,

  priority: { type: String, enum: ["normal", "high"], default: "normal" },
  promoCode: { type: String, default: null },

  status: {
    type: String,
    enum: [
      "requested",
      "accepted",
      "driver_en_route",
      "arrived",
      "on_trip",
      "completed",
      "cancelled"
    ],
    default: "requested"
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "wallet", "promptpay", "card"],
    default: "cash"
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },

  paymentTxId: { type: String, default: null },

  requestedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  startAt: { type: Date },
  completedAt: { type: Date },

  rerouted: { type: Boolean, default: false },
  originalRoute: [routePointSchema],
  newRoute: [routePointSchema],
  extraDistance: { type: Number, default: 0 }, // km

  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

/* -------------------------------
   INSTANCE METHODS
--------------------------------*/

// Accept Ride
rideSchema.methods.accept = async function (driverId) {
  if (this.status !== "requested") {
    throw new Error("สถานะงานไม่พร้อมให้รับ");
  }
  this.driverId = driverId;
  this.status = "accepted";
  this.acceptedAt = new Date();
  return this.save();
};

// Start trip
rideSchema.methods.startTrip = async function () {
  if (this.status !== "arrived") throw new Error("ยังไม่พร้อมเริ่มงาน");
  this.status = "on_trip";
  this.startAt = new Date();
  return this.save();
};

// Complete trip
rideSchema.methods.completeTrip = async function () {
  if (this.status !== "on_trip") {
    throw new Error("สถานะไม่ใช่ on_trip");
  }
  this.status = "completed";
  this.completedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Ride", rideSchema);
