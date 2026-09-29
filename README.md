# ClearTech Minute — YouTube Shorts Channel Agent

A private AI-powered dashboard and production agent built for running an educational YouTube Shorts channel (**ClearTech Minute**). Designed for beginner-friendly operation with strict owner authority, cost limits, factual claim checking, and cryptographic approval binding.

---

## 🌟 What This Agent Does

1. **Topic Research & Evidence Citation:** Researches beginner-friendly technology topics, scores them using an editorial fit rubric (out of 100), and records cited source URLs and extracts.
2. **Idea Board & Duplicate Detection:** Manages video ideas across 3 content pillars (*Everyday Tech*, *AI Basics*, *Practical Digital Safety*) with duplicate check.
3. **Structured Script Studio:** Drafts 4-scene vertical Shorts scripts (35–60 seconds, 80–130 words) with verifiable factual claims, titles, and scene visual prompts.
4. **Factual Claims Verification:** Checks claims against evidence sources before allowing video production.
5. **Media Composer & WebVTT Captions:** Generates 9:16 vertical scene illustrations and narration audio track, then compiles them with synchronized subtitles.
6. **Exact Version Hash Approval:** Cryptographically binds owner approval to the final SHA256 checksum of the video. Any edit to the script immediately invalidates prior approvals for safety.
7. **Channel Connection & Private Upload:** Connects to YouTube via Google OAuth (with Fernet token encryption at rest). Uploads videos strictly as **Private** in accordance with developer audit rules, providing deep links to desktop YouTube Studio.
8. **Native Analytics & Weekly Creative Review:** Displays authentic YouTube metrics (views vs. engaged views, average view retention %, subscribers gained) with actionable creative recommendations.
9. **AI Comment Reply Studio:** Lets the owner review viewer questions and generate concise educational replies with a single click.
10. **8 Automation Safety Gates:** Enforces 8 engineering safety criteria (budget hard-cap, pause switches, approval invalidation, duplicate prevention) before permitting automated batch production.

---

## 🏗️ Architecture & Technology Stack

```
YouTube Channel Agent
├── frontend/           # React + TypeScript + Vite (Port 5173)
│   ├── src/
│   │   ├── App.tsx     # Complete multi-tab creator dashboard
│   │   └── index.css   # Clean, dark-mode responsive styling
└── backend/            # Python FastAPI + SQLAlchemy (Port 8000)
    ├── app/
    │   ├── main.py     # FastAPI entry point & CORS configuration
    │   ├── core/       # Settings, environment, and encryption
    │   ├── db/         # SQLAlchemy models (12 tables) & startup seeder
    │   ├── workflows/  # Budget ledger ($30 limit) and reservation
    │   ├── providers/  # Gemini text, image, and TTS provider adapters
    │   ├── media/      # Video composer & WebVTT caption generator
    │   ├── youtube/    # OAuth 2.0 flow & YouTube Data API client
    │   └── api/        # REST route controllers
    ├── data/media/     # Local rendered video assets & audio files
    └── .env            # Local environment configuration
```

---

## 🚀 Quickstart Guide

### Prerequisites
* **Python 3.11+** installed
* **Node.js v18+** & **npm** installed

### Step 1: Clone & Configure
```bash
git clone https://github.com/IT24101200/YouTube-Channel-Agent.git
cd YouTube-Channel-Agent
```

Open `.env` in the root folder and configure:
```env
# Optional: Add your Google Gemini API key for live AI generation
GENAI_API_KEY="your_api_key_here"

# Default limits
API_MONTHLY_LIMIT=30.0
API_DAILY_LIMIT=3.0
PER_VIDEO_LIMIT=1.0
```
*(Note: If you do not have an API key right now, the app includes built-in offline generators so every button still works!)*

### Step 2: Start the Backend (FastAPI)
In your first terminal:
```bash
cd backend
python -m uvicorn app.main:app --port 8000 --reload
```
> Backend runs at: `http://localhost:8000/api/health`

### Step 3: Start the Frontend (Vite + React)
In your second terminal:
```bash
cd frontend
npm install
npm run dev
```
> Open your browser at: `http://localhost:5173/`

---

## 📱 How to Produce Your First Video

1. **Pick an Idea:** Go to the **Idea Board** or **Pilot & Gates** tab. Choose a question (e.g. *"What is an API?"*) and click **Script Studio**.
2. **Draft & Verify:** Click **Generate Script Draft**. Inspect the 4-scene outline and claims. Click **Verify Claims**.
3. **Generate Media:** Click **Generate Media Assets** to create vertical 9:16 scene cards and voice narration.
4. **Render:** Click **Render Video**. Inspect the vertical preview and audio player.
5. **Approve:** In the **Review & Publishing** tab, click **Approve This Version** (binds to the final SHA256 hash).
6. **Publish / Schedule:** Select a date and click **Schedule Video**. Click **Upload Private** to upload directly to YouTube!

---

## 🔒 Safety & Budget Protections

* **$30 Monthly Hard Cap:** Before every AI call, estimated cost is reserved in `usage_ledger`. Calls are blocked if the cap would be exceeded.
* **Concrete Pause Switches:** Persistent buttons for `Pause Prod` and `Pause Pub` immediately block external generation and releases.
* **Approval Invalidation:** Editing a script after approval automatically invalidates prior approvals to prevent releasing unreviewed changes.
* **Developer Privacy Gate:** All test uploads default strictly to `privacyStatus: private` to respect YouTube API compliance rules.

---

## 📄 License
MIT License. Built for student development and educational channel management.
