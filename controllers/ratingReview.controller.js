const RatingReview = require("../models/ratingReview.model");
const Ride = require("../models/ride.model");
const Driver = require("../models/driver.model");

// ✅ Create review
exports.createReview = async (req, res) => {
  try {
    const { rideId, rating, comment, reviewType, tags, media, isAnonymous } = req.body;
    const reviewerId = req.user.userId;

    if (!rideId || !rating) {
      return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ error: "ไม่พบการจองรถ" });
    }

    const isRider = ride.riderId.toString() === reviewerId;
    const isDriver = ride.driverId.toString() === reviewerId;

    if (!isRider && !isDriver) {
      return res.status(403).json({ error: "คุณไม่ได้อยู่ใน ride นี้" });
    }

    const revieweeId = isRider ? ride.driverId : ride.riderId;
    const role = isRider ? "rider" : "driver";

    const review = await RatingReview.createReview({
      rideId,
      reviewerId,
      revieweeId,
      role,
      rating,
      comment,
      reviewType,
      tags,
      media,
      isAnonymous
    });

    const reviewee = await Driver.findById(revieweeId);
    if (reviewee) {
      await reviewee.updateRating(rating);
    }

    res.status(201).json({
      message: "สร้าง review สำเร็จ",
      review: review.toJSON()
    });
  } catch (err) {
    console.error("createReview error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get user reviews
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, page = 1, limit = 20, search } = req.query;

    const { reviews, pagination, statistics } = await RatingReview.getUserReviews(
      userId,
      {
        role,
        status: "approved",
        visibility: "public",
        page: parseInt(page),
        limit: parseInt(limit),
        search
      }
    );

    res.json({
      message: "ดึงข้อมูล reviews สำเร็จ",
      reviews: reviews.map(r => r.toJSON()),
      pagination,
      statistics
    });
  } catch (err) {
    console.error("getUserReviews error:", err);
    res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ" });
  }
};

// ✅ Edit review
exports.editReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, reviewType, tags, media } = req.body;
    const userId = req.user.userId;

    const review = await RatingReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "ไม่พบ review นี้" });
    }

    if (review.reviewerId.toString() !== userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์แก้ไข review นี้" });
    }

    await review.editReview({ rating, comment, reviewType, tags, media });

    res.json({
      message: "แก้ไข review สำเร็จ",
      review: review.toJSON()
    });
  } catch (err) {
    console.error("editReview error:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Add response
exports.addResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    const responderId = req.user.userId;

    const review = await RatingReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "ไม่พบ review นี้" });
    }

    await review.addResponse(responderId, content);

    res.json({
      message: "เพิ่ม response สำเร็จ",
      review: review.toJSON()
    });
  } catch (err) {
    console.error("addResponse error:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Mark as helpful
exports.markAsHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    const review = await RatingReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "ไม่พบ review นี้" });
    }

    await review.markAsHelpful(userId);

    res.json({
      message: "บันทึกว่าเป็นประโยชน์สำเร็จ",
      helpful: review.helpfulCount,
      unhelpful: review.unhelpfulCount,
      percentage: review.helpfulPercentage
    });
  } catch (err) {
    console.error("markAsHelpful error:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Report review
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.userId;

    if (!reason) {
      return res.status(400).json({ error: "กรุณาระบุเหตุผล" });
    }

    const review = await RatingReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "ไม่พบ review นี้" });
    }

    await review.reportReview(userId, reason, description);

    res.json({
      message: "รายงาน review สำเร็จ"
    });
  } catch (err) {
    console.error("reportReview error:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    const review = await RatingReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "ไม่พบ review นี้" });
    }

    if (review.reviewerId.toString() !== userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบ review นี้" });
    }

    await review.softDelete("ลบโดยผู้เขียน");

    res.json({
      message: "ลบ review สำเร็จ"
    });
  } catch (err) {
    console.error("deleteReview error:", err);
    res.status(500).json({ error: "ลบไม่สำเร็จ" });
  }
};

// ✅ Admin action
exports.adminActionReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { actionType, reason } = req.body;
    const adminId = req.user.userId;

    if (!actionType || !reason) {
      return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
    }

    const review = await RatingReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "ไม่พบ review นี้" });
    }

    await review.adminAction(adminId, actionType, reason);

    res.json({
      message: `${actionType} review สำเร็จ`
    });
  } catch (err) {
    console.error("adminActionReview error:", err);
    res.status(400).json({ error: err.message });
  }
};