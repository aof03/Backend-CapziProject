const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500
    },

    type: {
      type: String,
      enum: [
        "ride_request",
        "ride_accepted",
        "ride_started",
        "ride_ended",
        "arrived",
        "payment_success",
        "payment_failed",
        "sos",
        "rating_request",
        "promotion",
        "general",
        "other"
      ],
      default: "other",
      index: true
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium"
    },

    channel: [
      {
        type: String,
        enum: ["push", "email", "sms"]
      }
    ],

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    relatedModel: {
      type: String,
      enum: ["Ride", "Payment", "Driver", "User", "Rating", null],
      default: null
    },

    action: {
      label: String,
      url: String,
      type: {
        type: String,
        enum: ["accept", "reject", "view", "open_app", "navigate"]
      }
    },

    data: {
      type: Object,
      default: {}
    },

    read: {
      type: Boolean,
      default: false,
      index: true
    },

    readAt: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed"],
      default: "pending",
      index: true
    },

    sentAt: {
      type: Date,
      default: null
    },

    deviceToken: {
      type: String,
      default: null
    },

    batchId: {
      type: String,
      default: null,
      index: true
    },

    retryCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },

    errorMessage: {
      type: String,
      default: null
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true
    },

    tags: [{ type: String }],

    // ⭐ Soft Delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    collection: "notifications"
  }
);

/* ======================================================
   INDEXES - Performance
====================================================== */
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ relatedModel: 1, relatedId: 1 });

// TTL auto-delete
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

/* ======================================================
   PRE-SAVE
====================================================== */
notificationSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "sent") {
    this.sentAt = new Date();
  }
  next();
});

/* ======================================================
   STATIC - Create Notification
====================================================== */
notificationSchema.statics.createNotification = async function (data) {
  try {
    if (!data.userId || !data.title || !data.message) {
      throw new Error("userId, title, message เป็นข้อมูลที่จำเป็น");
    }

    return await this.create(data);
  } catch (err) {
    console.error("createNotification error:", err);
    throw err;
  }
};

/* ======================================================
   STATIC - Get Notifications (with pagination)
====================================================== */
notificationSchema.statics.getUserNotifications = async function (userId, options = {}) {
  try {
    const {
      read = null,
      type = null,
      priority = null,
      page = 1,
      limit = 20
    } = options;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    const query = { userId, isDeleted: false };

    if (read !== null) query.read = read;

    if (type) {
      query.type = Array.isArray(type) ? { $in: type } : type;
    }

    if (priority) query.priority = priority;

    const skip = (pageNum - 1) * limitNum;

    const notifications = await this.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({ userId, read: false, isDeleted: false });

    return {
      notifications,
      pagination: {
        total,
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        perPage: limitNum
      },
      unreadCount
    };
  } catch (err) {
    console.error("getUserNotifications error:", err);
    throw err;
  }
};

/* ======================================================
   INSTANCE - Mark as read
====================================================== */
notificationSchema.methods.markAsRead = async function () {
  try {
    if (!this.read) {
      this.read = true;
      this.readAt = new Date();
      await this.save();
    }
    return this;
  } catch (err) {
    console.error("markAsRead error:", err);
    throw err;
  }
};

/* ======================================================
   STATIC - Mark all as read
====================================================== */
notificationSchema.statics.markAllAsRead = async function (userId) {
  try {
    await this.updateMany(
      { userId, read: false, isDeleted: false },
      { read: true, readAt: new Date() }
    );
    return true;
  } catch (err) {
    console.error("markAllAsRead error:", err);
    throw err;
  }
};

/* ======================================================
   STATIC - Soft Delete Notification
====================================================== */
notificationSchema.statics.safeDelete = async function (notificationId, userId) {
  try {
    return await this.updateOne(
      { _id: notificationId, userId },
      { isDeleted: true, deletedAt: new Date() }
    );
  } catch (err) {
    console.error("safeDelete error:", err);
    throw err;
  }
};

/* ======================================================
   STATIC - Unread Count
====================================================== */
notificationSchema.statics.getUnreadCount = async function (userId) {
  try {
    return await this.countDocuments({ userId, read: false, isDeleted: false });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    throw err;
  }
};

/* ======================================================
   toJSON Custom
====================================================== */
notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.isDeleted;
  return obj;
};

module.exports = mongoose.model("Notification", notificationSchema);
