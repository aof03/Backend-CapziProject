// routes/ratingReview.routes.js
const express = require("express");
const router = express.Router();
const RatingReview = require("../models/ratingReview.model");
const Ride = require("../models/ride.model");
const { authenticateToken } = require("../middleware/auth.middleware");

// ✅ ส่งรีวิว
router.post("/submit", authenticateToken, async (req, res) => {
  const { rideId, revieweeId, rating, comment } = req.body;

  if (!rideId || !revieweeId || !rating) {
    return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });
  }

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "ไม่พบ ride นี้" });

    const isReviewerRider = req.user.userId === ride.riderId.toString();
    const isReviewerDriver = req.user.userId === ride.driverId?.toString();

    if (!isReviewerRider && !isReviewerDriver) {
      return res.status(403).json({ error: "คุณไม่ได้อยู่ใน ride นี้" });
    }

    const existing = await RatingReview.findOne({ rideId, reviewerId: req.user.userId });
    if (existing) return res.status(400).json({ error: "คุณรีวิวไปแล้ว" });

    const review = new RatingReview({
      rideId,
      reviewerId: req.user.userId,
      revieweeId,
      rating,
      comment,
      role: isReviewerRider ? "rider" : "driver"
    });

    await review.save();
    res.json({ message: "ส่งรีวิวสำเร็จ", review });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

// ✅ ดูคะแนนเฉลี่ย
router.get("/user/:id", async (req, res) => {
  try {
    const reviews = await RatingReview.find({ revieweeId: req.params.id });

    const average =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
        : null;

    res.json({
      averageRating: average,
      totalReviews: reviews.length,
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;
