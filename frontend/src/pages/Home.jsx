import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useUser } from '../context/UserContext'

const CAROUSEL_SLIDES = [
  {
    headline: 'Practice Until You Are Unstoppable',
    sub: 'AI-powered mock interviews tailored to your resume, role, and growth.',
    img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1600&q=80',
  },
  {
    headline: 'Real Interview Pressure. Zero Consequences.',
    sub: 'Face hard interviewers, get honest feedback, level up fast.',
    img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600&q=80',
  },
  {
    headline: 'Your Profile. Your Growth. Your Story.',
    sub: 'Track every attempt. Watch your score climb from 0 to elite.',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
  },
]

const FEATURES = [
  {
    icon: '⚡',
    title: 'Personalised Questions',
    desc: 'Every question is generated from your resume and live interview notes — not a generic question bank.',
  },
  {
    icon: '🎯',
    title: 'Real-Time Feedback',
    desc: 'Get instant, honest feedback after every answer. Know exactly where you stand.',
  },
  {
    icon: '🔒',
    title: 'Privacy Focused',
    desc: 'Your resume, notes, and profile live on your device. No third-party data brokers.',
  },
  {
    icon: '📈',
    title: 'Skill Growth Tracking',
    desc: 'A 0–1000 growth score tracks your improvement across every session.',
  },
]

const HOW_TO = [
  { step: '01', text: 'Upload your resume or portfolio on the progress page.' },
  { step: '02', text: 'Review your AI-generated profile and let it capture your strengths.' },
  { step: '03', text: 'Configure your mock interview — role, difficulty, salary, and round type.' },
  { step: '04', text: 'Face the AI interviewer. It adapts to your answers in real time.' },
  { step: '05', text: 'Get your growth score and a detailed performance breakdown after.' },
  { step: '06', text: 'Retry with the same config or level up to a harder difficulty.' },
]

export default function Home() {
  const navigate = useNavigate()
  const { userUuid } = useUser()
  const [slide, setSlide] = useState(0)
  const [key, setKey] = useState(0)
  const whatRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => {
      setSlide((s) => (s + 1) % CAROUSEL_SLIDES.length)
      setKey((k) => k + 1)
    }, 4500)
    return () => clearInterval(t)
  }, [])

  const current = CAROUSEL_SLIDES[slide]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* BG image */}
        <div
          key={key}
          className="carousel-slide"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${current.img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
        {/* Overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,9,12,0.82)', zIndex: 1 }} />
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: 0.5 }} />

        {/* Content */}
        <div
          key={`text-${key}`}
          className="fade-up"
          style={{
            position: 'relative', zIndex: 3,
            textAlign: 'center',
            padding: '0 1.5rem',
            maxWidth: 760,
          }}
        >
          <div className="tag-accent" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
            AI-POWERED MOCK INTERVIEWS
          </div>

          <h1
            style={{
              fontFamily: 'Syne',
              fontWeight: 800,
              fontSize: 'clamp(2.2rem, 6vw, 3.8rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: '0 0 1rem',
              color: '#fff',
            }}
          >
            {current.headline}
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'rgba(232,234,240,0.65)',
              marginBottom: '2.5rem',
              lineHeight: 1.7,
              fontWeight: 400,
            }}
          >
            {current.sub}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '0.95rem', padding: '0.75rem 2rem' }} onClick={() => navigate(userUuid ? '/profile' : '/progress')}>
              {userUuid ? 'Go to Profile' : 'Try for Free'}
            </button>
            <button
              className="btn-outline"
              style={{ fontSize: '0.95rem', padding: '0.75rem 2rem' }}
              onClick={() => whatRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More ↓
            </button>
          </div>
        </div>

        {/* Slide dots */}
        <div
          style={{
            position: 'absolute', bottom: 32, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', gap: 6, zIndex: 4,
          }}
        >
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlide(i); setKey((k) => k + 1) }}
              style={{
                width: i === slide ? 20 : 6, height: 6,
                borderRadius: 3,
                background: i === slide ? 'var(--accent)' : 'var(--border)',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.3s', padding: 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section ref={whatRef} id="what-we-provide" style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p className="label" style={{ marginBottom: '0.75rem', justifyContent: 'center', display: 'flex' }}>WHY USE OUR WEBAPP</p>
          <h2
            className="section-title"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--text)' }}
          >
            Everything you need to land the role.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card"
              style={{ cursor: 'default' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,200,150,0.3)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.5rem', color: 'var(--text)' }}>
                {f.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How to Use ────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '6rem 2rem',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="label" style={{ marginBottom: '0.75rem', justifyContent: 'center', display: 'flex' }}>HOW TO USE EFFECTIVELY</p>
            <h2 className="section-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--text)' }}>
              Six steps to elite.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {HOW_TO.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
                  padding: '1rem 1.25rem',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0,200,150,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <span style={{
                  fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: '0.75rem',
                  color: 'var(--accent)', flexShrink: 0, marginTop: 2,
                }}>
                  {item.step}
                </span>
                <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <h2 className="section-title" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '0 0 1rem', color: 'var(--text)' }}>
          Ready to face the interview?
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
          Upload your resume and start your first session in under 2 minutes.
        </p>
        <button
          className="btn-primary"
          style={{ fontSize: '1rem', padding: '0.8rem 2.25rem' }}
          onClick={() => navigate(userUuid ? '/profile' : '/progress')}
        >
          {userUuid ? 'Go to Profile →' : 'Begin Interview →'}
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        fontFamily: 'JetBrains Mono',
      }}>
        MockView — AI-powered interview simulator
      </footer>
    </div>
  )
}