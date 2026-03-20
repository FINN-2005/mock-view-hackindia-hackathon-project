import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useUser } from '../context/UserContext'
import { getResults, startInterview } from '../api/client'

/* ── Score Arc ──────────────────────────────────────────────────────────── */
function ScoreArc({ score, max = 1000 }) {
  const pct = score / max
  const r = 64
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  let color = '#f04e4e'
  if (score >= max * 0.7) color = '#9b72f5'
  else if (score >= max * 0.5) color = '#00c896'
  else if (score >= max * 0.3) color = '#f0a92e'
  else if (score >= max * 0.1) color = '#f07840'

  let verdict = 'No Hire'
  let verdictColor = 'rgba(240,78,78,0.15)'
  let verdictText = '#f04e4e'
  if (score >= max * 0.6) { verdict = 'Hire'; verdictColor = 'rgba(0,200,150,0.12)'; verdictText = '#00c896' }
  else if (score >= max * 0.4) { verdict = 'Maybe'; verdictColor = 'rgba(240,169,46,0.12)'; verdictText = '#f0a92e' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={80} cy={80} r={r} fill="none" stroke="var(--surface3)" strokeWidth={8} />
        <circle
          cx={80} cy={80} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
        <text x={80} y={74} textAnchor="middle" fill="var(--text)" fontSize={28} fontFamily="Syne" fontWeight={800}>{score}</text>
        <text x={80} y={92} textAnchor="middle" fill="var(--text-muted)" fontSize={11} fontFamily="JetBrains Mono">/ {max}</text>
      </svg>
      <span style={{
        padding: '0.3rem 1.1rem',
        borderRadius: 6,
        background: verdictColor,
        color: verdictText,
        fontFamily: 'Inter',
        fontWeight: 700,
        fontSize: '0.85rem',
        letterSpacing: '0.02em',
      }}>
        {verdict}
      </span>
    </div>
  )
}

