/**
 * @swagger
 * tags:
 *   name: SOS
 *   description: ระบบแจ้งเหตุฉุกเฉิน
 */

/**
 * @swagger
 * /report:
 *   post:
 *     summary: แจ้งเหตุฉุกเฉิน (เฉพาะลูกค้าที่เข้าสู่ระบบ)
 *     tags: [SOS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: ข้อมูลการแจ้งเหตุฉุกเฉิน
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *               - location
 *             properties:
 *               riderId:
 *                 type: string
 *                 description: ไอดีผู้โดยสาร (ถ้ามี)
 *                 example: 60d0fe4f5311236168a109cb
 *               driverId:
 *                 type: string
 *                 description: ไอดีคนขับที่ถูกรายงาน
 *                 example: 60d0fe4f5311236168a109cd
 *               rideId:
 *                 type: string
 *                 description: ไอดีรายการเดินทางที่เกี่ยวข้อง
 *                 example: 60d0fe4f5311236168a109ce
 *               location:
 *                 type: object
 *                 description: พิกัดตำแหน่งเหตุฉุกเฉิน
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 13.736717
 *                   lng:
 *                     type: number
 *                     example: 100.523186
 *               reason:
 *                 type: string
 *                 description: เหตุผลแจ้งเหตุฉุกเฉิน
 *                 example: "คนขับขับรถประมาท"
 *     responses:
 *       200:
 *         description: แจ้งเหตุฉุกเฉินสำเร็จ พร้อมข้อมูล sos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: รับแจ้งเหตุแล้ว คนขับถูกระงับชั่วคราว
 *                 sos:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109cf
 *                     riderId:
 *                       type: string
 *                     driverId:
 *                       type: string
 *                     rideId:
 *                       type: string
 *                     location:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *                     reason:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: กรุณาระบุเหตุผลและพิกัด
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 *       500:
 *         description: ไม่สามารถแจ้งเหตุได้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่สามารถแจ้งเหตุได้
 */

const express = require("express");
const router = express.Router();
const SOS = require("../models/sos.model");
const User = require("../models/user.model");
const { authenticateToken } = require("../middleware/auth.middleware");

// ✅ แจ้งเหตุฉุกเฉิน (เฉพาะลูกค้าที่เข้าสู่ระบบ)
router.post("/report", authenticateToken, async (req, res) => {
  const { riderId, driverId, rideId, location, reason } = req.body;

  if (!reason || !location) {
    return res.status(400).json({ error: "กรุณาระบุเหตุผลและพิกัด" });
  }

  try {
    const sosReport = new SOS({ riderId, driverId, rideId, location, reason });
    await sosReport.save();

    // ✅ แบนคนขับทันที
    await User.findByIdAndUpdate(driverId, { status: "suspended" });

    // TODO: แจ้งแอดมิน/ศูนย์ (เช่น Firebase Notification, Email ฯลฯ)

    res.json({ message: "รับแจ้งเหตุแล้ว คนขับถูกระงับชั่วคราว", sos: sosReport });
  } catch (err) {
    res.status(500).json({ error: "ไม่สามารถแจ้งเหตุได้" });
  }
});

module.exports = router;
