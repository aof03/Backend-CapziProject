const express = require("express");
const router = express.Router();

/* ---------------------------------------------
   Helper: escape XML to prevent TwiML injection
---------------------------------------------- */
const escapeXml = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

/* ---------------------------------------------
   Build TwiML Response (voice = Alice)
---------------------------------------------- */
async function buildTwiML(payload) {
  const rideId = payload?.rideId ? escapeXml(payload.rideId) : "unknown";
  const severity = payload?.severity ? escapeXml(payload.severity) : "unknown";
  const lat = payload?.location?.lat !== undefined ? escapeXml(payload.location.lat) : "n/a";
  const lng = payload?.location?.lng !== undefined ? escapeXml(payload.location.lng) : "n/a";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">New SOS reported. Ride ${rideId}. Severity ${severity}.</Say>
  <Pause length="1"/>
  <Say voice="alice">Location: latitude ${lat}, longitude ${lng}.</Say>
  <Pause length="1"/>
  <Say voice="alice">Please check the Capzi admin console immediately.</Say>
</Response>`;
}

/* ---------------------------------------------
   Handler for both GET and POST
---------------------------------------------- */
const handleRequest = async (req, res) => {
  let raw = req.query.payload || req.body?.payload || req.body;
  let payload = {};

  try {
    if (typeof raw === "string") {
      raw = raw.trim();
      payload = raw.startsWith("{") ? JSON.parse(raw) : {};
    } else if (typeof raw === "object" && raw !== null) {
      payload = raw;
    }
  } catch (err) {
    console.error("Failed to parse Twilio payload:", err);
    payload = {}; // fallback payload
  }

  console.log("📡 Twilio SOS Callback Received:", payload);

  const twiml = await buildTwiML(payload);
  return res.type("text/xml").status(200).send(twiml);
};

/* ---------------------------------------------
   Routes
---------------------------------------------- */
router.get("/twiml/sos", handleRequest);

router.post(
  "/twiml/sos",
  express.urlencoded({ extended: false }),
  express.json(),
  handleRequest
);

module.exports = router;
