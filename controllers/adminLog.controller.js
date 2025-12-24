const mongoose = require("mongoose");
const AdminLog = require("../models/adminLog.model");

/* =====================================================
   1) ดึง Logs ตาม Admin แบบมี Filter + Pagination
===================================================== */
exports.getAdminLogs = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ error: "adminId ไม่ถูกต้อง" });
    }

    const { action, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    // เรียก function ใน Model (ต้องมี findAdminLogs)
    const { logs, pagination } = await AdminLog.findAdminLogs(adminId, {
      action,
      status,
      startDate,
      endDate,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      message: "ดึงข้อมูล Admin Log สำเร็จ",
      logs,
      pagination
    });

  } catch (err) {
    console.error("getAdminLogs error:", err);
    res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ" });
  }
};


/* =====================================================
   2) รายละเอียด Log รายตัว (with populate)
===================================================== */
exports.getDetailLog = async (req, res) => {
  try {
    const { logId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(logId)) {
      return res.status(400).json({ error: "logId ไม่ถูกต้อง" });
    }

    const log = await AdminLog.findById(logId)
      .populate("adminId", "name email role")
      .populate("targetUserId", "name phone email")
      .populate("targetAdminId", "name email role")
      .populate("targetDriverId", "name phone email vehicle");

    if (!log) {
      return res.status(404).json({ error: "ไม่พบ Log นี้" });
    }

    res.json({
      message: "ดึงรายละเอียด Log สำเร็จ",
      log: log.toJSON()
    });

  } catch (err) {
    console.error("getDetailLog error:", err);
    res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ" });
  }
};


/* =====================================================
   3) ดึง System Logs ทั้งหมด (Filter + Pagination)
===================================================== */
exports.getSystemLogs = async (req, res) => {
  try {
    const { action, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};

    if (action) query.action = action;
    if (status) query.status = status;

    // Filter วันที่
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const logs = await AdminLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("adminId", "name email role")
      .lean();

    const total = await AdminLog.countDocuments(query);

    res.json({
      message: "ดึงข้อมูล System Logs สำเร็จ",
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        perPage: Number(limit)
      }
    });

  } catch (err) {
    console.error("getSystemLogs error:", err);
    res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ" });
  }
};
