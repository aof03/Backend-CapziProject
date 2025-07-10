/**
 * @swagger
 * tags:
 *   name: RatingReview
 *   description: ระบบให้คะแนนและรีวิวผู้ใช้
 */

/**
 * @swagger
 * /submit:
 *   post:
 *     summary: ส่งรีวิวและคะแนนสำหรับ ride ที่ผู้ใช้เคยร่วม
 *     tags: [RatingReview]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ข้อมูลรีวิวที่ต้องการส่ง
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rideId
 *               - revieweeId
 *               - rating
 *             properties:
 *               rideId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *               revieweeId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: คนขับบริการดีมาก
 *     responses:
 *       200:
 *         description: ส่งรีวิวสำเร็จ พร้อมข้อมูลรีวิวที่บันทึก
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ส่งรีวิวสำเร็จ
 *                 review:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d1fe4f5311236168a109cc
 *                     rideId:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109cb
 *                     reviewerId:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109cd
 *                     revieweeId:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     rating:
 *                       type: number
 *                       example: 4
 *                     comment:
 *                       type: string
 *                       example: คนขับบริการดีมาก
 *                     role:
 *                       type: string
 *                       example: rider
 *       400:
 *         description: กรอกข้อมูลไม่ครบ หรือรีวิวซ้ำแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: กรอกข้อมูลไม่ครบ
 *       403:
 *         description: ผู้รีวิวไม่ได้อยู่ใน ride นี้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: คุณไม่ได้อยู่ใน ride นี้
 *       404:
 *         description: ไม่พบ ride นี้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบ ride นี้
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เกิดข้อผิดพลาด
 */

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: ดูคะแนนเฉลี่ยและรีวิวของผู้ใช้รายหนึ่ง
 *     tags: [RatingReview]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ไอดีของผู้ใช้ที่ต้องการดูคะแนนและรีวิว
 *     responses:
 *       200:
 *         description: คะแนนเฉลี่ย, จำนวนรีวิว และรายการรีวิวทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: string
 *                   nullable: true
 *                   example: "4.50"
 *                 totalReviews:
 *                   type: integer
 *                   example: 10
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60d1fe4f5311236168a109cc
 *                       rideId:
 *                         type: string
 *                         example: 60d0fe4f5311236168a109cb
 *                       reviewerId:
 *                         type: string
 *                         example: 60d0fe4f5311236168a109cd
 *                       revieweeId:
 *                         type: string
 *                         example: 60d0fe4f5311236168a109ca
 *                       rating:
 *                         type: number
 *                         example: 4
 *                       comment:
 *                         type: string
 *                         example: คนขับบริการดีมาก
 *                       role:
 *                         type: string
 *                         example: rider
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: เกิดข้อผิดพลาด
 */

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
