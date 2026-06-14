import { useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Palette & design tokens ────────────────────────────────────────────────
const C = {
  bg: "#0D0F14",
  surface: "#151821",
  surfaceAlt: "#1C2030",
  border: "#252A3A",
  accent: "#5B6EF5",
  accentGlow: "#5B6EF520",
  accentSoft: "#8B9BFF",
  teal: "#00D4C8",
  amber: "#F5A623",
  red: "#FF5A5F",
  text: "#E8EAFF",
  textMuted: "#7880A0",
  textDim: "#4A5070",
};

const DEMO_JDS = [
  {
    title: "Senior ML Engineer",
    jd: "We are seeking a Senior Machine Learning Engineer to lead the development of our recommendation engine. You will design and deploy production ML pipelines, work closely with data scientists to productionize models, and mentor junior engineers. Requirements: 5+ years of ML experience, proficiency in Python, TensorFlow or PyTorch, experience with MLOps tools (MLflow, Kubeflow), strong understanding of distributed systems, and experience deploying models at scale. Bonus: publications, open-source contributions, Kubernetes experience.",
  },
  {
    title: "Staff Backend Engineer",
    jd: "Join our platform team as a Staff Backend Engineer. You'll architect high-throughput microservices, drive technical strategy, and own the reliability of our core APIs serving 10M+ users. Must-have: 8+ years backend experience, deep expertise in Go or Rust, distributed systems design, PostgreSQL/Redis, and experience leading cross-functional technical initiatives. Nice-to-have: open-source contributions, experience with service meshes.",
  },
  {
    title: "Frontend Lead",
    jd: "We need a Frontend Lead to own the web experience for 5M users. You'll lead a team of 4 engineers, set frontend architecture standards, and partner with design to ship pixel-perfect, performant UIs. Requirements: 6+ years React experience, TypeScript mastery, performance optimization expertise, strong design sensibility, and experience with micro-frontend architectures. Bonus: contributions to React ecosystem OSS.",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 80) return C.teal;
  if (s >= 60) return C.accentSoft;
  if (s >= 40) return C.amber;
  return C.red;
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: 4, background: C.border, borderRadius: 9999, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            borderRadius: 9999,
            transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: medal ? 18 : 13, fontWeight: 800,
      background: rank <= 3 ? `${C.accent}22` : C.surfaceAlt,
      border: `1px solid ${rank <= 3 ? C.accent : C.border}`,
      color: rank <= 3 ? C.accentSoft : C.textMuted, flexShrink: 0,
    }}>
      {medal || `#${rank}`}
    </div>
  );
}

function Pill({ text, color = C.accent }) {
  return (
    <span style={{
      fontSize: 10, padding: "2px 8px", borderRadius: 9999,
      background: `${color}18`, border: `1px solid ${color}44`,
      color, fontWeight: 600, letterSpacing: "0.03em", whiteSpace: "nowrap",
    }}>{text}</span>
  );
}

