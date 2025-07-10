const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  pickup: {
    lat: Number,
    lng: Number,
    address: String
  },
  dropoff: {
    lat: Number,
    lng: Number,
    address: String
  },

  fare: Number,
  priority: { type: Boolean, default: false },
  promoCode: { type: String, default: null },

  rerouted: { type: Boolean, default: false },
  originalRoute: { type: Array, default: [] },
  newRoute: { type: Array, default: [] },
  extraDistance: { type: Number, default: 0 },

  // ✅ ช่องทางชำระเงิน
  paymentMethod: {
    type: String,
    enum: ["cash", "wallet", "credit", "qr", "promptpay"],
    default: "cash"
  },

  // ✅ สถานะการชำระเงิน
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },

  status: {
    type: String,
    enum: ["requested", "accepted", "rerouted", "completed", "cancelled"],
    default: "requested"
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ride", rideSchema);
