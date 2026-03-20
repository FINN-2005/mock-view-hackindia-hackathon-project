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
  if (score < 100) return <span style={{ color: '#ef4444' }}>Needs Work</span>
  if (score < 300) return <span style={{ color: '#f97316' }}>Early Stage</span>
  if (score < 500) return <span style={{ color: '#eab308' }}>Developing</span>
  if (score < 700) return <span style={{ color: '#22c55e' }}>Decently Hirable</span>
  if (score < 900) return <span style={{ color: '#0ea5e9' }}>Strong Candidate</span>
  return <span style={{ color: '#a855f7' }}>Elite</span>
}

export default function Profile() {
  const navigate = useNavigate()
  const { userUuid, profile, setProfile } = useUser()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
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
      } catch (e) {
        if (e.response?.status === 404) navigate('/progress')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userUuid])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
        </div>
      </div>
    )
  }

  const growthData = history
    .slice()
    .reverse()
    .map((h, i) => ({ attempt: `#${i + 1}`, score: h.growth_score, role: h.role }))

  const latestScore = history[0]?.growth_score ?? 0

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="grain">
      <Navbar showStartBtn />

      <div className="page-wrap" style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>

        {/* ── Interview Entry ───────────────────────────────────────────── */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, rgba(14,165,233,0.08) 100%)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '2.5rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="tag" style={{ marginBottom: '0.75rem' }}>Ready?</div>
            <h2 className="section-title" style={{ fontSize: '1.8rem', margin: '0 0 0.5rem' }}>
              Start a new interview
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              Configure and begin a personalised mock interview tailored to your profile and target role.
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ fontSize: '1.05rem', padding: '0.85rem 2rem', flexShrink: 0 }}
            onClick={() => navigate('/interview-configurator')}
          >
            Configure Interview →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* ── User State ────────────────────────────────────────────────── */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 className="section-title" style={{ fontSize: '1.1rem', margin: '0 0 1.25rem' }}>
              Your Profile
              {profile?.ai_remark && (
                <span style={{ fontFamily: 'Outfit', fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>
                  — {profile.ai_remark}
                </span>
              )}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
              {/* Skills */}
              <div>
                <p className="label" style={{ marginBottom: '0.5rem' }}>Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(profile?.skills || []).slice(0, 14).map((s) => (
                    <span key={s} className="tag">{s}</span>
                  ))}
                  {(profile?.skills || []).length > 14 && (
                    <span className="tag">+{profile.skills.length - 14}</span>
                  )}
                </div>
              </div>
              {/* Experience */}
              <div>
                <p className="label" style={{ marginBottom: '0.5rem' }}>Experience</p>
                {(profile?.experience || []).map((e, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text)' }}>{e.role}</span>
                    {e.duration && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{e.duration}</span>}
                  </div>
                ))}
              </div>
              {/* Projects */}
              <div>
                <p className="label" style={{ marginBottom: '0.5rem' }}>Projects</p>
                {(profile?.projects || []).slice(0, 4).map((p, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>• {p}</div>
                ))}
              </div>
              {/* Education */}
              <div>
                <p className="label" style={{ marginBottom: '0.5rem' }}>Education</p>
                {(profile?.education || []).map((e, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>• {e}</div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Growth ────────────────────────────────────────────────────── */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem', margin: '0 0 0.25rem' }}>Growth</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                  Current score: <strong style={{ color: 'var(--text)' }}>{latestScore}</strong> / 1000 — <ScoreLabel score={latestScore} />
                </p>
              </div>
              {profile?.strengths?.length > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <p className="label" style={{ marginBottom: '0.25rem' }}>Strengths</p>
                  {profile.strengths.slice(0, 3).map((s, i) => (
                    <span key={i} style={{ display: 'block', fontSize: '0.8rem', color: 'var(--success)' }}>✓ {s}</span>
                  ))}
                </div>
              )}
              {profile?.weaknesses?.length > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <p className="label" style={{ marginBottom: '0.25rem' }}>Focus On</p>
                  {profile.weaknesses.slice(0, 3).map((w, i) => (
                    <span key={i} style={{ display: 'block', fontSize: '0.8rem', color: 'var(--gold)' }}>→ {w}</span>
                  ))}
                </div>
              )}
            </div>

            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="attempt" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis domain={[0, 1000]} stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)' }}
                    formatter={(v, n, p) => [v, `Score (${p.payload.role})`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--accent)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed var(--border)', borderRadius: 4 }}>
                Complete your first interview to see your growth chart.
              </div>
            )}
          </div>

          {/* ── Previous Attempts ─────────────────────────────────────────── */}
          <div className="card">
            <h3 className="section-title" style={{ fontSize: '1.1rem', margin: '0 0 1.25rem' }}>Previous Attempts</h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No interviews yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.map((h, i) => (
                  <div
                    key={h.id}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 0.2rem', fontFamily: 'Syne', fontWeight: 600, fontSize: '0.9rem' }}>{h.role}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                        {h.difficulty} · {h.date ? new Date(h.date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent)', fontSize: '1.1rem' }}>
                        {h.growth_score}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>/1000</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── How to Use ────────────────────────────────────────────────── */}
          <div className="card">
            <h3 className="section-title" style={{ fontSize: '1.1rem', margin: '0 0 1.25rem' }}>How to Use Effectively</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {HOW_TO_ITEMS.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono', flexShrink: 0 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── AI Profile Editing ────────────────────────────────────────── */}
        <div className="card">
          <h3 className="section-title" style={{ fontSize: '1.1rem', margin: '0 0 0.25rem' }}>
            AI Profile Editor
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
            Tell the AI to update your profile. Changes are saved instantly.
          </p>

          {/* Messages */}
          <div
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '1rem',
              height: 220,
              overflowY: 'auto',
              marginBottom: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {chatMessages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '0.5rem 0.85rem',
                    borderRadius: 4,
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                    color: m.role === 'user' ? '#fff' : 'var(--text)',
                    border: m.role === 'ai' ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', gap: 5 }}>
                <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              className="input"
              placeholder="e.g. Add Rust to my skills, or update my ai_remark…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" onClick={sendChat} disabled={chatLoading}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
