# 🤖 AI Missed-Call SMS — Setup & Deploy Guide

Sends an AI-written text to anyone who calls your salon and doesn't get an answer.
**Cost per salon: ~$5–10/mo. Charge them: $49–99/mo.**

---

## ⚡ Quick Start (15 minutes to live demo)

### Step 1 — Get your API keys (free accounts)

| Service | Where | What you need |
|---|---|---|
| Twilio | twilio.com | Account SID, Auth Token, buy a phone number (~$1.15/mo) |
| Anthropic | console.anthropic.com | API Key (pay-as-you-go, ~$0.0005/reply) |

### Step 2 — Install & run locally

```bash
git clone <your-repo>
cd missed-call-ai
npm install

cp .env.example .env
# Fill in .env with your real keys

npm start
# → Server listening on port 3000
```

### Step 3 — Expose your local server to Twilio (for testing)

Install [ngrok](https://ngrok.com) (free), then:

```bash
ngrok http 3000
# → Forwarding: https://abc123.ngrok.io → localhost:3000
```

Copy the `https://abc123.ngrok.io/missed-call` URL.

### Step 4 — Configure Twilio

1. Go to **twilio.com → Phone Numbers → Manage → Active Numbers**
2. Click your number
3. Under **Voice & Fax → A call comes in**, set:
   - Webhook: `https://abc123.ngrok.io/missed-call`
   - HTTP POST
4. Save

### Step 5 — Test it!

Call your Twilio number from your phone and hang up before it's answered.
Within seconds you'll get a text back from the AI. 🎉

---

## 🚀 Deploy to Railway (free, permanent)

1. Push your code to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add your environment variables in Railway's dashboard (Variables tab)
4. Railway gives you a public URL — paste that into Twilio instead of ngrok

Done. It runs 24/7 for free.

---

## 🏪 Selling to salons — quick pitch

**What to say:**
> "Every missed call is a lost booking. I set up a system that automatically texts anyone who calls and doesn't reach you — it's written by AI so it sounds like you, includes your booking link, and works 24/7. Setup takes me 10 minutes. $79/month."

**Objections & answers:**
- *"We already have voicemail"* → "Voicemail gets ignored. A text gets read in 3 minutes."
- *"Is it complicated?"* → "You do nothing. I handle everything."
- *"What if the message sounds weird?"* → Show them a live demo text right there.

**Onboarding a new salon client:**
1. Buy them a Twilio number (~$1.15/mo, you bill them)
2. Edit `SALON_CONFIG` in `index.js` with their name, services, hours, booking link
3. Set their call forwarding to the Twilio number (most phone carriers let you do this for free)
4. Deploy a fresh Railway instance for them
5. Done — collect $49–99/mo

---

## 🛠 Customizing the AI message

Edit the `buildPrompt()` function in `index.js` to change:
- Tone (more casual, more formal)
- What info to include (special promos, staff names)
- Message length (currently capped at 160 chars = 1 SMS = cheapest)

---

## 💰 Cost breakdown per salon

| Item | Cost |
|---|---|
| Twilio phone number | $1.15/mo |
| SMS (est. 200 missed calls/mo) | ~$1.60/mo |
| Claude Haiku (200 replies) | ~$0.10/mo |
| Railway hosting | Free tier |
| **Your total cost** | **~$3–5/mo** |
| **What you charge** | **$49–99/mo** |
| **Your margin** | **~90%** |
