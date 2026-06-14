"""
AI Recruiter Backend — FastAPI + Claude-powered semantic ranking engine
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import anthropic
import json
import re
import math
from data_loader import load_candidates

app = FastAPI(title="AI Recruiter API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic()

# ─── Pydantic models ──────────────────────────────────────────────────────────

class RankRequest(BaseModel):
    job_description: str
    top_k: Optional[int] = 10
    filters: Optional[dict] = {}

class CandidateScore(BaseModel):
    candidate_id: str
    name: str
    overall_score: float
    semantic_score: float
    signal_score: float
    experience_score: float
    skills_match: list[str]
    gaps: list[str]
    strengths: list[str]
    reasoning: str
    rank: int

class RankResponse(BaseModel):
    job_title: str
    job_summary: str
    key_requirements: list[str]
    total_candidates_evaluated: int
    ranked_candidates: list[CandidateScore]
    ranking_methodology: str

# ─── Core ranking engine ──────────────────────────────────────────────────────

RANKING_SYSTEM_PROMPT = """You are an elite AI talent acquisition specialist with deep expertise in:
- Semantic understanding of job requirements vs candidate profiles
- Behavioral signal analysis (GitHub activity, project impact, career velocity)
- Contextual fit beyond keyword matching
- Cultural and growth trajectory assessment

You evaluate candidates holistically, not just on keyword overlap.

SCORING DIMENSIONS (each 0–100):
1. semantic_score: How deeply does the candidate's experience align with the JD's core mission?
2. signal_score: Behavioral signals — GitHub activity, projects, endorsements, career momentum
3. experience_score: Seniority depth, domain relevance, impact metrics

For each candidate you MUST return strictly valid JSON with exactly this structure:
{
  "candidate_id": "string",
  "semantic_score": number,
  "signal_score": number,
  "experience_score": number,
  "skills_match": ["skill1", "skill2"],
  "gaps": ["gap1", "gap2"],
  "strengths": ["strength1", "strength2"],
  "reasoning": "2-3 sentence expert narrative"
}

Return a JSON array of all evaluated candidates. No markdown. No explanation outside JSON."""

JD_PARSE_SYSTEM_PROMPT = """You are a job description analyst. Extract structured insights from job descriptions.
Return ONLY valid JSON with this structure:
{
  "job_title": "string",
  "job_summary": "1 sentence summary",
  "key_requirements": ["req1", "req2", "req3", "req4", "req5"],
  "must_have_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1"],
  "experience_level": "junior|mid|senior|staff|principal",
  "domain": "string"
}"""


def parse_job_description(jd: str) -> dict:
    """Extract structured data from job description using Claude."""
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        system=JD_PARSE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Parse this job description:\n\n{jd}"}],
    )
    raw = msg.content[0].text.strip()
    raw = re.sub(r"^```json|^```|```$", "", raw, flags=re.MULTILINE).strip()
    return json.loads(raw)


def compute_activity_score(candidate: dict) -> float:
    """Compute behavioral/activity signal score from metadata."""
    score = 0.0
    gh = candidate.get("github", {})
    score += min(gh.get("repos", 0) * 2, 20)
    score += min(gh.get("stars", 0) * 0.5, 20)
    score += min(gh.get("contributions_last_year", 0) * 0.05, 20)
    score += 10 if gh.get("has_popular_project") else 0

    score += min(candidate.get("endorsements", 0) * 2, 10)
    score += 10 if candidate.get("open_source_contributor") else 0
    score += 10 if candidate.get("publications") else 0

    yoe = candidate.get("years_of_experience", 0)
    jobs = candidate.get("num_jobs", 1)
    tenure = yoe / max(jobs, 1)
    if tenure >= 2:
        score += 10
    elif tenure >= 1:
        score += 5

    return min(score, 100.0)


def rank_candidates_with_ai(jd: str, candidates: list[dict], jd_meta: dict) -> list[dict]:
    """Use Claude to semantically rank candidates against JD."""
    candidate_profiles = []
    for c in candidates:
        activity_score = compute_activity_score(c)
        profile = {
            "candidate_id": c["id"],
            "name": c["name"],
            "title": c.get("current_title", ""),
            "years_experience": c.get("years_of_experience", 0),
            "skills": c.get("skills", []),
            "past_roles": c.get("past_roles", []),
            "education": c.get("education", ""),
            "domain_experience": c.get("domain_experience", []),
            "github_stars": c.get("github", {}).get("stars", 0),
            "github_contributions": c.get("github", {}).get("contributions_last_year", 0),
            "open_source": c.get("open_source_contributor", False),
            "publications": c.get("publications", []),
            "activity_signal": round(activity_score, 1),
        }
        candidate_profiles.append(profile)

    prompt = f"""Job Description:
{jd}

Parsed JD Metadata:
{json.dumps(jd_meta, indent=2)}

Candidate Pool ({len(candidate_profiles)} candidates):
{json.dumps(candidate_profiles, indent=2)}

