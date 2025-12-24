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
const { body, param, query, validationResult } = require("express-validator");
const RatingReview = require("../models/ratingReview.model");
const Ride = require("../models/ride.model");
const { authenticateToken } = require("../middleware/auth.middleware");
const mongoose = require("mongoose");

/* Helpers */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

/* -------------------------------------------
   POST /submit
   body: { rideId, revieweeId, rating, comment? }
------------------------------------------- */
router.post(
  "/submit",
  authenticateToken,
  [
    body("rideId").isMongoId().withMessage("rideId ไม่ถูกต้อง"),
    body("revieweeId").isMongoId().withMessage("revieweeId ไม่ถูกต้อง"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("rating ต้องเป็นตัวเลข 1-5"),
    body("comment").optional().isString().trim().isLength({ max: 500 }).withMessage("comment สูงสุด 500 ตัวอักษร")
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const { rideId, revieweeId, rating, comment } = req.body;
    const reviewerId = req.user.userId;

    const ride = await Ride.findById(rideId).select("riderId driverId status completedAt");
    if (!ride) return res.status(404).json({ error: "ไม่พบ ride" });

    // ensure reviewer participated
    const isReviewerRider = ride.riderId && ride.riderId.toString() === reviewerId;
    const isReviewerDriver = ride.driverId && ride.driverId.toString() === reviewerId;
    if (!isReviewerRider && !isReviewerDriver) return res.status(403).json({ error: "คุณไม่ได้อยู่ใน ride นี้" });

    // ensure reviewee is the counterpart
    const expectedRevieweeId = isReviewerRider ? ride.driverId?.toString() : ride.riderId?.toString();
    if (!expectedRevieweeId || expectedRevieweeId !== revieweeId) {
      return res.status(400).json({ error: "revieweeId ต้องเป็นผู้ร่วมการเดินทางอีกฝ่ายหนึ่ง" });
    }

    // allow review only after completion (or if completedAt exists)
    if (!(ride.status === "completed" || ride.completedAt)) {
      return res.status(400).json({ error: "สามารถรีวิวได้หลังการเดินทางเสร็จสิ้นเท่านั้น" });
    }

    // delegate creation/validation to model helper (prevents duplicates etc.)
    try {
      const review = await RatingReview.createReview({
        rideId: mongoose.Types.ObjectId(rideId),
        reviewerId: mongoose.Types.ObjectId(reviewerId),
        revieweeId: mongoose.Types.ObjectId(revieweeId),
        role: isReviewerRider ? "rider" : "driver",
        rating,
        comment
      });

      const populated = await RatingReview.findById(review._id)
        .populate("reviewerId", "name avatar")
        .populate("revieweeId", "name avatar");

      return res.status(201).json({ message: "ส่งรีวิวสำเร็จ", review: populated });
    } catch (err) {
      // model may throw validation/duplicate errors
      return res.status(400).json({ error: err.message || "ไม่สามารถสร้างรีวิวได้" });
    }
  })
);

/* -------------------------------------------
   GET /user/:id
   query: page, limit, role, minRating, search
------------------------------------------- */
router.get(
  "/user/:id",
  [
    param("id").isMongoId().withMessage("id ไม่ถูกต้อง"),
    query("page").optional().toInt().isInt({ min: 1 }),
    query("limit").optional().toInt().isInt({ min: 1, max: 200 }),
    query("role").optional().isIn(["rider", "driver"]),
    query("minRating").optional().toInt().isInt({ min: 1, max: 5 }),
    query("search").optional().isString().trim().isLength({ max: 200 })
  ],
  runValidation,
  asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const options = {
      role: req.query.role || null,
      status: "approved",
      visibility: "public",
      page: parseInt(req.query.page || 1, 10),
      limit: Math.min(parseInt(req.query.limit || 20, 10), 200),
      minRating: req.query.minRating ? parseInt(req.query.minRating, 10) : null,
      search: req.query.search || null,
      includeDeleted: false
    };

    const result = await RatingReview.getUserReviews(userId, options);
    return res.json(result);
  })
);

module.exports = router;
