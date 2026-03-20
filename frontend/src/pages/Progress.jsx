import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useUser } from '../context/UserContext'
import { checkUser, uploadFiles, createManualProfile } from '../api/client'

const ROLE_OPTIONS = [
  'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'ML Engineer',
  'Data Scientist', 'DevOps Engineer', 'Product Manager', 'UX Designer',
  'Mobile Developer', 'QA Engineer', 'Security Engineer', 'Solution Architect',
]

const EXPERIENCE_OPTIONS = ['Intern / Fresher', '0–1 years', '1–3 years', '3–5 years', '5–10 years', '10+ years']

const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
  'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'FastAPI', 'Django', 'Flask', 'Spring Boot',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
  'GraphQL', 'REST', 'gRPC', 'Terraform', 'Linux', 'Git', 'CI/CD', 'TensorFlow', 'PyTorch',
]

function UploadZone({ label, file, onFile, accept, icon }) {
  const ref = useRef()
  return (
    <div style={{ marginBottom: '1rem' }}>
      <p className="label" style={{ marginBottom: '0.5rem' }}>{label}</p>
      <div
        onClick={() => ref.current.click()}
        style={{
          border: `1px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 8,
          padding: '1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: file ? 'var(--accent-dim)' : 'var(--surface2)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { if (!file) e.currentTarget.style.borderColor = 'var(--text-muted)' }}
        onMouseLeave={(e) => { if (!file) e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{file ? '✓' : icon}</div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: file ? 'var(--accent)' : 'var(--text-muted)', fontWeight: file ? 600 : 400 }}>
          {file ? file.name : `Click to upload ${label.toLowerCase()}`}
        </p>
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => onFile(e.target.files[0] || null)} />
    </div>
  )
}

export default function Progress() {
  const navigate = useNavigate()
  const { userUuid, setUserUuid, setProfile } = useUser()

  const [isNew, setIsNew] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showManual, setShowManual] = useState(false)

  const [resumeFile, setResumeFile] = useState(null)
  const [portfolioFile, setPortfolioFile] = useState(null)

  const [manualName, setManualName] = useState('')
  const [manualRoles, setManualRoles] = useState([])
  const [manualExp, setManualExp] = useState('')
  const [manualSkills, setManualSkills] = useState([])
  const [skillSearch, setSkillSearch] = useState('')

  useEffect(() => {
    async function check() {
      if (userUuid) {
        try {
          const res = await checkUser(userUuid)
          setIsNew(res.data.is_new)
        } catch { setIsNew(true) }
      }
      setLoading(false)
    }
    check()
  }, [userUuid])

  const toggleRole = (r) =>
    setManualRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : prev.length < 3 ? [...prev, r] : prev
    )

  const toggleSkill = (s) =>
    setManualSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )

  const handleFileUpload = async () => {
    if (!resumeFile && !portfolioFile) { setError('Please select at least one file.'); return }
    setError('')
    setSubmitting(true)
    try {
      const fd = new FormData()
      if (userUuid) fd.append('user_uuid', userUuid)
      if (resumeFile) fd.append('resume', resumeFile)
      if (portfolioFile) fd.append('portfolio', portfolioFile)
      const res = await uploadFiles(fd)
      setUserUuid(res.data.user_uuid)
      setProfile(res.data.profile)
      navigate('/profile')
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Check backend.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleManual = async () => {
    if (!manualName || manualRoles.length === 0 || !manualExp || manualSkills.length === 0) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await createManualProfile({ user_uuid: userUuid || undefined, name: manualName, roles: manualRoles, experience: manualExp, skills: manualSkills })
      setUserUuid(res.data.user_uuid)
      setProfile(res.data.profile)
      navigate('/profile')
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
        </div>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>loading…</p>
      </div>
    )
  }

  const filteredSkills = SKILL_OPTIONS.filter((s) => s.toLowerCase().includes(skillSearch.toLowerCase()))

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar pageName="profile setup" />

      <div className="page-wrap-sm" style={{ paddingTop: '88px', paddingBottom: '4rem' }}>

        {/* Heading */}
        <div style={{ marginBottom: '2rem', marginTop: '0.5rem' }}>
          <div className="tag-accent" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
            {isNew ? 'New Profile' : 'Update Profile'}
          </div>
          <h1 className="section-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 0.5rem', color: 'var(--text)' }}>
            {isNew ? 'Build your profile.' : 'Update your profile.'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            {isNew
              ? 'Upload your resume to get started. Nexus will extract your profile automatically.'
              : 'Upload a new resume to update your profile. Interview history is preserved.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(240,78,78,0.08)',
            border: '1px solid rgba(240,78,78,0.25)',
            borderRadius: 8, padding: '0.75rem 1rem',
            color: '#f87171', marginBottom: '1.25rem', fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        {!showManual ? (
          <>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 1.25rem', color: 'var(--text)' }}>
                Upload Documents
              </p>
              <UploadZone label="Resume (.pdf or .html)" file={resumeFile} onFile={setResumeFile} accept=".pdf,.html,.htm" icon="📄" />
              <UploadZone label="Portfolio (.pdf or .html) — optional" file={portfolioFile} onFile={setPortfolioFile} accept=".pdf,.html,.htm" icon="🗂️" />
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }} onClick={handleFileUpload} disabled={submitting}>
                {submitting ? 'Analysing with AI…' : 'Generate Profile →'}
              </button>
            </div>

            {isNew && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setShowManual(true)}
                  className="btn-ghost"
                  style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
                >
                  Don't have a resume? Enter details manually →
                </button>
              </div>
            )}

            {!isNew && (
              <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--surface2)', borderColor: 'var(--border-subtle)' }}>
                <span style={{ fontSize: '1.25rem' }}>📁</span>
                <div>
                  <p style={{ margin: '0 0 0.2rem', fontWeight: 600, fontFamily: 'Syne', fontSize: '0.88rem', color: 'var(--text)' }}>Previous profile on file</p>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Uploading a new resume will merge it with your existing profile.</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, margin: 0, fontSize: '0.95rem', color: 'var(--text)' }}>Manual Entry</p>
              <button className="btn-ghost" onClick={() => setShowManual(false)} style={{ fontSize: '0.8rem' }}>
                ← Back to Upload
              </button>
            </div>

            {/* Name */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p className="label" style={{ marginBottom: '0.5rem' }}>Name</p>
              <input className="input" placeholder="Your full name" value={manualName} onChange={(e) => setManualName(e.target.value)} />
            </div>

            {/* Roles */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p className="label" style={{ marginBottom: '0.5rem' }}>Target Roles (select up to 3)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => toggleRole(r)}
                    style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: 6,
                      border: `1px solid ${manualRoles.includes(r) ? 'rgba(0,200,150,0.4)' : 'var(--border)'}`,
                      background: manualRoles.includes(r) ? 'var(--accent-dim)' : 'var(--surface2)',
                      color: manualRoles.includes(r) ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p className="label" style={{ marginBottom: '0.5rem' }}>Experience Level</p>
              <select className="input" value={manualExp} onChange={(e) => setManualExp(e.target.value)}>
                <option value="">Select experience level</option>
                {EXPERIENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Skills */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p className="label" style={{ marginBottom: '0.5rem' }}>Skills / Tech Stacks</p>
              <input className="input" placeholder="Search skills…" value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} style={{ marginBottom: '0.5rem' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: 160, overflowY: 'auto' }}>
                {filteredSkills.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSkill(s)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: 5,
                      border: `1px solid ${manualSkills.includes(s) ? 'rgba(0,200,150,0.4)' : 'var(--border)'}`,
                      background: manualSkills.includes(s) ? 'var(--accent-dim)' : 'var(--surface2)',
                      color: manualSkills.includes(s) ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'JetBrains Mono', transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {manualSkills.length > 0 && (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                  {manualSkills.length} selected
                </p>
              )}
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleManual} disabled={submitting}>
              {submitting ? 'Building profile with AI…' : 'Generate Profile →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}