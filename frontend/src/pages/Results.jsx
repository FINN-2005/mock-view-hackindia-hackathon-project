import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useUser } from '../context/UserContext'
import { getResults, startInterview } from '../api/client'

function ScoreArc({ score }) {
  const pct = score / 1000
  const r = 80
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  let color = '#ef4444'
  if (score >= 700) color = '#0ea5e9'
  else if (score >= 500) color = '#22c55e'
  else if (score >= 300) color = '#eab308'
  else if (score >= 100) color = '#f97316'

  let label = 'Needs Work'
  if (score >= 900) label = 'Elite'
  else if (score >= 700) label = 'Strong Candidate'
  else if (score >= 500) label = 'Decently Hirable'
  else if (score >= 300) label = 'Developing'
  else if (score >= 100) label = 'Early Stage'

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={200} height={200} viewBox="0 0 200 200">
        {/* Track */}
        <circle cx={100} cy={100} r={r} fill="none" stroke="var(--border)" strokeWidth={12} />
        {/* Progress */}
        <circle
          cx={100}
          cy={100}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1.5s ease, stroke 0.5s' }}
        />
        {/* Score text */}
        <text x={100} y={92} textAnchor="middle" fill="#e2e8f0" fontSize={32} fontFamily="Syne" fontWeight={800}>
          {score}
        </text>
        <text x={100} y={114} textAnchor="middle" fill="var(--text-muted)" fontSize={12} fontFamily="JetBrains Mono">
          / 1000
        </text>
      </svg>
      <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', color, margin: 0 }}>{label}</p>
    </div>
  )
}

function LikelihoodBar({ pct }) {
  let color = '#ef4444'
  if (pct >= 70) color = '#22c55e'
  else if (pct >= 40) color = '#eab308'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="label">Likelihood of Getting the Job</span>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, color, fontSize: '0.95rem' }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 4,
            transition: 'width 1.5s ease',
          }}
        />
      </div>
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const { userUuid, interviewConfig, setInterviewConfig } = useUser()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (!userUuid) { navigate('/progress'); return }
    ;(async () => {
      try {
        const res = await getResults(userUuid)
        setData(res.data)
      } catch {
        navigate('/profile')
      } finally {
        setLoading(false)
      }
    })()
  }, [userUuid])

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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
        </div>
      </div>
    )
  }

  const results = data?.results || {}
  const { growth_score = 0, job_likelihood = 0, summary = '', notes = [] } = results

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="grain">
      <Navbar />

      <div className="page-wrap fade-up" style={{ paddingTop: '7rem', paddingBottom: '4rem' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="tag" style={{ marginBottom: '0.75rem' }}>Session Complete</div>
          <h1 className="section-title" style={{ fontSize: 'clamp(2rem,5vw,3rem)', margin: 0 }}>
            Interview Results
          </h1>
        </div>

        {/* Score + Likelihood */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Score card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <ScoreArc score={growth_score} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
              Growth Score — reflects your overall interview performance
            </p>
          </div>

          {/* Likelihood + Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <LikelihoodBar pct={job_likelihood} />
            </div>
            <div className="card" style={{ flex: 1 }}>
              <p className="label" style={{ marginBottom: '0.5rem' }}>AI Summary</p>
              <p style={{ margin: 0, lineHeight: 1.7, fontSize: '0.9rem', color: 'var(--text)' }}>
                {summary || 'No summary generated.'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <p className="label" style={{ marginBottom: '1rem' }}>Interview Notes ({notes.length})</p>
          {notes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No notes recorded.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {notes.map((note, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderLeft: '3px solid var(--accent)',
                    borderRadius: 4,
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    color: 'var(--text)',
                  }}
                >
                  {note}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={() => navigate('/profile')}>
            ← Back to Profile
          </button>
          <button className="btn-primary" onClick={handleRetry} disabled={retrying}>
            {retrying ? 'Starting...' : 'Retry Same Config ↺'}
          </button>
        </div>
      </div>
    </div>
  )
}