function CandidateCard({ candidate, expanded, onToggle }) {
  const c = candidate;
  const overall = Math.round(c.overall_score);
  const col = scoreColor(overall);

  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? C.surfaceAlt : C.surface,
        border: `1px solid ${expanded ? C.accent : C.border}`,
        borderRadius: 14, padding: "18px 22px", cursor: "pointer",
        transition: "all 0.2s ease", marginBottom: 10,
        boxShadow: expanded ? `0 0 0 1px ${C.accent}44` : "none",
      }}
      onMouseEnter={e => !expanded && (e.currentTarget.style.borderColor = C.textDim)}
      onMouseLeave={e => !expanded && (e.currentTarget.style.borderColor = C.border)}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <RankBadge rank={c.rank} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{c.name}</span>
            <span style={{ color: C.textMuted, fontSize: 12 }}>{c.current_title || ""}</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
            {(c.skills_match || []).slice(0, 4).map(s => <Pill key={s} text={s} />)}
            {(c.skills_match || []).length > 4 && (
              <Pill text={`+${c.skills_match.length - 4} more`} color={C.textMuted} />
            )}
          </div>
        </div>

        {/* Score ring */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: `conic-gradient(${col} ${overall * 3.6}deg, ${C.border} 0deg)`,
            padding: 3,
          }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%", background: C.surface,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: col, lineHeight: 1 }}>{overall}</span>
              <span style={{ fontSize: 8, color: C.textMuted, letterSpacing: "0.05em" }}>SCORE</span>
            </div>
          </div>
        </div>

        <div style={{ color: C.textMuted, fontSize: 18, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <p style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Score Breakdown</p>
              <ScoreBar label="Semantic Fit" value={c.semantic_score} color={C.accentSoft} />
              <ScoreBar label="Experience Depth" value={c.experience_score} color={C.teal} />
              <ScoreBar label="Behavioral Signals" value={c.signal_score} color={C.amber} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Strengths</p>
              {(c.strengths || []).map(s => (
                <div key={s} style={{ display: "flex", gap: 6, marginBottom: 5, alignItems: "flex-start" }}>
                  <span style={{ color: C.teal, fontSize: 12, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 12, color: C.text }}>{s}</span>
                </div>
              ))}
              {(c.gaps || []).length > 0 && (
                <>
                  <p style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, marginTop: 12 }}>Gaps</p>
                  {c.gaps.map(g => (
                    <div key={g} style={{ display: "flex", gap: 6, marginBottom: 5, alignItems: "flex-start" }}>
                      <span style={{ color: C.amber, fontSize: 12, marginTop: 1 }}>△</span>
                      <span style={{ fontSize: 12, color: C.textMuted }}>{g}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, padding: "12px 14px", background: `${C.accent}0A`, borderRadius: 8, borderLeft: `3px solid ${C.accent}` }}>
            <p style={{ fontSize: 11, color: C.accent, fontWeight: 600, marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>AI Recruiter Analysis</p>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{c.reasoning}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [jd, setJd] = useState("");
  const [topK, setTopK] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [step, setStep] = useState("idle"); // idle | parsing | ranking | done

  const handleRank = useCallback(async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedId(null);
    setStep("parsing");

    try {
      await new Promise(r => setTimeout(r, 800));
      setStep("ranking");
      const res = await fetch(`${API_BASE}/rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jd, top_k: topK }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "API error");
      }
      const data = await res.json();
      setResult(data);
      setStep("done");
    } catch (e) {
      setError(e.message);
      setStep("idle");
    } finally {
      setLoading(false);
    }
  }, [jd, topK]);

  const statusMsg = {
    idle: null,
    parsing: "🔍 Parsing job description with Claude...",
    ranking: "⚡ Ranking candidates using semantic AI...",
    done: null,
  }[step];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, ${C.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
        <span style={{ fontWeight: 800, fontSize: 16, color: C.text, letterSpacing: "-0.02em" }}>AI Recruiter</span>
        <span style={{ color: C.border, fontSize: 14 }}>|</span>
        <span style={{ color: C.textMuted, fontSize: 12 }}>Intelligent Candidate Ranking Engine</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Pill text="Claude Sonnet 4.6" color={C.accentSoft} />
          <Pill text="v1.0.0" color={C.textDim} />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, margin: 0 }}>
            Find the{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.accentSoft}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              perfect candidates
            </span>
            <br />with AI precision
          </h1>
          <p style={{ color: C.textMuted, fontSize: 15, marginTop: 14, lineHeight: 1.6, maxWidth: 520, margin: "14px auto 0" }}>
            Paste any job description. Claude semantically understands requirements and ranks your entire talent pool — beyond keyword matching.
          </p>
        </div>

        {/* Input section */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Job Description</span>
            <div style={{ display: "flex", gap: 8 }}>
              {DEMO_JDS.map(d => (
                <button
                  key={d.title}
                  onClick={() => setJd(d.jd)}
                  style={{
                    fontSize: 11, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                    background: C.surfaceAlt, border: `1px solid ${C.border}`,
                    color: C.textMuted, transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accentSoft; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
                >
                  {d.title}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste your job description here, or click a template above..."
            style={{
              width: "100%", minHeight: 160, padding: "14px 16px", borderRadius: 10,
              background: C.bg, border: `1px solid ${C.border}`, color: C.text,
              fontSize: 13, lineHeight: 1.7, resize: "vertical", fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.target.style.borderColor = C.accent)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>Show top</span>
              <select
                value={topK}
                onChange={e => setTopK(Number(e.target.value))}
                style={{
                  background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text,
                  padding: "6px 10px", borderRadius: 8, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                }}
              >
                {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} candidates</option>)}
              </select>
            </div>

            <button
              onClick={handleRank}
              disabled={loading || !jd.trim()}
              style={{
                marginLeft: "auto", padding: "12px 28px", borderRadius: 10, border: "none",
                background: loading || !jd.trim() ? C.surfaceAlt : `linear-gradient(135deg, ${C.accent}, ${C.accentSoft})`,
                color: loading || !jd.trim() ? C.textDim : "#fff",
                fontWeight: 700, fontSize: 14, cursor: loading || !jd.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s", fontFamily: "inherit",
                boxShadow: loading || !jd.trim() ? "none" : `0 4px 20px ${C.accent}44`,
              }}
            >
              {loading ? statusMsg || "Processing…" : "⚡ Rank Candidates"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}44`, borderRadius: 10, padding: "14px 18px", marginBottom: 20, color: C.red, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* JD summary */}
            <div style={{
              background: `linear-gradient(135deg, ${C.accent}15, ${C.teal}08)`,
              border: `1px solid ${C.accent}33`, borderRadius: 16, padding: 24, marginBottom: 24,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>{result.job_title}</h2>
                    <Pill text={`${result.total_candidates_evaluated} evaluated`} color={C.teal} />
                  </div>
                  <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 14px" }}>{result.job_summary}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {result.key_requirements.slice(0, 6).map(r => (
                      <Pill key={r} text={r} color={C.accentSoft} />
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: C.accentSoft }}>{result.ranked_candidates.length}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>candidates ranked</div>
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 4, maxWidth: 160 }}>{result.ranking_methodology}</div>
                </div>
              </div>
            </div>

            {/* Candidate list */}
            <div>
              {result.ranked_candidates.map(c => (
                <CandidateCard
                  key={c.candidate_id}
                  candidate={c}
                  expanded={expandedId === c.candidate_id}
                  onToggle={() => setExpandedId(expandedId === c.candidate_id ? null : c.candidate_id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: C.textDim }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
            <p style={{ fontSize: 14 }}>Enter a job description above and click Rank Candidates to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
