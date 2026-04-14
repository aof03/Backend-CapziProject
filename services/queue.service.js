const Queue = require("bull");
const SOS = require("../models/sos.model");
const makeCall = require("./call.service").makeCall;
const mongoose = require("mongoose");

// ----------------------
// Queue Config
// ----------------------
const sosEscalationQueue = new Queue("sos-escalation", {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10)
  }
});

// ----------------------
// Logging
// ----------------------
sosEscalationQueue.on("error", (err) => {
  console.error("❌ Queue error:", err);
});

sosEscalationQueue.on("failed", async (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);

  // mark failed after max attempts
  if (job.attemptsMade >= 3) {
    await SOS.findByIdAndUpdate(job.data.sosId, {
      status: "failed",
      failureReason: err.message,
      failedAt: new Date()
    });
  }
});

// ----------------------
// Helper: timeout wrapper
// ----------------------
const withTimeout = (promise, ms = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("CALL_TIMEOUT")), ms)
    )
  ]);
};

// ----------------------
// Processor (Concurrency = 5)
// ----------------------
sosEscalationQueue.process(5, async (job) => {
  const { sosId } = job.data;

  if (!sosId || !mongoose.isValidObjectId(sosId)) return;

  // 🔒 Lock เพื่อกันยิงซ้ำ (สำคัญมาก)
  const sos = await SOS.findOneAndUpdate(
    {
      _id: sosId,
      escalationLocked: { $ne: true },
      status: { $in: ["pending", "acknowledged"] }
    },
    {
      $set: { escalationLocked: true }
    },
    { new: true }
  );

  if (!sos) return;

  try {
    console.log("🚨 Escalating SOS:", sosId);

    await withTimeout(
      makeCall({
        sosId: sos._id,
        rideId: sos.rideId,
        location: sos.location,
        severity: sos.severity || "unknown",
        riderPhone: null
      }),
      10000
    );

    // ✅ อัปเดตสถานะใหม่ (แยก escalated ออกจาก acknowledged)
    sos.status = "escalated";
    sos.escalatedAt = new Date();
    sos.handledAt = sos.handledAt || new Date();

    await sos.save();

    console.log("✅ SOS escalated:", sosId);
  } catch (error) {
    console.error("❌ Escalation failed:", error.message);

    // unlock เพื่อ retry รอบถัดไป
    await SOS.findByIdAndUpdate(sosId, {
      $unset: { escalationLocked: 1 }
    });

    throw error; // ให้ bull retry
  }
});

// ----------------------
// Add job
// ----------------------
async function enqueueAutoEscalation({ sosId, delayMs = 5 * 60 * 1000 }) {
  if (!sosId || !mongoose.isValidObjectId(sosId)) {
    throw new Error("invalid sosId");
  }

  await sosEscalationQueue.add(
    { sosId },
    {
      delay: delayMs,
      attempts: 3,
      backoff: { type: "fixed", delay: 60000 },
      removeOnComplete: true,
      removeOnFail: false,
      jobId: `sos-${sosId}`
    }
  );
}

// ----------------------
// Graceful shutdown
// ----------------------
async function closeQueue() {
  try {
    await sosEscalationQueue.close();
    console.log("🛑 Queue closed");
  } catch (e) {
    console.error("Error closing queue:", e);
  }
}

module.exports = {
  enqueueAutoEscalation,
  closeQueue,
  sosEscalationQueue
};