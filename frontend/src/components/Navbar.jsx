import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function Navbar({ showStartBtn = false, minimal = false }) {
  const navigate = useNavigate()
  const { userUuid } = useUser()

  if (minimal) return null

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(6,10,18,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 2rem',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--accent)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Syne',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#fff',
            }}
          >
            M
          </div>
          <span
            style={{
              fontFamily: 'Syne',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            MockAI
          </span>
        </button>

        {/* Right */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {showStartBtn && userUuid && (
            <button
              className="btn-outline"
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              onClick={() => navigate('/interview-configurator')}
            >
              Start Interview
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => navigate(userUuid ? '/profile' : '/progress')}
          >
            {userUuid ? 'My Profile' : 'Start for Free'}
          </button>
        </div>
      </div>
    </nav>
  )
}
