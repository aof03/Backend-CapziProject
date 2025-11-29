const Queue = require("bull");
const sosEscalationQueue = new Queue("sos-escalation", { redis: { host: process.env.REDIS_HOST } });
const SOS = require("../models/sos.model");
const { triggerCallToCallCenter } = require("./call.service");

sosEscalationQueue.process(async (job) => {
  const { sosId } = job.data;
  const sos = await SOS.findById(sosId);
  if (!sos) return;
  if (sos.status !== "open" && sos.status !== "investigating") {
    return; // already handled
  }

  // escalate: try to call company call center
  try {
    await triggerCallToCallCenter({
      sosId: sos._id,
      rideId: sos.rideId,
      location: sos.location,
      severity: sos.severity,
      riderPhone: null
    });

    sos.status = "escalated";
    await sos.save();
  } catch (e) {
    console.error("Auto escalation failed:", e.message);
    // optionally retry or create admin notification
  }
});

async function enqueueAutoEscalation({ sosId, delayMs = 5 * 60 * 1000 }) {
  await sosEscalationQueue.add({ sosId }, { delay: delayMs, attempts: 3, backoff: 60000 });
}

module.exports = { enqueueAutoEscalation };
