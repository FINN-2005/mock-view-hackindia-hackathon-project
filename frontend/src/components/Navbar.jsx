import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function Navbar({ pageName = null, rightAction = null }) {
  const navigate = useNavigate()
  const { userUuid } = useUser()

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(8, 9, 12, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        height: 56,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 clamp(1rem, 4vw, 2rem)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Logo + breadcrumb */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--accent)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Syne',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#020e09',
              flexShrink: 0,
            }}
          >
            M
          </div>
          <span
            style={{
              fontFamily: 'Syne',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}
          >
            MockView
          </span>
          {pageName && (
            <>
              <span style={{ color: 'var(--text-faint)', fontSize: '1rem', userSelect: 'none' }}>/</span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  fontWeight: 400,
                }}
              >
                {pageName}
              </span>
            </>
          )}
        </button>

        {/* Right */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {rightAction ? (
            rightAction
          ) : (
            <button
              className="btn-outline"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              onClick={() => navigate(userUuid ? '/profile' : '/progress')}
            >
              {userUuid ? 'My Profile' : 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}