# ✦ AI Recruiter — Intelligent Candidate Ranking Engine

> Paste a job description. Get a semantically ranked shortlist in seconds. Powered by Claude.

![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Claude](https://img.shields.io/badge/Claude-Sonnet%204.6-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

---

## What it does

Most ATS systems filter candidates by keywords. AI Recruiter **ranks** them by meaning.

| Capability | How |
|---|---|
| **Deep JD Understanding** | Claude parses the JD into structured intent: role, must-haves, level, domain |
| **Semantic Fit** | Goes beyond keyword overlap — understands that "built distributed systems" implies Go/gRPC even if not stated |
| **Behavioral Signals** | GitHub activity, publications, open-source contributions, career momentum |
| **Multi-axis Scoring** | Composite: 45% semantic · 30% experience · 25% signals |
| **Expert Reasoning** | Every candidate gets a 2–3 sentence AI recruiter narrative |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React)               │
│  JD Input → Demo Templates → Results Dashboard  │
└────────────────────┬────────────────────────────┘
                     │ POST /rank
┌────────────────────▼────────────────────────────┐
│              Backend (FastAPI)                   │
│                                                  │
│  1. parse_job_description()                      │
│     └─ Claude: JD → structured metadata         │
│                                                  │
│  2. compute_activity_score()                     │
│     └─ GitHub, publications, tenure signals     │
│                                                  │
│  3. rank_candidates_with_ai()                    │
│     └─ Claude: JD + all profiles → scored JSON  │
│                                                  │
│  4. compute_overall_score()                      │
│     └─ Weighted composite (45/30/25)            │
│                                                  │
│  5. Sort, rank, return top-K                    │
└─────────────────────────────────────────────────┘
```

### Scoring Dimensions

| Dimension | Weight | What Claude Evaluates |
|---|---|---|
| **Semantic Fit** | 45% | Does the candidate's experience match the JD's *core mission*? |
| **Experience Depth** | 30% | Seniority, domain relevance, impact metrics |
| **Behavioral Signals** | 25% | GitHub, open-source, publications, career velocity |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone

```bash
git clone https://github.com/your-username/ai-recruiter.git
cd ai-recruiter
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
# → API running at http://localhost:8000
# → Swagger docs at http://localhost:8000/docs
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# → UI running at http://localhost:5173
```

### 4. Docker (optional)

```bash
cp backend/.env.example .env
# Edit .env with your ANTHROPIC_API_KEY

docker compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:5173
```

---

## API Reference

### `POST /rank`

Rank all candidates against a job description.

**Request:**
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
      "signal_score": 82.0,
      "experience_score": 85.0,
      "skills_match": ["PyTorch", "MLflow", "Kubernetes", "Spark"],
      "gaps": ["No Kubeflow listed"],
      "strengths": ["NeurIPS publication", "Netflix RecSys background"],
      "reasoning": "Aisha's experience at Netflix building recommendation systems is a direct match..."
    }
  ],
  "ranking_methodology": "Composite score: 45% semantic fit · 30% experience depth · 25% behavioral signals"
}
```

### `GET /candidates`

List all 20 candidates in the dataset.

### `GET /demo-jds`

Returns 3 pre-built job descriptions for quick testing.

---

## Dataset

The PoC ships with **20 richly detailed synthetic candidates** covering:

- ML Engineers, Staff Backend Engineers, Frontend Leads
- Research Scientists, MLOps Engineers, Platform Engineers
- 5 nationalities, global companies (Netflix, Stripe, Figma, ByteDance, Cloudflare...)
- GitHub metadata, publications, open-source signals, career history

To use real candidates, replace `backend/data_loader.py` with your ATS/database connector.

---

## Extending

### Add real ATS data

Replace `load_candidates()` in `data_loader.py`:

```python
def load_candidates():
    # e.g. Greenhouse, Lever, Workday connector
    return your_ats_client.list_candidates()
```

### Add pre-filters

Pass `filters` in the POST body:
```json
{
  "filters": {
    "min_experience": 5,
    "required_skills": ["Go", "Rust"]
  }
}
```

### Tune weights

Edit `compute_overall_score()` in `main.py`:
```python
return round(semantic * 0.45 + experience * 0.30 + signal * 0.25, 2)
```

---

## License

MIT © 2024 — See [LICENSE](LICENSE)