Evaluate and score ALL {len(candidate_profiles)} candidates. Return a JSON array."""

    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        system=RANKING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip()
    raw = re.sub(r"^```json|^```|```$", "", raw, flags=re.MULTILINE).strip()
    return json.loads(raw)


def compute_overall_score(ai_result: dict, activity_score: float) -> float:
    """Weighted composite score."""
    semantic = ai_result.get("semantic_score", 0)
    signal = ai_result.get("signal_score", 0)
    experience = ai_result.get("experience_score", 0)
    # Weights: semantic 45%, experience 30%, signal 25%
    return round(semantic * 0.45 + experience * 0.30 + signal * 0.25, 2)


# ─── API endpoints ────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "AI Recruiter API is running", "version": "1.0.0"}


@app.get("/candidates")
def get_candidates():
    candidates = load_candidates()
    return {"total": len(candidates), "candidates": candidates}


@app.post("/rank", response_model=RankResponse)
def rank_candidates(req: RankRequest):
    if not req.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty")

    candidates = load_candidates()
    if not candidates:
        raise HTTPException(status_code=500, detail="No candidates found in dataset")

    # Apply pre-filters if any
    filtered = candidates
    if req.filters.get("min_experience"):
        filtered = [c for c in filtered if c.get("years_of_experience", 0) >= req.filters["min_experience"]]
    if req.filters.get("required_skills"):
        req_skills = [s.lower() for s in req.filters["required_skills"]]
        filtered = [
            c for c in filtered
            if any(rs in [sk.lower() for sk in c.get("skills", [])] for rs in req_skills)
        ]

    if not filtered:
        raise HTTPException(status_code=404, detail="No candidates match the applied filters")

    # Parse JD
    jd_meta = parse_job_description(req.job_description)

    # AI ranking
    ai_scores = rank_candidates_with_ai(req.job_description, filtered, jd_meta)

    # Build lookup map
    candidate_map = {c["id"]: c for c in filtered}
    activity_map = {c["id"]: compute_activity_score(c) for c in filtered}

    # Merge and compute overall scores
    merged = []
    for ai in ai_scores:
        cid = ai["candidate_id"]
        if cid not in candidate_map:
            continue
        cand = candidate_map[cid]
        overall = compute_overall_score(ai, activity_map.get(cid, 0))
        merged.append({
            "candidate_id": cid,
            "name": cand["name"],
            "overall_score": overall,
            "semantic_score": ai.get("semantic_score", 0),
            "signal_score": ai.get("signal_score", 0),
            "experience_score": ai.get("experience_score", 0),
            "skills_match": ai.get("skills_match", []),
            "gaps": ai.get("gaps", []),
            "strengths": ai.get("strengths", []),
            "reasoning": ai.get("reasoning", ""),
        })

    # Sort and rank
    merged.sort(key=lambda x: x["overall_score"], reverse=True)
    top = merged[: req.top_k]
    for i, item in enumerate(top):
        item["rank"] = i + 1

    return RankResponse(
        job_title=jd_meta.get("job_title", "Unknown Role"),
        job_summary=jd_meta.get("job_summary", ""),
        key_requirements=jd_meta.get("key_requirements", []),
        total_candidates_evaluated=len(filtered),
        ranked_candidates=top,
        ranking_methodology="Composite score: 45% semantic fit · 30% experience depth · 25% behavioral signals",
    )


@app.get("/demo-jds")
def get_demo_jds():
    return {
        "job_descriptions": [
            {
                "title": "Senior ML Engineer",
                "jd": "We are seeking a Senior Machine Learning Engineer to lead the development of our recommendation engine. You will design and deploy production ML pipelines, work closely with data scientists to productionize models, and mentor junior engineers. Requirements: 5+ years of ML experience, proficiency in Python, TensorFlow or PyTorch, experience with MLOps tools (MLflow, Kubeflow), strong understanding of distributed systems, and experience deploying models at scale. Bonus: publications, open-source contributions, Kubernetes experience.",
            },
            {
                "title": "Staff Backend Engineer",
                "jd": "Join our platform team as a Staff Backend Engineer. You'll architect high-throughput microservices, drive technical strategy, and own the reliability of our core APIs serving 10M+ users. Must-have: 8+ years backend experience, deep expertise in Go or Rust, distributed systems design, PostgreSQL/Redis, and experience leading cross-functional technical initiatives. Nice-to-have: open-source contributions, experience with service meshes.",
            },
            {
                "title": "Frontend Lead",
                "jd": "We need a Frontend Lead to own the web experience for 5M users. You'll lead a team of 4 engineers, set frontend architecture standards, and partner with design to ship pixel-perfect, performant UIs. Requirements: 6+ years React experience, TypeScript mastery, performance optimization expertise, strong design sensibility, and experience with micro-frontend architectures. Bonus: contributions to React ecosystem OSS.",
            },
        ]
    }
