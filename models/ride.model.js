const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

  pickup: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },
  dropoff: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },

  fare: { type: Number, required: true },
  priority: { type: Boolean, default: false },
  promoCode: { type: String, default: null },

  rerouted: { type: Boolean, default: false },
  originalRoute: [{
    lat: Number,
    lng: Number
  }],
  newRoute: [{
    lat: Number,
    lng: Number
  }],
  extraDistance: { type: Number, default: 0 },

  paymentMethod: {
    type: String,
    enum: ["cash", "wallet", "credit", "qr", "promptpay"],
    default: "cash"
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },

  status: {
    type: String,
    enum: ["requested", "accepted", "rerouted", "completed", "cancelled"],
    default: "requested"
  }
}, { timestamps: true });

module.exports = mongoose.model("Ride", rideSchema);
