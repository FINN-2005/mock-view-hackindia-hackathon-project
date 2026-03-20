import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useUser } from '../context/UserContext'

const CAROUSEL_SLIDES = [
  {
    headline: 'Practice Until You are Unstoppable',
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
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="grain">
      <Navbar />

      {/* ── Hero / Carousel ─────────────────────────────────────────────── */}
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
        {/* Background image */}
        <div
          key={key}
          className="carousel-slide"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${current.img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6,10,18,0.78)',
            zIndex: 1,
          }}
        />
        {/* Grid on top */}
        <div
          className="grid-bg"
          style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: 0.6 }}
        />

        {/* Content */}
        <div
          key={`text-${key}`}
          className="fade-up"
          style={{
            position: 'relative',
            zIndex: 3,
            textAlign: 'center',
            padding: '0 1.5rem',
            maxWidth: 800,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(14,165,233,0.12)',
              border: '1px solid var(--accent)',
              borderRadius: 2,
              padding: '0.25rem 0.8rem',
              marginBottom: '1.5rem',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.75rem',
                color: 'var(--accent)',
                letterSpacing: '0.1em',
              }}
            >
              AI-POWERED MOCK INTERVIEWS
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'Syne',
              fontWeight: 800,
              fontSize: 'clamp(2.2rem, 6vw, 4rem)',
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
              fontFamily: 'Outfit',
              fontSize: '1.15rem',
              color: 'rgba(226,232,240,0.75)',
              marginBottom: '2.5rem',
              lineHeight: 1.6,
            }}
          >
            {current.sub}
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate(userUuid ? '/profile' : '/progress')}>
              {userUuid ? 'Go to Profile' : 'Try for Free'}
            </button>
            <button
              className="btn-outline"
              onClick={() => whatRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More ↓
            </button>
          </div>
        </div>

        {/* Slide indicators */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            zIndex: 4,
          }}
        >
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlide(i); setKey((k) => k + 1) }}
              style={{
                width: i === slide ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === slide ? 'var(--accent)' : 'var(--border)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
                padding: 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Why Use MockAI ──────────────────────────────────────────────── */}
      <section
        ref={whatRef}
        id="what-we-provide"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '6rem 2rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '0.75rem',
              color: 'var(--accent)',
              letterSpacing: '0.12em',
              marginBottom: '0.75rem',
            }}
          >
            WHY USE OUR WEBAPP
          </p>
          <h2
            className="section-title"
            style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', margin: 0 }}
          >
            Everything you need to land the role.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card"
              style={{
                transition: 'border-color 0.2s, transform 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3
                style={{
                  fontFamily: 'Syne',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  margin: '0 0 0.5rem',
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How to Use Effectively ─────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '6rem 2rem',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.75rem',
                color: 'var(--accent)',
                letterSpacing: '0.12em',
                marginBottom: '0.75rem',
              }}
            >
              HOW TO USE EFFECTIVELY
            </p>
            <h2
              className="section-title"
              style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', margin: 0 }}
            >
              Six steps to elite.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {HOW_TO.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'flex-start',
                  padding: '1.25rem 1.5rem',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontWeight: 500,
                    fontSize: '1.1rem',
                    color: 'var(--accent)',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {item.step}
                </span>
                <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text)' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <h2
          className="section-title"
          style={{ fontSize: 'clamp(2rem,4vw,3rem)', margin: '0 0 1rem' }}
        >
          Ready to face the interview?
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
          Upload your resume and start your first session in under 2 minutes.
        </p>
        <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '0.85rem 2.5rem' }} onClick={() => navigate(userUuid ? '/profile' : '/progress')}>
          {userUuid ? 'Go to Profile →' : 'Begin Interview →'}
        </button>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          fontFamily: 'JetBrains Mono',
        }}
      >
        MockAI — AI-powered interview simulator
      </footer>
    </div>
  )
}
