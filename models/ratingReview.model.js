const mongoose = require("mongoose");

const ratingReviewSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["rider", "driver"], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },

  // ✅ Optional fields
  reported: { type: Boolean, default: false },
  reportReason: { type: String, default: null }
}, { timestamps: true });

// ✅ Unique index ป้องกันการรีวิวซ้ำ
ratingReviewSchema.index({ rideId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model("RatingReview", ratingReviewSchema);

