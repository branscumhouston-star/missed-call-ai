// ============================================================
//  AI Missed-Call SMS Reply — Webhook Server
//  Stack: Twilio (phone) + Claude Haiku (AI) + Express (server)
//  Deploy free to Railway: railway.app
// ============================================================

import express from "express";
import twilio from "twilio";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded bodies

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Salon config ─────────────────────────────────────────────
// In production: store one config row per salon in a DB.
// For the demo, just edit this object.
const SALON_CONFIG = {
  name:        "Glam Nails & Spa",
  phone:       process.env.TWILIO_SALON_PHONE, // your Twilio number e.g. +14175550123
  services:    "manicures, pedicures, gel, acrylics, waxing, and facials",
  hours:       "Monday–Saturday 9 AM–7 PM, Sunday 10 AM–5 PM",
  bookingLink: "https://glamnauls.glossgenius.com", // or any booking URL
  address:     "123 Main St, Neosho MO 64850",
};
// ─────────────────────────────────────────────────────────────

// Build the Claude prompt — keep it tight so Haiku is fast & cheap
function buildPrompt(callerNumber) {
  return `You are a friendly receptionist for ${SALON_CONFIG.name}, a nail salon.
A customer just called and no one could answer. Write a warm, professional SMS reply to send them automatically.

Salon details:
- Services: ${SALON_CONFIG.services}
- Hours: ${SALON_CONFIG.hours}
- Book online: ${SALON_CONFIG.bookingLink}
- Address: ${SALON_CONFIG.address}

Rules:
- Keep it under 160 characters (one SMS) so it's free-tier friendly.
- Be warm and personal, not robotic.
- Always include the booking link.
- Do NOT include any preamble — output ONLY the text message itself.

Caller's number: ${callerNumber}`;
}

// ── Main webhook — Twilio calls this on every missed call ─────
app.post("/missed-call", async (req, res) => {
  const callerNumber = req.body.From;       // who called
  const toNumber     = req.body.To;         // your Twilio number (the salon's number)

  console.log(`📵 Missed call from ${callerNumber} → ${toNumber}`);

  let smsBody;

  try {
    // Ask Claude Haiku to write the reply
    const aiResponse = await anthropic.messages.create({
      model:      "claude-haiku-4-5",
      max_tokens: 200,
      messages: [{ role: "user", content: buildPrompt(callerNumber) }],
    });

    smsBody = aiResponse.content[0].text.trim();
    console.log(`🤖 Claude reply: ${smsBody}`);
  } catch (err) {
    // Fallback message if the API call fails — never leave a caller hanging
    console.error("Claude API error:", err.message);
    smsBody = `Hi! Sorry we missed you at ${SALON_CONFIG.name}. Book online: ${SALON_CONFIG.bookingLink} or call us back during business hours.`;
  }

  // Send the SMS via Twilio
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: smsBody,
      from: toNumber,      // your Twilio number
      to:   callerNumber,  // the person who called
    });

    console.log(`✅ SMS sent to ${callerNumber}`);
  } catch (err) {
    console.error("Twilio send error:", err.message);
  }

  // Twilio expects a TwiML response (even if empty) — this silently ends the call
  res.set("Content-Type", "text/xml");
  res.send(`<Response></Response>`);
});

// Health-check endpoint (Railway uses this to verify the app is up)
app.get("/", (req, res) => res.send("✅ AI Missed-Call SMS is running."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
