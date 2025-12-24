const mongoose = require("mongoose");

const ratingReviewSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true
    },

    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    role: {
      type: String,
      enum: ["rider", "driver"],
      required: true
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    comment: {
      type: String,
      default: ""
    },

    reviewType: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "positive"
    },

    tags: {
      type: [String],
      default: []
    },

    media: {
      type: [String],
      default: []
    },

    isAnonymous: {
      type: Boolean,
      default: false
    },

    // ========== System Fields =============
    helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    unhelpful: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    helpfulCount: { type: Number, default: 0 },
    unhelpfulCount: { type: Number, default: 0 },
    helpfulPercentage: { type: Number, default: 0 },

    responses: [
      {
        responderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],

    reports: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        description: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved"
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public"
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

/* ===========================================================
   STATIC METHOD — Create Review
=========================================================== */
ratingReviewSchema.statics.createReview = async function (data) {
  const review = await this.create(data);
  return review;
};

/* ===========================================================
   STATIC METHOD — Get User Reviews (with pagination)
=========================================================== */
ratingReviewSchema.statics.getUserReviews = async function (userId, options = {}) {
  const {
    role,
    status = "approved",
    visibility = "public",
    search = "",
    page = 1,
    limit = 20
  } = options;

  const query = {
    revieweeId: userId,
    status,
    visibility,
    isDeleted: false
  };

  if (role) query.role = role;
  if (search) query.comment = { $regex: search, $options: "i" };

  const skip = (page - 1) * limit;

  const reviews = await this.find(query)
    .populate("reviewerId", "name avatar")
    .populate("revieweeId", "name avatar")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await this.countDocuments(query);

  const statistics = {
    totalReviews: total,
    avgRating:
      (await this.aggregate([
        { $match: query },
        { $group: { _id: null, avg: { $avg: "$rating" } } }
      ]))[0]?.avg || 0
  };

  return {
    reviews,
    pagination: {
      total,
      currentPage: page,
      pages: Math.ceil(total / limit),
      perPage: limit
    },
    statistics
  };
};

/* ===========================================================
   INSTANCE — Edit Review
=========================================================== */
ratingReviewSchema.methods.editReview = async function (data) {
  const { rating, comment, reviewType, tags, media } = data;

  if (rating) this.rating = rating;
  if (comment !== undefined) this.comment = comment;
  if (reviewType) this.reviewType = reviewType;
  if (tags) this.tags = tags;
  if (media) this.media = media;

  await this.save();
  return this;
};

/* ===========================================================
   INSTANCE — Add Response
=========================================================== */
ratingReviewSchema.methods.addResponse = async function (responderId, content) {
  this.responses.push({
    responderId,
    content
  });
  await this.save();
  return this;
};

/* ===========================================================
   INSTANCE — Mark Helpful
=========================================================== */
ratingReviewSchema.methods.markAsHelpful = async function (userId) {
  const alreadyHelpful = this.helpful.includes(userId);
  const alreadyUnhelpful = this.unhelpful.includes(userId);

  // remove from unhelpful
  if (alreadyUnhelpful) {
    this.unhelpful = this.unhelpful.filter((id) => id.toString() !== userId);
  }

  // toggle helpful
  if (alreadyHelpful) {
    this.helpful = this.helpful.filter((id) => id.toString() !== userId);
  } else {
    this.helpful.push(userId);
  }

  this.helpfulCount = this.helpful.length;
  this.unhelpfulCount = this.unhelpful.length;
  const totalVotes = this.helpfulCount + this.unhelpfulCount;
  this.helpfulPercentage =
    totalVotes === 0 ? 0 : Math.round((this.helpfulCount / totalVotes) * 100);

  await this.save();
  return this;
};

/* ===========================================================
   INSTANCE — Report Review
=========================================================== */
ratingReviewSchema.methods.reportReview = async function (
  userId,
  reason,
  description
) {
  this.reports.push({
    userId,
    reason,
    description
  });

  this.status = "pending";
  await this.save();
  return this;
};

/* ===========================================================
   INSTANCE — Soft Delete
=========================================================== */
ratingReviewSchema.methods.softDelete = async function (reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.visibility = "private";
  this.status = "rejected";

  await this.save();
  return this;
};

/* ===========================================================
   INSTANCE — Admin Action
=========================================================== */
ratingReviewSchema.methods.adminAction = async function (
  adminId,
  actionType,
  reason
) {
  if (actionType === "approve") {
    this.status = "approved";
    this.visibility = "public";
  } else if (actionType === "reject") {
    this.status = "rejected";
    this.visibility = "private";
  } else if (actionType === "hide") {
    this.visibility = "private";
  } else if (actionType === "restore") {
    this.visibility = "public";
    this.status = "approved";
  }

  await this.save();
  return this;
};

/* ===========================================================
   EXPORT MODEL
=========================================================== */
module.exports = mongoose.model("RatingReview", ratingReviewSchema);
