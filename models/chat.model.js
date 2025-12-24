const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: [true, "Ride ID เป็นข้อมูลที่จำเป็น"],
      index: true
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID เป็นข้อมูลที่จำเป็น"],
      index: true
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver ID เป็นข้อมูลที่จำเป็น"],
      index: true
    },

    /* --------------------------
       ประเภทข้อความ
    -------------------------- */
    messageType: {
      type: String,
      enum: ["text", "image", "file", "location", "rating"],
      default: "text"
    },

    /* --------------------------
       เนื้อหาข้อความ
    -------------------------- */
    message: {
      type: String,
      required: [true, "Message เป็นข้อมูลที่จำเป็น"],
      trim: true,
      minlength: 1,
      maxlength: 2000
    },

    /* --------------------------
       ข้อมูลไฟล์แนบ
    -------------------------- */
    attachmentUrl: {
      type: String,
      default: null,
      validate: {
        validator: (v) => !v || /^https?:\/\/.+/i.test(v),
        message: "Attachment URL ไม่ถูกต้อง"
      }
    },

    attachmentName: {
      type: String,
      default: null
    },

    attachmentSize: {
      type: Number,
      default: null
    },

    /* --------------------------
       สถานะข้อความ
    -------------------------- */
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true
    },

    readAt: {
      type: Date,
      default: null
    },

    /* --------------------------
       แก้ไขข้อความ
    -------------------------- */
    isEdited: {
      type: Boolean,
      default: false
    },

    editedAt: {
      type: Date,
      default: null
    },

    originalMessage: {
      type: String,
      default: null
    },

    /* --------------------------
       ลบข้อความ (soft delete)
    -------------------------- */
    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date,
      default: null
    },

    /* --------------------------
       Reactions (emoji)
    -------------------------- */
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: {
          type: String,
          enum: ["😀", "😂", "😍", "😢", "😡", "👍", "👎"]
        }
      }
    ],

    /* --------------------------
       Reply to another message
    -------------------------- */
    replyToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null
    },

    /* --------------------------
       Metadata
    -------------------------- */
    metadata: {
      type: Object,
      default: null
    }
  },
  {
    timestamps: true,
    collection: "chats"
  }
);

/* ===========================================================
   📌 Index เพื่อประสิทธิภาพสูงสุด
=========================================================== */
chatSchema.index({ rideId: 1, createdAt: -1 });
chatSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
chatSchema.index({ receiverId: 1, status: 1, createdAt: -1 });
chatSchema.index({ isDeleted: 1, createdAt: -1 });

/* Soft-delete → auto remove after 30 days */
chatSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000 });


/* ===========================================================
   📌 Pre-save Middleware
=========================================================== */
chatSchema.pre("save", function (next) {
  if (this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }

  if (this.isEdited && !this.editedAt) {
    this.editedAt = new Date();
  }

  next();
});


/* ===========================================================
   📌 Static: Save Message
=========================================================== */
chatSchema.statics.saveMessage = async function (data) {
  try {
    const required = ["rideId", "senderId", "receiverId", "message"];
    for (const f of required) {
      if (!data[f]) throw new Error(`${f} เป็นข้อมูลที่จำเป็น`);
    }

    return await this.create(data);
  } catch (err) {
    console.error("saveMessage error:", err);
    throw err;
  }
};


/* ===========================================================
   📌 Static: Find Chats by Ride
=========================================================== */
chatSchema.statics.findChatsByRide = async function (rideId, options = {}) {
  try {
    const { limit = 50, page = 1, includeDeleted = false } = options;

    const query = { rideId };
    if (!includeDeleted) query.isDeleted = false;

    const skip = (page - 1) * limit;

    const result = await this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "name avatar")
      .populate("receiverId", "name avatar")
      .populate("replyToId");

    const total = await this.countDocuments(query);

    return {
      chats: result.reverse(),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page),
        perPage: Number(limit)
      }
    };
  } catch (err) {
    console.error("findChatsByRide error:", err);
    throw err;
  }
};


/* ===========================================================
   📌 Instance: Mark as Read
=========================================================== */
chatSchema.methods.markAsRead = async function () {
  try {
    this.status = "read";
    this.readAt = new Date();
    await this.save();
    return this;
  } catch (err) {
    console.error("markAsRead error:", err);
    throw err;
  }
};


/* ===========================================================
   📌 Instance: Edit Message
=========================================================== */
chatSchema.methods.editMessage = async function (newMessage) {
  try {
    if (!newMessage || newMessage.trim().length === 0)
      throw new Error("Message ต้องไม่ว่าง");

    if (newMessage.length > 2000)
      throw new Error("Message ต้องไม่เกิน 2000 ตัวอักษร");

    this.originalMessage = this.message;
    this.message = newMessage.trim();
    this.isEdited = true;
    this.editedAt = new Date();

    await this.save();
    return this;
  } catch (err) {
    console.error("editMessage error:", err);
    throw err;
  }
};


/* ===========================================================
   📌 Instance: Soft Delete
=========================================================== */
chatSchema.methods.softDelete = async function () {
  try {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
    return this;
  } catch (err) {
    console.error("softDelete error:", err);
    throw err;
  }
};


/* ===========================================================
   📌 Instance: Add Reaction
=========================================================== */
chatSchema.methods.addReaction = async function (userId, emoji) {
  try {
    const valid = ["😀", "😂", "😍", "😢", "😡", "👍", "👎"];

    if (!valid.includes(emoji)) {
      throw new Error("Emoji ไม่ถูกต้อง");
    }

    const existing = this.reactions.find(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existing) {
      existing.emoji = emoji;
    } else {
      this.reactions.push({ userId, emoji });
    }

    await this.save();
    return this;
  } catch (err) {
    console.error("addReaction error:", err);
    throw err;
  }
};


/* ===========================================================
   📌 Instance: Remove Reaction
=========================================================== */
chatSchema.methods.removeReaction = async function (userId) {
  try {
    this.reactions = this.reactions.filter(
      (r) => r.userId.toString() !== userId.toString()
    );

    await this.save();
    return this;
  } catch (err) {
    console.error("removeReaction error:", err);
    throw err;
  }
};


/* ===========================================================
   📌 Custom toJSON
=========================================================== */
chatSchema.methods.toJSON = function () {
  const obj = this.toObject();

  if (obj.isDeleted) {
    obj.message = "[ข้อความถูกลบแล้ว]";
    obj.attachmentUrl = null;
  }

  return obj;
};


module.exports = mongoose.model("Chat", chatSchema);
