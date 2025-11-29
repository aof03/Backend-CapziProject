const twilio = require("twilio");
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const fromNumber = process.env.TWILIO_FROM;
const callCenterNumber = process.env.CALL_CENTER_NUMBER; // เบอร์ call center ของบริษัท (human)

const client = twilio(accountSid, authToken);

/**
 * callPayload: { sosId, rideId, location, riderPhone, severity }
 */
async function triggerCallToCallCenter(callPayload) {
  if (!accountSid || !authToken || !fromNumber || !callCenterNumber) {
    throw new Error("Twilio configuration missing");
  }

  // Build a simple TwiML URL or use <Say> with param - here we use TwiML Bin URL or our hosted endpoint which returns TwiML voice instructions
  const twimlUrl = `${process.env.APP_BASE_URL}/twiml/sos?payload=${encodeURIComponent(JSON.stringify(callPayload))}`;

  return client.calls.create({
    url: twimlUrl,
    to: callCenterNumber,
    from: fromNumber
  });
}

module.exports = { triggerCallToCallCenter };
