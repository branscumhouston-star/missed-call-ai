// ============================================================
//  AI Missed-Call SMS Reply — Webhook Server
//  Stack: Sinch (phone) + Claude Haiku (AI) + Express (server)
//  Deploy free to Railway: railway.app
// ============================================================

import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Salon config ─────────────────────────────────────────────
const SALON_CONFIG = {
  name:        "Glam Nails & Spa",
  phone:       process.env.SINCH_NUMBER, // your Sinch number +12085810360
  services:    "manicures, pedicures, gel, acrylics, waxing, and facials",
  hours:       "Monday–Saturday 9 AM–7 PM, Sunday 10 AM–5 PM",
  bookingLink: "https://glamnauls.glossgenius.com",
  address:     "123 Main St, Neosho MO 64850",
};
// ─────────────────────────────────────────────────────────────

// Build the Claude prompt
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

// Send SMS via Sinch Conversation API
async function sendSinchSMS(to, message) {
  const url = `https://us.conversation.api.sinch.com/v1/projects/${process.env.SINCH_PROJECT_ID}/messages:send`;

  const body = {
    app_id: process.env.SINCH_APP_ID,
    recipient: { identified_by: { channel_identities: [{ channel: "SMS", identity: to }] } },
    message: { text_message: { text: message } },
    channel_priority_order: ["SMS"],
  };

  const credentials = Buffer.from(
    `${process.env.SINCH_KEY_ID}:${process.env.SINCH_KEY_SECRET}`
  ).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sinch API error: ${err}`);
  }

  return response.json();
}

// ── Main webhook — Sinch calls this on every inbound call ─────
app.post("/missed-call", async (req, res) => {
  // Sinch sends caller info in the request body
  const callerNumber =
    req.body.from ||
    req.body.cli ||
    req.body.From ||
    req.body.caller ||
    "Unknown";

  console.log(`📵 Missed call from ${callerNumber}`);

  let smsBody;

  try {
    const aiResponse = await anthropic.messages.create({
      model:      "claude-haiku-4-5",
      max_tokens: 200,
      messages: [{ role: "user", content: buildPrompt(callerNumber) }],
    });

    smsBody = aiResponse.content[0].text.trim();
    console.log(`🤖 Claude reply: ${smsBody}`);
  } catch (err) {
    console.error("Claude API error:", err.message);
    smsBody = `Hi! Sorry we missed you at ${SALON_CONFIG.name}. Book online: ${SALON_CONFIG.bookingLink} or call us back during business hours.`;
  }

  // Send the SMS via Sinch
  try {
    await sendSinchSMS(callerNumber, smsBody);
    console.log(`✅ SMS sent to ${callerNumber}`);
  } catch (err) {
    console.error("Sinch send error:", err.message);
  }

  res.json({ status: "ok" });
});

// Health-check
app.get("/", (req, res) => res.send("✅ NeverMiss AI is running with Sinch."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
