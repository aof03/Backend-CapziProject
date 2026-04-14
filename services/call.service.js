const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH || process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM;
const callCenterNumber = process.env.CALL_CENTER_NUMBER;
const APP_BASE_URL = process.env.APP_BASE_URL;

/**
 * callPayload: {
 *   sosId,
 *   rideId,
 *   location: { lat, lng },
 *   severity,
 *   riderPhone
 * }
 */
async function makeCall(callPayload) {
  // --- ตรวจ config ---
  if (!accountSid || !authToken) throw new Error("Twilio credentials missing (TWILIO_SID/TWILIO_AUTH)");
  if (!fromNumber) throw new Error("TWILIO_FROM is missing");
  if (!callCenterNumber) throw new Error("CALL_CENTER_NUMBER is missing");
  if (!APP_BASE_URL) throw new Error("APP_BASE_URL is missing");

  // --- Validate payload fields we will send ---
  const severity = ["low", "medium", "high"].includes(callPayload.severity)
    ? callPayload.severity
    : "unknown";

  const lat = callPayload.location?.lat ?? null;
  const lng = callPayload.location?.lng ?? null;

  const minimalPayload = {
    sosId: callPayload.sosId ?? null,
    rideId: callPayload.rideId ?? null,
    severity,
    location: { lat, lng },
    riderPhone: callPayload.riderPhone ?? null
  };

  // ensure APP_BASE_URL has no trailing slash
  const baseUrl = APP_BASE_URL.replace(/\/+$/, "");

  // build TwiML URL with JSON payload in "payload" query param (routes expects payload)
  const twimlUrl = `${baseUrl}/twiml/sos?payload=${encodeURIComponent(JSON.stringify(minimalPayload))}`;

  // create client after config validated
  const client = twilio(accountSid, authToken);

  try {
    const call = await client.calls.create({
      url: twimlUrl,
      to: callCenterNumber,
      from: fromNumber,
    });

    console.log("📞 Twilio call triggered:", call.sid);
    return call;
  } catch (error) {
    console.error("❌ Twilio call error:", error && error.message ? error.message : error);
    // surface actionable message
    throw new Error(`TWILIO_CALL_FAILED: ${error && error.message ? error.message : "unknown error"}`);
  }
}

module.exports = { makeCall };

