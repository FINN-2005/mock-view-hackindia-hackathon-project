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

export default function Progress() {
  const navigate = useNavigate()
  const { userUuid, setUserUuid, setProfile } = useUser()

  const [isNew, setIsNew] = useState(true)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showManual, setShowManual] = useState(false)

  // File upload
  const [resumeFile, setResumeFile] = useState(null)
  const [portfolioFile, setPortfolioFile] = useState(null)
  const resumeRef = useRef()
  const portfolioRef = useRef()

  // Manual fields
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

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggleRole = (r) =>
    setManualRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : prev.length < 3 ? [...prev, r] : prev
    )

  const toggleSkill = (s) =>
    setManualSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )

  const handleFileUpload = async () => {
    if (!resumeFile && !portfolioFile) {
      setError('Please select at least one file.')
      return
    }
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
      const res = await createManualProfile({
        user_uuid: userUuid || undefined,
        name: manualName,
        roles: manualRoles,
        experience: manualExp,
        skills: manualSkills,
      })
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </div>
      </div>
    )
  }

  const filteredSkills = SKILL_OPTIONS.filter((s) =>
    s.toLowerCase().includes(skillSearch.toLowerCase())
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="grain">
      <Navbar />

      <div className="page-wrap" style={{ maxWidth: 680, paddingTop: '8rem', paddingBottom: '4rem' }}>
        {/* Heading */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="tag" style={{ marginBottom: '1rem' }}>
            {isNew ? 'New Profile' : 'Update Profile'}
          </div>
          <h1
            className="section-title"
            style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', margin: '0 0 0.5rem' }}
          >
            {isNew ? 'Build your profile.' : 'Update your profile.'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {isNew
              ? 'Upload your resume or portfolio to get started. MockAI will extract your profile automatically.'
              : 'Upload a new resume to update your profile. Your previous interview history is preserved.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid var(--danger)',
              borderRadius: 4,
              padding: '0.75rem 1rem',
              color: '#fca5a5',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {!showManual ? (
          <>
            {/* File upload section */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, margin: '0 0 1.25rem', fontSize: '1rem' }}>
                Upload Documents
              </h3>

              {/* Resume */}
              <div style={{ marginBottom: '1rem' }}>
                <span className="label">Resume (.pdf or .html)</span>
                <div
                  onClick={() => resumeRef.current.click()}
                  style={{
                    border: `2px dashed ${resumeFile ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 4,
                    padding: '1.25rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: resumeFile ? 'rgba(14,165,233,0.05)' : 'var(--surface2)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📄</div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: resumeFile ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {resumeFile ? resumeFile.name : 'Click to upload resume'}
                  </p>
                </div>
                <input
                  ref={resumeRef}
                  type="file"
                  accept=".pdf,.html,.htm"
                  style={{ display: 'none' }}
                  onChange={(e) => setResumeFile(e.target.files[0] || null)}
                />
              </div>

              {/* Portfolio */}
              <div style={{ marginBottom: '1.5rem' }}>
                <span className="label">Portfolio (.pdf or .html) — optional</span>
                <div
                  onClick={() => portfolioRef.current.click()}
                  style={{
                    border: `2px dashed ${portfolioFile ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 4,
                    padding: '1.25rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: portfolioFile ? 'rgba(14,165,233,0.05)' : 'var(--surface2)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🗂️</div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: portfolioFile ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {portfolioFile ? portfolioFile.name : 'Click to upload portfolio (optional)'}
                  </p>
                </div>
                <input
                  ref={portfolioRef}
                  type="file"
                  accept=".pdf,.html,.htm"
                  style={{ display: 'none' }}
                  onChange={(e) => setPortfolioFile(e.target.files[0] || null)}
                />
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handleFileUpload}
                disabled={submitting}
              >
                {submitting ? 'Analysing with AI...' : 'Generate Profile →'}
              </button>
            </div>

            {/* Don't have a resume — only for new users */}
            {isNew && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setShowManual(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textDecoration: 'underline',
                    fontFamily: 'Outfit',
                  }}
                >
                  Don't have a resume? Enter details manually →
                </button>
              </div>
            )}

            {/* Returning user — show previous resume info */}
            {!isNew && (
              <div
                className="card"
                style={{ marginTop: '1rem', background: 'var(--surface2)', display: 'flex', gap: '1rem', alignItems: 'center' }}
              >
                <span style={{ fontSize: '1.5rem' }}>📁</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontFamily: 'Syne', fontSize: '0.9rem' }}>
                    Previous profile on file
                  </p>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Uploading a new resume will merge it with your existing profile.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Manual Form ──────────────────────────────────────────────── */
          <div className="card fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, margin: 0 }}>Manual Entry</h3>
              <button
                onClick={() => setShowManual(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ← Back to Upload
              </button>
            </div>

            {/* Name */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Name</label>
              <input
                className="input"
                placeholder="Your full name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>

            {/* Roles */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Target Roles (select up to 3)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => toggleRole(r)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 2,
                      border: `1px solid ${manualRoles.includes(r) ? 'var(--accent)' : 'var(--border)'}`,
                      background: manualRoles.includes(r) ? 'rgba(14,165,233,0.15)' : 'var(--surface2)',
                      color: manualRoles.includes(r) ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontFamily: 'Outfit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Experience Level</label>
              <select
                className="input"
                value={manualExp}
                onChange={(e) => setManualExp(e.target.value)}
              >
                <option value="">Select experience level</option>
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Skills */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Skills / Tech Stacks (unlimited)</label>
              <input
                className="input"
                placeholder="Search skills..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: 180, overflowY: 'auto' }}>
                {filteredSkills.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSkill(s)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: 2,
                      border: `1px solid ${manualSkills.includes(s) ? 'var(--accent)' : 'var(--border)'}`,
                      background: manualSkills.includes(s) ? 'rgba(14,165,233,0.15)' : 'var(--surface2)',
                      color: manualSkills.includes(s) ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontFamily: 'JetBrains Mono',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {manualSkills.length > 0 && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                  {manualSkills.length} selected
                </p>
              )}
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={handleManual}
              disabled={submitting}
            >
              {submitting ? 'Building profile with AI...' : 'Generate Profile →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
