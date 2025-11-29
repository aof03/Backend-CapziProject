const mongoose = require("mongoose");

const EvidenceSchema = new mongoose.Schema({
  type: { type: String, enum: ["photo","audio","video","chat","gps"], required: true },
  url: { type: String }, // เก็บ path หรือ S3 URL
  meta: { type: Object }
}, { _id: false });

const SosSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true, index: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  reason: { type: String, required: true },
  severity: { type: String, enum: ["low","medium","high","critical"], default: "medium" },
  status: { type: String, enum: ["open","investigating","escalated","resolved","cancelled"], default: "open" },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reportedAt: { type: Date, default: Date.now },
  evidence: [EvidenceSchema],
  reporterIp: { type: String },
  reporterDevice: { type: String },
  adminAssigned: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("SOS", SosSchema);



