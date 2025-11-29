const express = require("express");
const router = express.Router();
router.get("/twiml/sos", (req, res) => {
  const payload = JSON.parse(req.query.payload || "{}");
  // Simple TwiML response
  res.type("text/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say>New SOS reported. Ride ${payload.rideId}. Severity ${payload.severity}.</Say>
      <Pause length="1"/>
      <Say>Location: latitude ${payload.location?.lat}, longitude ${payload.location?.lng}.</Say>
      <Pause length="1"/>
      <Say>Please check the admin console for details.</Say>
    </Response>`);
});
module.exports = router;
