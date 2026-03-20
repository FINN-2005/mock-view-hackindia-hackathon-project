import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useUser } from '../context/UserContext'
import { startInterview, nextTurn, endInterview } from '../api/client'

const THINKING = (
  <span style={{ display: 'flex', gap: 5, alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
    <span className="thinking-dot" />
    <span className="thinking-dot" />
    <span className="thinking-dot" />
    <span style={{ marginLeft: 6 }}>Interviewer is thinking...</span>
  </span>
)

let currentAudio = null

async function speakText(text) {
  try {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
      currentAudio = null
    }
    const res = await fetch('http://localhost:8000/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error('TTS failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio
    audio.onended = () => URL.revokeObjectURL(url)
    await audio.play()
  } catch (e) {
    console.warn('TTS unavailable:', e.message)
  }
}

export default function Interview() {
  const navigate = useNavigate()
  const { userUuid, interviewConfig } = useUser()

  const [phase, setPhase] = useState('loading') // loading | active | ended
  const [question, setQuestion] = useState('')
  const [feedback, setFeedback] = useState('')
  const [thinking, setThinking] = useState(false)
  const [typedQ, setTypedQ] = useState('')
  const [answer, setAnswer] = useState('')
  const [codeContent, setCodeContent] = useState('')
  const [scratchContent, setScratchContent] = useState('')
  const [activeTab, setActiveTab] = useState('code')
  const [micActive, setMicActive] = useState(false)
  const [camActive, setCamActive] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')
  const answerRef = useRef(answer)
  answerRef.current = answer

  useEffect(() => {
    if (camActive && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream
          if (videoRef.current) videoRef.current.srcObject = stream
        })
        .catch(() => setCamActive(false))
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [camActive])

  // Load webcam
  // useEffect(() => {
  //   if (camActive && videoRef.current) {
  //     navigator.mediaDevices
  //       .getUserMedia({ video: true })
  //       .then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream })
  //       .catch(() => setCamActive(false))
  //   } else if (!camActive && videoRef.current?.srcObject) {
  //     videoRef.current.srcObject.getTracks().forEach((t) => t.stop())
  //     videoRef.current.srcObject = null
  //   }
  // }, [camActive])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (recognitionRef.current) recognitionRef.current.stop()
      if (currentAudio) { currentAudio.pause(); currentAudio = null }
    }
  }, [])

  // Start interview on mount
  const startedRef = useRef(false)

  // Typing animation for question text
  useEffect(() => {
    if (!question) return
    setTypedQ('')
    let i = 0
    const t = setInterval(() => {
      setTypedQ(question.slice(0, i + 1))
      i++
      if (i >= question.length) clearInterval(t)
    }, 18)
    return () => clearInterval(t)
  }, [question])

  useEffect(() => {
    if (!userUuid || !interviewConfig) { navigate('/interview-configurator'); return }
    if (startedRef.current) return
    startedRef.current = true
    ;(async () => {
      try {
        const res = await startInterview(userUuid, interviewConfig)
        setQuestion(res.data.question)
        speakText(res.data.question)
        setPhase('active')
      } catch (e) {
        console.error(e)
        setPhase('active')
        setQuestion('Welcome to your mock interview. Could you please introduce yourself?')
      }
    })()
  }, [])

  // Mic via Web Speech API
  const toggleMic = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    if (micActive) {
      recognitionRef.current?.stop()
      return
    }

    // Request mic permission explicitly first — this triggers the browser prompt
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop()) // we don't need the stream, just the permission
    } catch (err) {
      alert('Microphone permission denied. Please allow microphone access in your browser and try again.')
      return
    }

    transcriptRef.current = ''
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (e) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript
        } else {
          interim += e.results[i][0].transcript
        }
      }
      transcriptRef.current = final + interim
      setAnswer(transcriptRef.current)
    }

    rec.onerror = (e) => {
      console.warn('STT error:', e.error)
      if (e.error === 'not-allowed') {
        alert('Microphone access was blocked. Please allow it in your browser settings and try again.')
      }
      setMicActive(false)
    }

    rec.onend = () => {
      if (transcriptRef.current.trim()) {
        setAnswer(transcriptRef.current.trim())
      }
      setMicActive(false)
    }

    rec.start()
    recognitionRef.current = rec
    setMicActive(true)
  }, [micActive])
  const handleSendAnswer = async () => {
    if (thinking || phase !== 'active' || !answer.trim()) return
    const userAnswer = answer.trim()
    transcriptRef.current = ''    // ← prevent onend from restoring old transcript
    recognitionRef.current?.stop()
    setMicActive(false)
    setThinking(true)
    setAnswer('')
    try {
      const res = await nextTurn(userUuid, userAnswer, codeContent, scratchContent)
      setFeedback(res.data.feedback || '')
      setQuestion(res.data.question)
      speakText(res.data.question)
      if (res.data.interview_ended) setPhase('ended')
    } catch (e) {
      setFeedback('')
      setQuestion('Could you elaborate on your previous answer?')
    } finally {
      setThinking(false)
    }
  }

  const handleEndInterview = async () => {
    if (!window.confirm('End the interview now? Results will be generated.')) return
    window.speechSynthesis?.cancel()
    recognitionRef.current?.stop()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setCamActive(false)
    setThinking(true)
    try {
      const res = await endInterview(userUuid)
      navigate('/results')
    } catch {
      navigate('/results')
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Loading overlay */}
      {phase === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6,10,18,0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99,
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <span className="thinking-dot" />{' '}
            <span className="thinking-dot" />{' '}
            <span className="thinking-dot" />
          </div>
          <p style={{ fontFamily: 'Syne', color: 'var(--text-muted)', margin: 0 }}>
            Preparing your interview...
          </p>
        </div>
      )}

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left / Main Stage ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>

          {/* Video area */}
          <div
            style={{
              flex: 1,
              background: '#070d18',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* User cam */}
            <div
              style={{
                width: '60%',
                maxWidth: 500,
                aspectRatio: '16/9',
                background: 'var(--surface2)',
                border: '2px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {camActive ? (
                <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👤</div>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Camera off</p>
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.7)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  fontFamily: 'JetBrains Mono',
                  color: '#fff',
                }}
              >
                You
              </div>
              {micActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--danger)',
                  }}
                />
              )}
            </div>

            {/* Interviewer AI — floating top-right */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 160,
                aspectRatio: '4/3',
                background: 'var(--surface)',
                border: '2px solid var(--accent)',
                borderRadius: 6,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                boxShadow: '0 0 20px rgba(14,165,233,0.2)',
              }}
            >
              {thinking ? (
                <>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
                  </div>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
                    Thinking...
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2.5rem' }}>🤖</div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                    ACTIVE
                  </p>
                </>
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 6,
                  background: 'rgba(0,0,0,0.7)',
                  padding: '0.15rem 0.4rem',
                  borderRadius: 2,
                  fontSize: '0.65rem',
                  fontFamily: 'JetBrains Mono',
                  color: '#fff',
                }}
              >
                Interviewer AI
              </div>
            </div>

            {/* Interview ended banner */}
            {phase === 'ended' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid var(--success)',
                  borderRadius: 4,
                  padding: '0.65rem 1.25rem',
                  color: 'var(--success)',
                  fontFamily: 'Syne',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textAlign: 'center',
                }}
              >
                Interview complete. Click "End & See Results" below.
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div
            style={{
              height: 68,
              background: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '0 1.5rem',
            }}
          >
            {/* Mic */}
            <button
              onClick={toggleMic}
              disabled={thinking || phase !== 'active'}
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                border: `2px solid ${micActive ? 'var(--danger)' : 'var(--border)'}`,
                background: micActive ? 'rgba(239,68,68,0.15)' : 'var(--surface2)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.2s',
              }}
              title="Toggle mic"
            >
              {micActive ? '🎙️' : '🔇'}
              {micActive && (
                <span
                  className="pulse-ring"
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    border: '2px solid var(--danger)',
                    opacity: 0.5,
                  }}
                />
              )}
            </button>

            {/* End */}
            <button
              className="btn-danger"
              onClick={handleEndInterview}
              style={{ padding: '0.6rem 1.5rem', borderRadius: 4 }}
            >
              {phase === 'ended' ? 'End & See Results' : '■ End Interview'}
            </button>

            {/* Camera */}
            <button
              onClick={() => setCamActive((c) => !c)}
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                border: `2px solid ${camActive ? 'var(--accent)' : 'var(--border)'}`,
                background: camActive ? 'rgba(14,165,233,0.15)' : 'var(--surface2)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title="Toggle camera"
            >
              {camActive ? '📷' : '📷'}
            </button>

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 4,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                fontFamily: 'JetBrains Mono',
              }}
            >
              {sidebarOpen ? '→ Hide' : '← Show'}
            </button>
          </div>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────────── */}
        {sidebarOpen && (
          <div
            style={{
              width: 380,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowY: 'auto', flexShrink: 0, maxHeight: '55%' }}>
            {/* Current question */}
            <div
              style={{
                padding: '1.25rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <p className="label" style={{ marginBottom: '0.5rem' }}>Current Question</p>
              <div
                style={{
                  minHeight: 60,
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: 'var(--text)',
                  fontFamily: 'Outfit',
                }}
              >
                {thinking ? THINKING : (
                  <>
                    {typedQ}
                    {question && typedQ.length < question.length && <span className="typing-cursor" />}
                  </>
                )}
              </div>

              {feedback && !thinking && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    borderRadius: 4,
                    fontSize: '0.8rem',
                    color: '#6ee7b7',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: 2, color: 'var(--success)' }}>Feedback</strong>
                  {feedback}
                </div>
              )}
            </div>

            {/* Answer input */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <p className="label" style={{ marginBottom: '0.5rem' }}>
                Your Answer {micActive && <span style={{ color: 'var(--danger)', marginLeft: 6 }}>● REC</span>}
              </p>
              <textarea
                className="input"
                rows={4}
                placeholder={
                  phase === 'ended'
                    ? 'Interview ended. Click End below to see results.'
                    : micActive
                    ? 'Listening… speak your answer. Click mic to stop.'
                    : 'Type your answer here, or use the mic above...'
                }
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={thinking || phase !== 'active'}
                style={{ resize: 'none' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handleSendAnswer()
                }}
              />
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', opacity: thinking || phase !== 'active' ? 0.5 : 1 }}
                onClick={handleSendAnswer}
                disabled={thinking || phase !== 'active'}
              >
                {thinking ? 'Waiting...' : 'Send Answer (Ctrl+Enter)'}
              </button>
            </div>
            </div>  {/* end scrollable top */}
            {/* Tools tabs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {['code', 'scratch'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      border: 'none',
                      borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                      background: 'none',
                      color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontFamily: 'Syne',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      letterSpacing: '0.05em',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tab === 'code' ? 'Code Editor' : 'Scratch Pad'}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === 'code' ? (
                  <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    value={codeContent}
                    onChange={(v) => setCodeContent(v || '')}
                    options={{
                      fontSize: 12,
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      padding: { top: 8 },
                    }}
                  />
                ) : (
                  <textarea
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'var(--surface2)',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text)',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '0.8rem',
                      padding: '0.75rem',
                      resize: 'none',
                      lineHeight: 1.6,
                    }}
                    placeholder="Scratch pad — notes, pseudocode, diagrams in ASCII..."
                    value={scratchContent}
                    onChange={(e) => setScratchContent(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
