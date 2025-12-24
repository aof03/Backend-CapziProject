const Queue = require("bull");
const SOS = require("../models/sos.model");
const makeCall = require("./call.service").makeCall; // use exported name
const mongoose = require("mongoose");

// ----------------------
// Queue (Redis config fixed)
// ----------------------
const sosEscalationQueue = new Queue("sos-escalation", {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10)
  }
});

// basic queue event logging
sosEscalationQueue.on("error", (err) => {
  console.error("sosEscalationQueue error:", err);
});
sosEscalationQueue.on("failed", (job, err) => {
  console.error(`sosEscalationQueue job ${job.id} failed:`, err && err.message ? err.message : err);
});

// ----------------------
// Queue Processor
// ----------------------
sosEscalationQueue.process(async (job) => {
  const { sosId } = job.data;
  if (!sosId || !mongoose.isValidObjectId(sosId)) return;

  const sos = await SOS.findById(sosId);
  if (!sos) return;

  // Prevent escalation if already resolved/canceled
  // align with sos.model statuses: pending, acknowledged, resolved, canceled
  if (!["pending", "acknowledged"].includes(sos.status)) {
    return;
  }

  try {
    await makeCall({
      sosId: sos._id,
      rideId: sos.rideId,
      location: sos.location,
      severity: sos.severity || "unknown",
      riderPhone: null
    });

    // mark that escalation attempted — use existing schema fields to avoid schema mismatch
    sos.status = "acknowledged";
    sos.handledAt = sos.handledAt || new Date();
    await sos.save();
  } catch (error) {
    console.error("Auto escalation failed:", error && error.message ? error.message : error);
    throw error; // let bull handle retries/backoff
  }
});

// ----------------------
// Add job to queue
// ----------------------
async function enqueueAutoEscalation({ sosId, delayMs = 5 * 60 * 1000 }) {
  if (!sosId || !mongoose.isValidObjectId(sosId)) throw new Error("invalid sosId");
  await sosEscalationQueue.add(
    { sosId },
    {
      delay: delayMs,
      attempts: 3,
      backoff: { type: "fixed", delay: 60000 },
      jobId: `sos-${sosId}`
    }
  );
}

async function closeQueue() {
  try {
    await sosEscalationQueue.close();
  } catch (e) {
    console.error("Error closing sosEscalationQueue:", e);
  }
}

module.exports = { enqueueAutoEscalation, closeQueue, sosEscalationQueue };
