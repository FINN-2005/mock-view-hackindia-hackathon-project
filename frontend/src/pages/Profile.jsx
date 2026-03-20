import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Navbar from '../components/Navbar'
import { useUser } from '../context/UserContext'
import { getProfile, getHistory, editProfileAI } from '../api/client'

const HOW_TO_ITEMS = [
  'Configure your interview with a specific role, difficulty, and salary to get the most personalised session.',
  'Use the code editor and scratch pad during technical rounds — the AI sees everything you type.',
  'Complete multiple sessions to build your growth graph. Each round updates your profile.',
  'Use the AI chat below to correct or add info the resume parser may have missed.',
]

function ScoreLabel({ score }) {
  if (score < 100) return <span style={{ color: '#f04e4e' }}>Needs Work</span>
  if (score < 300) return <span style={{ color: '#f07840' }}>Early Stage</span>
  if (score < 500) return <span style={{ color: '#f0a92e' }}>Developing</span>
  if (score < 700) return <span style={{ color: '#00c896' }}>Decently Hirable</span>
  if (score < 900) return <span style={{ color: '#9b72f5' }}>Strong Candidate</span>
  return <span style={{ color: '#9b72f5' }}>Elite</span>
}

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', border: 'none', background: 'none',
          padding: '0.6rem 0', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: open ? '1px solid var(--border-subtle)' : 'none',
          paddingBottom: open ? '0.6rem' : '0',
        }}
      >
        <span className="label" style={{ fontSize: '0.8rem' }}>{title}</span>
        <svg width={14} height={14} viewBox="0 0 14 14" fill="none" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div style={{ paddingTop: '0.75rem' }}>{children}</div>}
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { userUuid, profile, setProfile } = useUser()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [evaluationData, setEvaluationData] = useState(null)
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Hi! You can ask me to update any part of your profile. Try: "Add GraphQL to my skills" or "Update my ai_remark".' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!userUuid) { navigate('/progress'); return }
    async function load() {
      try {
        const [pRes, hRes] = await Promise.all([getProfile(userUuid), getHistory(userUuid)])
        setProfile(pRes.data.profile)
        setHistory(hRes.data.history)
        const stored = localStorage.getItem(`evaluation_${userUuid}`)
        if (stored) {
          try { setEvaluationData(JSON.parse(stored)) } catch {}
        }
      } catch (e) {
        if (e.response?.status === 404) navigate('/progress')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userUuid])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await editProfileAI(userUuid, msg)
      setProfile(res.data.profile)
      setChatMessages((prev) => [...prev, { role: 'ai', text: 'Done! Your profile has been updated.' }])
    } catch {
      setChatMessages((prev) => [...prev, { role: 'ai', text: 'Something went wrong. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
        </div>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>loading profile…</p>
      </div>
    )
  }

  const growthData = history.slice().reverse().map((h, i) => ({ attempt: `#${i + 1}`, score: h.growth_score, role: h.role }))
  const latestScore = history[0]?.growth_score ?? 0

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar
        pageName="profile"
        rightAction={
          <button className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate('/interview-configurator')}>
            + New Interview
          </button>
        }
      />

      <div className="page-wrap" style={{ paddingTop: '72px', paddingBottom: '4rem' }}>

        {/* Start interview banner */}
        <div
          className="card"
          style={{
            marginTop: '1.5rem',
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, var(--surface) 0%, rgba(0,200,150,0.05) 100%)',
            borderColor: 'rgba(0,200,150,0.15)',
            display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="tag-accent" style={{ marginBottom: '0.6rem', display: 'inline-flex' }}>Ready?</div>
            <h2 className="section-title" style={{ fontSize: '1.5rem', margin: '0 0 0.4rem', color: 'var(--text)' }}>
              Start a new interview
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, fontSize: '0.88rem' }}>
              Configure and begin a personalised mock interview tailored to your profile and target role.
            </p>
          </div>
          <button className="btn-primary" style={{ fontSize: '0.95rem', padding: '0.75rem 1.75rem', flexShrink: 0 }} onClick={() => navigate('/interview-configurator')}>
            Configure Interview →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* Profile */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p className="section-title" style={{ fontSize: '0.95rem', color: 'var(--text)', margin: 0 }}>Your Profile</p>
              {profile?.ai_remark && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  "{profile.ai_remark}"
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
              <div>
                <p className="label" style={{ marginBottom: '0.5rem' }}>Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {(profile?.skills || []).slice(0, 14).map((s) => (
                    <span key={s} className="tag" style={{ fontSize: '0.7rem' }}>{s}</span>
                  ))}
                  {(profile?.skills || []).length > 14 && <span className="tag">+{profile.skills.length - 14}</span>}
                </div>
              </div>
              <div>
                <p className="label" style={{ marginBottom: '0.5rem' }}>Experience</p>
                {(profile?.experience || []).map((e, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text)' }}>{e.role}</span>
                    {e.duration && <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.75rem' }}>{e.duration}</span>}
                  </div>
                ))}
              </div>
              <div>
                <p className="label" style={{ marginBottom: '0.5rem' }}>Projects</p>
                {(profile?.projects || []).slice(0, 4).map((p, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>• {p}</div>
                ))}
              </div>
              <div>
                <p className="label" style={{ marginBottom: '0.5rem' }}>Education</p>
                {(profile?.education || []).map((e, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>• {e}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Growth chart */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <p className="section-title" style={{ fontSize: '0.95rem', color: 'var(--text)', margin: '0 0 0.2rem' }}>Growth Score</p>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.82rem' }}>
                  <strong style={{ color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>{latestScore}</strong>
                  <span style={{ color: 'var(--text-muted)' }}> / 1000 — </span>
                  <ScoreLabel score={latestScore} />
                </p>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                {profile?.strengths?.length > 0 && (
                  <div>
                    <p className="label" style={{ marginBottom: '0.3rem', color: 'var(--success)' }}>Strengths</p>
                    {profile.strengths.slice(0, 3).map((s, i) => (
                      <span key={i} style={{ display: 'block', fontSize: '0.78rem', color: 'var(--success)' }}>✓ {s}</span>
                    ))}
                  </div>
                )}
                {profile?.weaknesses?.length > 0 && (
                  <div>
                    <p className="label" style={{ marginBottom: '0.3rem', color: 'var(--gold)' }}>Focus On</p>
                    {profile.weaknesses.slice(0, 3).map((w, i) => (
                      <span key={i} style={{ display: 'block', fontSize: '0.78rem', color: 'var(--gold)' }}>→ {w}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="attempt" stroke="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis domain={[0, 1000]} stroke="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono" />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: '0.8rem' }}
                    formatter={(v, n, p) => [v, `Score (${p.payload.role})`]}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border)', borderRadius: 6 }}>
                Complete your first interview to see your growth chart.
              </div>
            )}
          </div>

          {/* Latest evaluation insights */}
          {evaluationData?.detailed_evaluation && Object.keys(evaluationData.detailed_evaluation).length > 0 && (
            <div className="card" style={{ gridColumn: '1 / -1', borderColor: 'rgba(155,114,245,0.15)' }}>
              <p className="section-title" style={{ fontSize: '0.95rem', color: 'var(--text)', margin: '0 0 1.25rem' }}>
                Latest Evaluation Insights
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="card-sm">
                  <p className="label" style={{ marginBottom: '0.4rem' }}>Growth Score</p>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Syne', fontWeight: 800, color: 'var(--accent)' }}>
                    {evaluationData.growth_score}
                    <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>/1000</span>
                  </p>
                </div>
                <div className="card-sm">
                  <p className="label" style={{ marginBottom: '0.4rem' }}>Evaluator Confidence</p>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Syne', fontWeight: 800, color: 'var(--purple)' }}>
                    {evaluationData.confidence_score}
                    <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>/100</span>
                  </p>
                </div>
              </div>

              {evaluationData.detailed_evaluation.score_breakdown && (
                <CollapsibleSection title="Score Breakdown" defaultOpen>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    {evaluationData.detailed_evaluation.score_breakdown}
                  </p>
                </CollapsibleSection>
              )}
              {evaluationData.detailed_evaluation.top_strengths?.length > 0 && (
                <CollapsibleSection title={`Top Strengths (${evaluationData.detailed_evaluation.top_strengths.length})`}>
                  {evaluationData.detailed_evaluation.top_strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: 'var(--success)', display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <span style={{ flexShrink: 0 }}>✓</span><span>{s}</span>
                    </div>
                  ))}
                </CollapsibleSection>
              )}
              {evaluationData.detailed_evaluation.next_suggested_plan && (
                <CollapsibleSection title="Next Steps" defaultOpen>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    {evaluationData.detailed_evaluation.next_suggested_plan}
                  </p>
                </CollapsibleSection>
              )}
            </div>
          )}

          {/* Previous attempts */}
          <div className="card">
            <p className="section-title" style={{ fontSize: '0.95rem', color: 'var(--text)', margin: '0 0 1.25rem' }}>Previous Attempts</p>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No interviews yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="card-sm"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
                  >
                    <div>
                      <p style={{ margin: '0 0 0.15rem', fontFamily: 'Syne', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{h.role}</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                        {h.difficulty} · {h.date ? new Date(h.date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>{h.growth_score}</p>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)' }}>/1000</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How to use */}
          <div className="card">
            <p className="section-title" style={{ fontSize: '0.95rem', color: 'var(--text)', margin: '0 0 1.25rem' }}>How to Use Effectively</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {HOW_TO_ITEMS.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono', flexShrink: 0, fontSize: '0.7rem', marginTop: 2 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Profile Editor */}
        <div className="card">
          <p className="section-title" style={{ fontSize: '0.95rem', color: 'var(--text)', margin: '0 0 0.25rem' }}>AI Profile Editor</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 1.25rem' }}>
            Tell the AI to update your profile. Changes are saved instantly.
          </p>

          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border-subtle)', borderRadius: 8,
            padding: '1rem', height: 200, overflowY: 'auto', marginBottom: '0.75rem',
            display: 'flex', flexDirection: 'column', gap: '0.65rem',
          }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '0.5rem 0.85rem', borderRadius: 8,
                  fontSize: '0.82rem', lineHeight: 1.5,
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                  color: m.role === 'user' ? '#020e09' : 'var(--text)',
                  border: m.role === 'ai' ? '1px solid var(--border-subtle)' : 'none',
                  fontWeight: m.role === 'user' ? 500 : 400,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', gap: 5, padding: '0.25rem 0' }}>
                <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <input
              className="input"
              placeholder="e.g. Add Rust to my skills, or update my ai_remark…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" onClick={sendChat} disabled={chatLoading} style={{ flexShrink: 0 }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}