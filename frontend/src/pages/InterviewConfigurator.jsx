import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useUser } from '../context/UserContext'

const TOOLTIPS = {
  difficulty: 'Controls how the AI interviewer behaves — from supportive hints to ruthless follow-ups.',
  role: 'Determines the domain of questions asked (e.g. frontend, system design, behavioural).',
  salary: 'Aligns the AI expectations — higher salary roles get tougher, more specific questions.',
  experience: 'Sets the depth of technical questions. Senior roles get architecture-level questions.',
  company: 'Select the company this role is for — influences company-specific questions and culture fit.',
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

const FAMOUS_COMPANIES = [
  'Google', 'Meta (Facebook)', 'Amazon', 'Microsoft', 'Apple', 'Tesla', 'Netflix',
  'OpenAI', 'Spotify', 'Airbnb', 'Uber', 'Slack', 'Stripe', 'GitHub', 'GitLab',
  'Shopify', 'Twilio', 'Figma', 'Canva', 'Notion', 'Intercom', 'Asana',
  'IBM', 'Intel', 'Oracle', 'Salesforce', 'VMware', 'Datadog', 'Atlassian',
  'Adobe', 'Workday', 'Okta', 'Zoom', 'Discord', 'HashiCorp',
  'Cloudflare', 'MongoDB', 'Elastic', 'Redis', 'Amplitude',
  'Databricks', 'PagerDuty', 'Splunk',
]

const JOB_LOCATIONS = [
  'Remote', 'San Francisco', 'Los Angeles', 'New York', 'London', 'Berlin', 'Paris',
  'Tokyo', 'Singapore', 'Sydney', 'Toronto', 'Mumbai', 'Bangalore', 'Delhi',
  'Dubai', 'Amsterdam', 'Stockholm', 'Seattle', 'Austin', 'Boston', 'Chicago',
  'Denver', 'Miami', 'Mexico City', 'São Paulo', 'Shanghai', 'Hong Kong', 'Seoul',
]

function Field({ label, tooltip, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
        <p className="label" style={{ margin: 0 }}>{label}</p>
        {tooltip && (
          <span
            title={tooltip}
            style={{
              width: 15, height: 15, borderRadius: '50%',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: '0.6rem',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'help', flexShrink: 0,
            }}
          >?</span>
        )}
      </div>
      {children}
    </div>
  )
}

export default function InterviewConfigurator() {
  const navigate = useNavigate()
  const { userUuid, setInterviewConfig } = useUser()
  const [form, setForm] = useState({
    difficulty: 'medium', role: '', company: '', salary: '',
    experience: '', location: '', source: 'linkedin', round_type: 'technical rounds',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userUuid) navigate('/profile')
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleContinue = () => {
    if (!form.role) { setError('Please enter or select a job role.'); return }
    if (!form.salary || isNaN(Number(form.salary))) { setError('Please enter a valid salary number.'); return }
    if (!form.experience || isNaN(Number(form.experience))) { setError('Please enter years of experience required.'); return }
    if (!form.location) { setError('Please select a job location.'); return }
    setError('')
    setInterviewConfig({
      difficulty: form.difficulty,
      role: form.role,
      company: form.company || 'Not specified',
      salary: Number(form.salary),
      experience: Number(form.experience),
      location: form.location,
      source: form.source,
      round_type: form.round_type,
    })
    navigate('/interview')
  }

  const chipStyle = (active) => ({
    padding: '0.55rem 0.85rem',
    borderRadius: 8,
    border: `1px solid ${active ? 'rgba(0,200,150,0.4)' : 'var(--border)'}`,
    background: active ? 'var(--accent-dim)' : 'var(--surface2)',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
  })

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar pageName="configure" />

      <div className="page-wrap-sm" style={{ paddingTop: '88px', paddingBottom: '4rem' }}>
        <div style={{ marginBottom: '2rem', marginTop: '0.5rem' }}>
          <div className="tag-accent" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>Step 1 of 1</div>
          <h1 className="section-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 0.4rem', color: 'var(--text)' }}>
            Configure your interview.
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem' }}>
            Every field shapes the questions the AI will ask you.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(240,78,78,0.08)', border: '1px solid rgba(240,78,78,0.25)',
            borderRadius: 8, padding: '0.75rem 1rem', color: '#f87171',
            marginBottom: '1.25rem', fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        <div className="card">
          {/* Difficulty */}
          <Field label="Interviewer Difficulty" tooltip={TOOLTIPS.difficulty}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.65rem' }}>
              {DIFFICULTY_OPTIONS.map((d) => (
                <button key={d.value} onClick={() => set('difficulty', d.value)} style={chipStyle(form.difficulty === d.value)}>
                  <p style={{ margin: '0 0 0.2rem', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem' }}>{d.label}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.4, color: form.difficulty === d.value ? 'rgba(0,200,150,0.7)' : 'var(--text-muted)' }}>{d.desc}</p>
                </button>
              ))}
            </div>
          </Field>

          {/* Role */}
          <Field label="Job Role" tooltip={TOOLTIPS.role}>
            <input className="input" placeholder="e.g. Backend Engineer, Data Scientist…" value={form.role} onChange={(e) => set('role', e.target.value)} style={{ marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {COMMON_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => set('role', r)}
                  style={{
                    padding: '0.2rem 0.55rem', borderRadius: 5,
                    border: `1px solid ${form.role === r ? 'rgba(0,200,150,0.4)' : 'var(--border)'}`,
                    background: form.role === r ? 'var(--accent-dim)' : 'transparent',
                    color: form.role === r ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.15s',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>

          {/* Company */}
          <Field label="Company (optional)" tooltip={TOOLTIPS.company}>
            <select className="input" value={form.company} onChange={(e) => set('company', e.target.value)}>
              <option value="">Select a company or leave blank</option>
              {FAMOUS_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          {/* Salary + Experience (2 col) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <p className="label" style={{ margin: 0 }}>Annual Salary</p>
              </div>
              <input className="input" type="number" placeholder="e.g. 80000" value={form.salary} onChange={(e) => set('salary', e.target.value)} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <p className="label" style={{ margin: 0 }}>Experience (years)</p>
              </div>
              <input className="input" type="number" placeholder="e.g. 3" value={form.experience} onChange={(e) => set('experience', e.target.value)} />
            </div>
          </div>

          {/* Location */}
          <Field label="Job Location" tooltip={TOOLTIPS.location}>
            <select className="input" value={form.location} onChange={(e) => set('location', e.target.value)}>
              <option value="">Select a location</option>
              {JOB_LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </Field>

          {/* Source */}
          <Field label="Where you found the role" tooltip={TOOLTIPS.source}>
            <select className="input" value={form.source} onChange={(e) => set('source', e.target.value)}>
              {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </Field>

          {/* Round Type */}
          <Field label="Interview Round Type" tooltip={TOOLTIPS.round_type}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.65rem' }}>
              {ROUND_TYPES.map((r) => (
                <button key={r.value} onClick={() => set('round_type', r.value)} style={chipStyle(form.round_type === r.value)}>
                  <p style={{ margin: 0, fontFamily: 'Syne', fontWeight: 600, fontSize: '0.85rem' }}>{r.label}</p>
                </button>
              ))}
            </div>
          </Field>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
            <button className="btn-outline" onClick={() => navigate('/profile')}>Cancel</button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleContinue}>
              Start Interview →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}