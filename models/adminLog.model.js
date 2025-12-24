const mongoose = require("mongoose");

/* ===========================================================
   🧱 Admin Log Schema
   - เก็บบันทึกทุกการกระทำของ Admin
   - ปลอดภัยต่อข้อมูลสำคัญ
   - พร้อมใช้งานใน Production
=========================================================== */
const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true
    },

    action: {
      type: String,
      required: true,
      enum: [
        // User management
        "create_user", "update_user", "delete_user", "suspend_user",
        "activate_user", "reset_user_password",

        // Driver
        "approve_driver", "reject_driver", "suspend_driver", "activate_driver",

        // KYC
        "approve_kyc", "reject_kyc", "request_kyc_revision",

        // Ride
        "cancel_ride", "review_ride_dispute", "adjust_ride_fare",

        // Payment
        "process_refund", "adjust_payment", "dispute_resolution",

        // Admin
        "create_admin", "delete_admin", "update_admin_permissions", "suspend_admin",

        // System
        "view_analytics", "export_data", "system_configuration",
        "login", "logout"
      ],
      index: true
    },

    targetUserId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    targetAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    targetDriverId:{ type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },

    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success"
    },

    description: {
      type: String,
      default: null,
      maxlength: 500
    },

    ipAddress: {
      type: String,
      default: null
      // ❗ ลบ regex เพื่อรองรับ IPv6
    },

    userAgent: {
      type: String,
      default: null
    },

    requestData: {
      type: Object,
      default: null
    },

    changes: {
      before: { type: Object, default: null },
      after:  { type: Object, default: null }
    },

    errorMessage: {
      type: String,
      default: null
    },

    metadata: {
      type: Object,
      default: null
    }
  },
  {
    timestamps: true,
    collection: "admin_logs"
  }
);

/* ===========================================================
   ⛔️ TTL Index (ลบตามคำสั่ง)
   - ถ้าไม่ต้องการให้ Log ลบอัตโนมัติ ควรลบทิ้ง
=========================================================== */
// adminLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });


/* ===========================================================
   🔐 ฟังก์ชัน sanitize ข้อมูล Sensitive
=========================================================== */
function deepSanitize(obj) {
  if (!obj) return obj;

  const forbiddenKeys = ["password", "token", "otp", "newPassword"];

  const clone = JSON.parse(JSON.stringify(obj));

  const clean = (o) => {
    if (!o || typeof o !== "object") return;

    for (const key of Object.keys(o)) {
      if (forbiddenKeys.includes(key)) {
        delete o[key];
      } else if (typeof o[key] === "object") {
        clean(o[key]);
      }
    }
  };

  clean(clone);

  return clone;
}

/* ===========================================================
   📌 Static: Create Log (Auto-Sanitize)
=========================================================== */
adminLogSchema.statics.logAction = async function (logData) {
  try {
    const sanitizedData = deepSanitize(logData.requestData);

    return await this.create({
      ...logData,
      requestData: sanitizedData
    });

  } catch (err) {
    console.error("AdminLog.logAction error:", err);
    throw err;
  }
};


/* ===========================================================
   📌 Static: Query Logs + Pagination + Filters
=========================================================== */
adminLogSchema.statics.findAdminLogs = async function (adminId, options = {}) {
  try {
    const {
      action,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = options;

    const query = { adminId };

    if (action) query.action = action;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const logs = await this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("adminId", "name email")
      .populate("targetUserId", "name phone")
      .populate("targetAdminId", "name email")
      .populate("targetDriverId", "name phone")
      .lean();

    const total = await this.countDocuments(query);

    return {
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page),
        perPage: Number(limit)
      }
    };

  } catch (err) {
    console.error("findAdminLogs error:", err);
    throw err;
  }
};


/* ===========================================================
   📌 Instance: toJSON (deep sanitize)
=========================================================== */
adminLogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return deepSanitize(obj);
};


module.exports = mongoose.model("AdminLog", adminLogSchema);
