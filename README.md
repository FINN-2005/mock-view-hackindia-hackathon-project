# MockAI — AI-Powered Interview Simulator

Full stack app: **React + Vite** frontend, **FastAPI** backend, **SQLite** database, **Gemini 2.0 Flash** AI.

---

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# Set your Gemini API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

uvicorn main:app --reload
# Runs on http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Project Structure

```
mockinterview/
├── backend/
│   ├── main.py                     # FastAPI app entry
│   ├── database.py                 # SQLite schema + all CRUD
│   ├── requirements.txt
│   ├── .env
│   ├── routers/
│   │   ├── progress.py             # POST /api/progress/upload, /manual, /check
│   │   ├── profile_router.py       # GET /api/profile, POST /edit-ai
│   │   ├── interview.py            # POST /api/interview/start|next-turn|end
│   │   └── results.py              # GET /api/results
│   └── services/
│       ├── gemini_service.py       # All Gemini calls + system prompts
│       └── file_extractor.py       # PDF + HTML text extraction
│
└── frontend/
    └── src/
        ├── main.jsx
        ├── App.jsx                 # Routes
        ├── index.css               # Design system
        ├── api/client.js           # All API calls
        ├── context/UserContext.jsx # UUID + profile state
        ├── components/Navbar.jsx
        └── pages/
            ├── Home.jsx            # Landing page with carousel
            ├── Progress.jsx        # Resume upload + manual entry
            ├── Profile.jsx         # Hub, growth chart, AI editor
            ├── InterviewConfigurator.jsx
            ├── Interview.jsx       # Video-call UI, mic, code editor
            └── Results.jsx         # Score arc, notes, summary
```

---

## Pages

| Route | Page | What it does |
|-------|------|--------------|
| `/` | Home | Hero carousel, features, CTA |
| `/progress` | Progress | Upload resume/portfolio, or enter manually |
| `/profile` | Profile | Stats hub, growth graph, AI profile editor |
| `/interview-configurator` | Configurator | Configure role, difficulty, round type |
| `/interview` | Interview | Live video-call style interview UI |
| `/results` | Results | Score arc, likelihood bar, notes, retry |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/progress/check/:uuid` | Check if user exists |
| POST | `/api/progress/upload` | Upload resume/portfolio (multipart) |
| POST | `/api/progress/manual` | Manual profile creation |
| GET | `/api/profile/:uuid` | Get profile JSON |
| GET | `/api/profile/:uuid/history` | Get interview history |
| POST | `/api/profile/:uuid/edit-ai` | AI-powered profile edit |
| POST | `/api/interview/start` | Start interview session |
| POST | `/api/interview/next-turn` | Submit answer, get next question |
| POST | `/api/interview/end` | End interview, run evaluation |
| GET | `/api/results/:uuid` | Fetch last results |

---

## Key Design Decisions

- **UUID-based auth** — no passwords, UUID stored in localStorage, passed with every request
- **Gemini JSON retry** — every Gemini call retries until valid JSON is returned (up to 3x)
- **In-memory interview state** — cached for fast access during active sessions, also persisted to SQLite
- **No full resume per turn** — only profile summary + accumulated notes sent to Gemini during interviews (performance)
- **TTS via Web Speech API** — browser-native, no extra service needed
- **STT via Web Speech API** — browser-native mic input with real-time transcript
- **Per-user concurrency lock** — prevents simultaneous `/next-turn` calls for the same user
