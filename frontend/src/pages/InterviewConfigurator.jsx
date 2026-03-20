import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useUser } from '../context/UserContext'

const TOOLTIPS = {
  difficulty: 'Controls how the AI interviewer behaves — from supportive hints to ruthless follow-ups.',
  role: 'Determines the domain of questions asked (e.g. frontend, system design, behavioural).',
  salary: 'Aligns the AI expectations — higher salary roles get tougher, more specific questions.',
  experience: 'Sets the depth of technical questions. Senior roles get architecture-level questions.',
  location: 'Enables market-specific questions (visa, local frameworks, regional salary norms).',
  source: 'Tailors framing — e.g. Upwork interviews focus on client communication and delivery.',
  round_type: 'Shapes the entire format — phone screen is brief and broad; technical goes deep.',
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Full Helper', desc: 'Hints, encouragement, gentle follow-ups.' },
  { value: 'medium', label: 'Half Helper', desc: 'Balanced — professional but fair.' },
  { value: 'hard', label: 'Full Strict', desc: 'No hints. Aggressive follow-ups. No mercy.' },
]

const ROUND_TYPES = [
  { value: 'phone screen', label: 'Phone Screen' },
  { value: 'technical rounds', label: 'Technical Rounds' },
  { value: 'hr rounds', label: 'HR Rounds' },
  { value: 'offer negotiation', label: 'Offer Negotiation' },
]

const SOURCE_OPTIONS = ['placements', 'linkedin', 'upwork', 'other']

const COMMON_ROLES = [
  'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'ML Engineer',
  'Data Scientist', 'DevOps Engineer', 'Product Manager', 'Mobile Developer',
  'QA Engineer', 'Security Engineer', 'Solution Architect', 'Data Engineer',
  'Cloud Engineer', 'Site Reliability Engineer', 'UX Designer',
]

function Tooltip({ text }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: '0.65rem',
        cursor: 'help',
        position: 'relative',
        marginLeft: 6,
        flexShrink: 0,
      }}
      title={text}
    >
      ?
    </div>
  )
}

function Field({ label, tooltip, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label className="label" style={{ margin: 0 }}>{label}</label>
        <Tooltip text={tooltip} />
      </div>
      {children}
    </div>
  )
}

export default function InterviewConfigurator() {
  const navigate = useNavigate()
  const { userUuid, setInterviewConfig } = useUser()
  const [form, setForm] = useState({
    difficulty: 'medium',
    role: '',
    salary: '',
    experience: '',
    location: '',
    source: 'linkedin',
    round_type: 'technical rounds',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    // If page reloaded (no uuid in memory but in storage), go to profile
    if (!userUuid) navigate('/profile')
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleContinue = () => {
    if (!form.role) { setError('Please enter or select a job role.'); return }
    if (!form.salary || isNaN(Number(form.salary))) { setError('Please enter a valid salary number.'); return }
    if (!form.experience || isNaN(Number(form.experience))) { setError('Please enter years of experience required.'); return }
    if (!form.location) { setError('Please enter a job location.'); return }

    setError('')
    const config = {
      difficulty: form.difficulty,
      role: form.role,
      salary: Number(form.salary),
      experience: Number(form.experience),
      location: form.location,
      source: form.source,
      round_type: form.round_type,
    }
    setInterviewConfig(config)
    navigate('/interview')
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="grain">
      <Navbar />

      <div className="page-wrap" style={{ maxWidth: 680, paddingTop: '7rem', paddingBottom: '4rem' }}>
        {/* Heading */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="tag" style={{ marginBottom: '0.75rem' }}>Step 1 of 1</div>
          <h1 className="section-title" style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', margin: '0 0 0.5rem' }}>
            Configure your interview.
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Every field shapes the questions the AI will ask you.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: 4, padding: '0.75rem 1rem', color: '#fca5a5', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div className="card">
          {/* Difficulty */}
          <Field label="Interviewer Difficulty" tooltip={TOOLTIPS.difficulty}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => set('difficulty', d.value)}
                  style={{
                    padding: '0.85rem 0.75rem',
                    borderRadius: 4,
                    border: `2px solid ${form.difficulty === d.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.difficulty === d.value ? 'rgba(14,165,233,0.1)' : 'var(--surface2)',
                    color: form.difficulty === d.value ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <p style={{ margin: '0 0 0.3rem', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem' }}>{d.label}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.4 }}>{d.desc}</p>
                </button>
              ))}
            </div>
          </Field>

          {/* Role */}
          <Field label="Job Role" tooltip={TOOLTIPS.role}>
            <input
              className="input"
              placeholder="e.g. Backend Engineer, Data Scientist..."
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              style={{ marginBottom: '0.5rem' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {COMMON_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => set('role', r)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: 2,
                    border: `1px solid ${form.role === r ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.role === r ? 'rgba(14,165,233,0.1)' : 'transparent',
                    color: form.role === r ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'Outfit',
                    transition: 'all 0.15s',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>

          {/* Salary */}
          <Field label="Job Salary (annual, your currency)" tooltip={TOOLTIPS.salary}>
            <input
              className="input"
              type="number"
              placeholder="e.g. 80000"
              value={form.salary}
              onChange={(e) => set('salary', e.target.value)}
            />
          </Field>

          {/* Experience */}
          <Field label="Experience Required (years)" tooltip={TOOLTIPS.experience}>
            <input
              className="input"
              type="number"
              placeholder="e.g. 3"
              value={form.experience}
              onChange={(e) => set('experience', e.target.value)}
            />
          </Field>

          {/* Location */}
          <Field label="Job Location" tooltip={TOOLTIPS.location}>
            <input
              className="input"
              placeholder="e.g. London, Remote, Bangalore..."
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </Field>

          {/* Source */}
          <Field label="Where you found the role" tooltip={TOOLTIPS.source}>
            <select className="input" value={form.source} onChange={(e) => set('source', e.target.value)}>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </Field>

          {/* Round Type */}
          <Field label="Interview Round Type" tooltip={TOOLTIPS.round_type}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem' }}>
              {ROUND_TYPES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => set('round_type', r.value)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 4,
                    border: `2px solid ${form.round_type === r.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.round_type === r.value ? 'rgba(14,165,233,0.1)' : 'var(--surface2)',
                    color: form.round_type === r.value ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontFamily: 'Syne',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.15s',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="btn-outline" onClick={() => navigate('/profile')}>
              Cancel
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleContinue}>
              Start Interview →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
