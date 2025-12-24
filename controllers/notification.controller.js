const Notification = require("../models/notification.model");

// ✅ Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { read, type, page = 1, limit = 20 } = req.query;

    const { notifications, pagination, unreadCount } = await Notification.getUserNotifications(
      userId,
      {
        read: read ? read === "true" : null,
        type,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    );

    res.json({
      message: "ดึงข้อมูล Notifications สำเร็จ",
      notifications,
      pagination,
      unreadCount
    });
  } catch (err) {
    console.error("getUserNotifications error:", err);
    res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ" });
  }
};

// ✅ Get notification detail
exports.getNotificationDetail = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "ไม่พบ Notification นี้" });
    }

    if (!notification.read) {
      await notification.markAsRead();
    }

    res.json({
      message: "ดึงรายละเอียด Notification สำเร็จ",
      notification
    });
  } catch (err) {
    console.error("getNotificationDetail error:", err);
    res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ" });
  }
};

// ✅ Mark as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "ไม่พบ Notification นี้" });
    }

    await notification.markAsRead();

    res.json({
      message: "ทำเครื่องหมายว่าอ่านแล้ว",
      notification
    });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ error: "ไม่สำเร็จ" });
  }
};

// ✅ Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.markAllAsRead(userId);

    res.json({
      message: "ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว"
    });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    res.status(500).json({ error: "ไม่สำเร็จ" });
  }
};

// ✅ Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      unreadCount
    });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ" });
  }
};

// ✅ Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "ไม่พบ Notification นี้" });
    }

    res.json({
      message: "ลบ Notification สำเร็จ"
    });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ error: "ลบไม่สำเร็จ" });
  }
};