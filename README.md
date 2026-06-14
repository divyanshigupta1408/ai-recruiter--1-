<div align="center">

# ✦ AI Recruiter

### Intelligent Candidate Ranking Engine

*Paste a job description. Get a semantically ranked shortlist in seconds.*



---

![AI Recruiter Demo](https://img.shields.io/badge/Status-Production%20Ready-22C55E?style=flat-square)
![Candidates](https://img.shields.io/badge/Candidate%20Pool-20%20Profiles-5B6EF5?style=flat-square)
![API Endpoints](https://img.shields.io/badge/API%20Endpoints-3-00D4C8?style=flat-square)

</div>

---

## 🧠 What Makes This Different

Most ATS systems **filter** candidates by keyword matching. AI Recruiter **ranks** them by meaning.

| Traditional ATS | AI Recruiter |
|---|---|
| Keyword matching | Semantic understanding |
| Binary pass/fail | Multi-dimensional scoring |
| No reasoning | Expert narrative per candidate |
| Ignores behavior | GitHub, publications, career signals |
| Fixed rules | Understands nuanced JD intent |

---

## ✨ Key Capabilities

**🔍 Deep Job Understanding**
Reads your job description and extracts structured intent — role level, core mission, must-haves vs nice-to-haves, domain context — not just keywords.

**🎯 Semantic Fit Scoring**
Goes beyond exact keyword overlap. Understands that "built distributed systems at scale" implies Go/gRPC/Kafka expertise even if not explicitly listed.

**📡 Behavioral Signal Integration**
Scores candidates on GitHub activity, open-source contributions, publications, career velocity, and tenure patterns — signals that resumes alone don't surface.

**📊 Multi-Axis Ranking**
Every candidate gets a composite score across three weighted dimensions, plus a 2–3 sentence AI recruiter narrative explaining exactly why they ranked where they did.

**⚡ Lightning Fast**
Evaluates your entire candidate pool in a single API call. No sequential processing.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                  React Frontend                       │
│   JD Input  ·  Demo Templates  ·  Results Dashboard  │
└─────────────────────┬────────────────────────────────┘
                      │  POST /rank
┌─────────────────────▼────────────────────────────────┐
│                 FastAPI Backend                       │
│                                                       │
│  Stage 1 — parse_job_description()                   │
│            free-text JD → structured intent  │
│                                                       │
│  Stage 2 — compute_activity_score()                  │
│            GitHub stars · contributions · tenure     │
│                                                       │
│  Stage 3 — rank_candidates_with_ai()                 │
│            JD + all profiles → scored JSON   │
│                                                       │
│  Stage 4 — compute_overall_score()                   │
│            Weighted composite: 45 / 30 / 25          │
│                                                       │
│  Stage 5 — Sort · Rank · Return top-K               │
└──────────────────────────────────────────────────────┘
```

### Scoring Formula

| Dimension | Weight | What is Evaluated |
|---|:---:|---|
| **Semantic Fit** | 45% | Does their actual experience match the JD's core mission? |
| **Experience Depth** | 30% | Seniority, domain relevance, measurable impact |
| **Behavioral Signals** | 25% | GitHub, open-source, publications, career momentum |

---

## 📁 Project Structure

```
ai-recruiter/
│
├── backend/
│   ├── main.py              # FastAPI app + all ranking logic
│   ├── data_loader.py       # 20 synthetic candidate profiles
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile
│   └── .env.example         # Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Full React UI (single file)
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml       # One-command full stack
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- An Anthropic API key → [Get one here](https://console.anthropic.com)

---

### Option A — Run Locally

**1. Clone the repository**

```bash
git clone https://github.com/your-username/ai-recruiter.git
cd ai-recruiter
```

**2. Set up the backend**

```bash
cd backend

# Copy the env template and add your API key
cp .env.example .env
# Open .env and set: ANTHROPIC_API_KEY=your_key_here

# Create a virtual environment
python -m venv venv

# Activate it
source venv/bin/activate        # Mac / Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

Backend is live at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

**3. Set up the frontend**

Open a new terminal tab:

```bash
cd frontend
npm install
npm run dev
```

Frontend is live at `http://localhost:5173`

---

### Option B — Docker (one command)

```bash
# Copy and fill in your API key
cp backend/.env.example .env
# Edit .env: ANTHROPIC_API_KEY=your_key_here

# Start everything
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

---

## 📡 API Reference

### `POST /rank`

Rank your entire candidate pool against a job description.

**Request body:**
```json
{
  "job_description": "We are seeking a Senior ML Engineer...",
  "top_k": 10,
  "filters": {
    "min_experience": 3,
    "required_skills": ["Python", "PyTorch"]
  }
}
```

**Response:**
```json
{
  "job_title": "Senior ML Engineer",
  "job_summary": "Lead ML pipeline development for recommendation systems",
  "key_requirements": ["5+ years ML", "PyTorch/TensorFlow", "MLflow", "Kubernetes"],
  "total_candidates_evaluated": 20,
  "ranked_candidates": [
    {
      "rank": 1,
      "candidate_id": "c001",
      "name": "Aisha Patel",
      "overall_score": 87.4,
      "semantic_score": 91.0,
      "experience_score": 85.0,
      "signal_score": 82.0,
      "skills_match": ["PyTorch", "MLflow", "Kubernetes", "Spark"],
      "strengths": ["NeurIPS 2022 publication", "Netflix RecSys background"],
      "gaps": ["No Kubeflow experience listed"],
      "reasoning": "Aisha's 3 years at Netflix building recommendation systems is a direct mission match..."
    }
  ],
  "ranking_methodology": "Composite: 45% semantic · 30% experience · 25% signals"
}
```

### `GET /candidates`

Returns all 20 candidates in the dataset.

### `GET /demo-jds`

Returns 3 pre-built job descriptions for quick testing.

---

## 👥 Candidate Dataset

The PoC ships with **20 richly detailed synthetic candidates** representing a realistic diverse talent pool:

- **Roles covered:** ML Engineers, Staff Backend Engineers, Frontend Leads, Research Scientists, MLOps Engineers, Platform Engineers, Data Engineers, Security Engineers
- **Companies represented:** Netflix, Stripe, Figma, ByteDance, Cloudflare, Meta AI, Cohere, Databricks, DeepMind, Spotify, and more
- **Signals included:** GitHub repos, stars, contribution frequency, popular projects, publications, open-source contributions, endorsements, career history

To plug in real candidates, replace `load_candidates()` in `backend/data_loader.py` with your ATS connector.

---

## 🔧 Extending the System

### Connect a real ATS

```python
# backend/data_loader.py
def load_candidates():
    # Greenhouse, Lever, Workday, or your own database
    return your_ats_client.list_candidates()
```

### Tune the scoring weights

```python
# backend/main.py — compute_overall_score()
return round(semantic * 0.45 + experience * 0.30 + signal * 0.25, 2)
```

### Add pre-filters

Pass `filters` in the POST body to narrow candidates before AI ranking:

```json
{
  "filters": {
    "min_experience": 5,
    "required_skills": ["Go", "Rust"]
  }
}
```

### Add more behavioral signals

Extend `compute_activity_score()` in `main.py` with any signals your data includes — LeetCode ratings, blog posts, conference talks, referrals, etc.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Claude Sonnet 4.6 (Anthropic) |
| Backend | FastAPI + Python 3.11 |
| Frontend | React 18 + Vite |
| Containerization | Docker + Docker Compose |
| API Validation | Pydantic v2 |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2024 — See [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ using  [FastAPI](https://fastapi.tiangolo.com) · [React](https://react.dev)

</div>