/* ── Metric Bar ─────────────────────────────────────────────────────────── */
function MetricBar({ label, value, max = 100 }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>{value}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ── Collapsible ────────────────────────────────────────────────────────── */
function Collapsible({ title, children, defaultOpen = false, icon = null }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', border: 'none', background: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', padding: 0, marginBottom: open ? '1.25rem' : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{title}</span>
        </div>
        <svg
          width={16} height={16} viewBox="0 0 16 16" fill="none"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function Results() {
  const navigate = useNavigate()
  const { userUuid, interviewConfig } = useUser()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [scoreVisible, setScoreVisible] = useState(false)
  const scoreRef = useRef(null)

  useEffect(() => {
    if (!userUuid) { navigate('/progress'); return }
    ;(async () => {
      try {
        const res = await getResults(userUuid)
        setData(res.data)
        // Store for profile page
        const results = res.data?.results || {}
        if (results.detailed_evaluation && Object.keys(results.detailed_evaluation).length > 0) {
          localStorage.setItem(`evaluation_${userUuid}`, JSON.stringify({
            timestamp: new Date().toISOString(),
            growth_score: results.growth_score || 0,
            confidence_score: results.confidence_score || 0,
            detailed_evaluation: results.detailed_evaluation,
          }))
        }
      } catch {
        navigate('/profile')
      } finally {
        setLoading(false)
      }
    })()
  }, [userUuid])

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setScoreVisible(true), 300)
      return () => clearTimeout(t)
    }
  }, [loading])

  const handleRetry = async () => {
    if (!interviewConfig) { navigate('/interview-configurator'); return }
    setRetrying(true)
    try {
      await startInterview(userUuid, interviewConfig)
      navigate('/interview')
    } catch {
      navigate('/interview-configurator')
    } finally {
      setRetrying(false)
    }
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
        </div>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>evaluating your interview…</p>
      </div>
    )
  }

  const results = data?.results || {}
  const {
    growth_score = 0,
    job_likelihood = 0,
    confidence_score = 0,
    summary = '',
    notes = [],
    detailed_evaluation = {}
  } = results

  // Build score breakdown metrics from available data
  const scoreMetrics = [
    { label: 'Communication', value: detailed_evaluation.communication_score ?? Math.round(job_likelihood * 0.9) },
    { label: 'Problem Solving', value: detailed_evaluation.problem_solving_score ?? Math.round(job_likelihood * 0.85) },
    { label: 'System Thinking', value: detailed_evaluation.system_thinking_score ?? Math.round(job_likelihood * 0.8) },
    { label: 'Technical Depth', value: detailed_evaluation.technical_depth_score ?? Math.round(job_likelihood * 0.78) },
    { label: 'Code Quality', value: detailed_evaluation.code_quality_score ?? Math.round(job_likelihood * 0.75) },
    { label: 'Confidence', value: confidence_score },
  ]

  // Interviewer name from config or default
  const interviewerName = data?.interviewer_name || 'AI Interviewer'
  const interviewerNote = detailed_evaluation.interviewer_note || summary || 'You showed solid fundamentals throughout the interview. Keep building on your strengths and work on the areas highlighted below.'

  const topStrengths = detailed_evaluation.top_strengths || []
  const criticalGaps = detailed_evaluation.critical_gaps || []
  const confidenceTips = detailed_evaluation.confidence_tips || []
  const improvementPlan = detailed_evaluation.improvement_plan || ''
  const nextSteps = detailed_evaluation.next_suggested_plan || ''
  const scoreBreakdown = detailed_evaluation.score_breakdown || ''
  const confidenceAnalysis = detailed_evaluation.confidence_analysis || ''

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar
        pageName="results"
        rightAction={
          <button className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => navigate('/interview-configurator')}>
            ↩ New Interview
          </button>
        }
      />

      <div className="page-wrap fade-up" style={{ paddingTop: '80px', paddingBottom: '6rem' }}>

        {/* Interviewer Note */}
        <div
          className="card"
          style={{
            marginBottom: '1.25rem',
            marginTop: '1.5rem',
            background: 'linear-gradient(135deg, rgba(0,200,150,0.05) 0%, var(--surface) 60%)',
            borderColor: 'rgba(0,200,150,0.15)',
            display: 'flex',
            gap: '1.25rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 56,
            height: 56,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}>
            🤖
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p className="label" style={{ marginBottom: '0.4rem', color: 'var(--accent)' }}>
              Note from {interviewerName}
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
              "{interviewerNote}"
            </p>
          </div>
        </div>

        {/* Score + Breakdown row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.25rem', marginBottom: '1.25rem', alignItems: 'stretch' }}>

          {/* Score arc card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2rem 2.5rem', minWidth: 200 }}>
            {scoreVisible ? <ScoreArc score={growth_score} /> : <ScoreArc score={0} />}
            <div style={{ width: '100%', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Likelihood</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: job_likelihood >= 70 ? 'var(--success)' : job_likelihood >= 40 ? 'var(--gold)' : 'var(--danger)' }}>
                  {job_likelihood}%
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${job_likelihood}%`, background: job_likelihood >= 70 ? 'var(--accent)' : job_likelihood >= 40 ? 'var(--gold)' : 'var(--danger)' }} />
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <p className="label" style={{ marginBottom: '1.25rem' }}>Score Breakdown</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 2.5rem' }}>
              {scoreMetrics.map((m) => (
                <MetricBar key={m.label} label={m.label} value={m.value} />
              ))}
            </div>
            {scoreBreakdown && (
              <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', margin: '1rem 0 0' }}>
                {scoreBreakdown}
              </p>
            )}
          </div>
        </div>

        {/* Confidence Analysis */}
        {(confidenceAnalysis || confidenceTips.length > 0) && (
          <div
            className="card"
            style={{ marginBottom: '1.25rem', padding: '1.5rem' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 30, height: 30,
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem',
                }}>
                  ⚡
                </div>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                  Confidence Analysis
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: confidence_score >= 70 ? 'var(--success)' : confidence_score >= 40 ? 'var(--gold)' : 'var(--danger)',
                  display: 'inline-block',
                  boxShadow: `0 0 6px ${confidence_score >= 70 ? 'var(--accent)' : confidence_score >= 40 ? 'var(--gold)' : 'var(--danger)'}`,
                }} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {confidence_score}/100
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  trend: {confidence_score >= 60 ? 'stable' : 'improving'}
                </span>
              </div>
            </div>

            {/* Issues / What worked */}
            {(criticalGaps.length > 0 || topStrengths.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: confidenceTips.length > 0 ? '1.25rem' : 0 }}>
                {/* Issues */}
                {criticalGaps.length > 0 && (
                  <div>
                    <p className="label" style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>Issues Found</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {criticalGaps.slice(0, 4).map((g, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 1, flexShrink: 0 }}>✕</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* What worked */}
                {topStrengths.length > 0 && (
                  <div>
                    <p className="label" style={{ color: 'var(--success)', marginBottom: '0.75rem' }}>What Worked</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {topStrengths.slice(0, 4).map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: 1, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confidence tips */}
            {confidenceTips.length > 0 && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '1rem 1.25rem' }}>
                <p className="label" style={{ color: 'var(--gold)', marginBottom: '0.85rem' }}>Confidence Tips</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {confidenceTips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span className="badge-gold">{i + 1}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question-by-Question notes */}
        {notes.length > 0 && (
          <Collapsible title="Question-by-Question" defaultOpen={false} icon="📋">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {notes.map((note, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '2px solid var(--accent)',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {note}
                </div>
              ))}
            </div>
          </Collapsible>
        )}

        {/* Strengths + Gaps */}
        {(topStrengths.length > 0 || criticalGaps.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', margin: '1.25rem 0' }}>
            {topStrengths.length > 0 && (
              <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <p className="label" style={{ color: 'var(--success)', marginBottom: '1rem' }}>Top Strengths</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {topStrengths.map((s, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: 1, flexShrink: 0 }}>✓</span>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{s}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {criticalGaps.length > 0 && (
              <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <p className="label" style={{ color: 'var(--orange)', marginBottom: '1rem' }}>Critical Gaps</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {criticalGaps.map((g, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--orange)', fontSize: '0.85rem', marginTop: 1, flexShrink: 0 }}>↗</span>
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{g}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Study Plan */}
        {improvementPlan && (
          <div className="card" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '1.25rem' }}>
              Your Study Plan
            </p>
            {improvementPlan.split('\n').filter(Boolean).slice(0, 6).map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  padding: '0.75rem 1rem',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  marginBottom: '0.6rem',
                }}
              >
                <span className="badge">{i + 1}</span>
                <span style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {step.replace(/^\d+[\.\)]\s*/, '').replace(/^[-•]\s*/, '')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Executive Summary */}
        {(summary || nextSteps) && (
          <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
            <p className="label" style={{ marginBottom: '0.85rem' }}>Executive Summary</p>
            {summary && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 1rem' }}>
                {summary}
              </p>
            )}
            {nextSteps && (
              <div style={{
                borderLeft: '2px solid var(--accent)',
                paddingLeft: '1rem',
                paddingTop: '0.1rem',
                paddingBottom: '0.1rem',
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.88rem' }}>Next steps: </span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{nextSteps}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={() => navigate('/profile')}>
            ↩ Home
          </button>
          <button className="btn-primary" onClick={handleRetry} disabled={retrying}>
            {retrying ? 'Starting…' : 'Practice Again →'}
          </button>
        </div>
      </div>
    </div>
  )
}