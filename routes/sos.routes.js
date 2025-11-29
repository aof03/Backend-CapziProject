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
 *                   example: รับแจ้งเหตุแล้ว ข้อมูลถูกบันทึก
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
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

// สร้าง limiter ก่อนประกาศ route
const sosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator, // ใช้ helper เพื่อรองรับ IPv6
  message: { error: "คุณแจ้งเหตุ SOS มากเกินไป โปรดลองอีกครั้งภายหลัง" }
});

// ✅ แจ้งเหตุฉุกเฉิน (เฉพาะลูกค้าที่เข้าสู่ระบบ)
router.post("/report", authenticateToken, sosLimiter, async (req, res) => {
  const { riderId, driverId, rideId, location, reason } = req.body;

  if (!reason || !location || !location.lat || !location.lng) {
    return res.status(400).json({ error: "กรุณาระบุเหตุผลและพิกัดให้ครบถ้วน" });
  }

  try {
    const sosReport = new SOS({ riderId, driverId, rideId, location, reason });
    await sosReport.save();

    // ✅ ตรวจสอบก่อน suspend driver (ป้องกันกลั่นแกล้ง)
    if (driverId) {
      const driver = await User.findById(driverId);
      if (driver && driver.role === "driver") {
        // อัปเดตสถานะเป็น under_review แทน suspend ทันที
        driver.status = "under_review";
        await driver.save();
      }
    }

    // ✅ โทรออก 191 หากเหตุร้ายแรง (ตัวอย่าง: reason มีคำว่า "โจร" / "ทำร้าย")
    {
      // call company/emergency when severe
      const severeKeywords = ["โจร", "ทำร้าย", "ข่มขืน", "ทำร้ายร่างกาย"];
      if (severeKeywords.some(k => reason.includes(k))) {
        const { triggerCallToCallCenter } = require("../services/call.service");
        triggerCallToCallCenter({
          sosId: sosReport._id,
          rideId,
          location,
          severity: sosReport.severity,
          riderPhone: req.user?.phone || null
        }).catch(e => console.error("Emergency call failed:", e && e.message));
      }
    }

    res.json({ message: "รับแจ้งเหตุแล้ว ข้อมูลถูกบันทึก", sos: sosReport });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถแจ้งเหตุได้" });
  }
});

module.exports = router;
