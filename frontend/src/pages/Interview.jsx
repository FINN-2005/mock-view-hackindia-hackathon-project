import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useUser } from '../context/UserContext'
import { startInterview, nextTurn, endInterview } from '../api/client'

const THINKING_INDICATOR = (
  <span style={{ display: 'flex', gap: 5, alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
    <span className="thinking-dot" />
    <span className="thinking-dot" />
    <span className="thinking-dot" />
    <span style={{ marginLeft: 6, fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }}>Interviewer is thinking…</span>
  </span>
)

let currentAudio = null

async function speakText(text) {
  try {
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null }
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

  const [phase, setPhase] = useState('loading')
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
  const startedRef = useRef(false)

  useEffect(() => {
    if (camActive && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => { streamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream })
        .catch(() => setCamActive(false))
    } else {
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [camActive])

  useEffect(() => {
    return () => {
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()) }
      if (recognitionRef.current) recognitionRef.current.stop()
      if (currentAudio) { currentAudio.pause(); currentAudio = null }
    }
  }, [])

  useEffect(() => {
    if (!question) return
    setTypedQ('')
    let i = 0
    const t = setInterval(() => {
      setTypedQ(question.slice(0, i + 1))
      i++
      if (i >= question.length) clearInterval(t)
    }, 16)
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
      } catch {
        setPhase('active')
        setQuestion('Welcome to your mock interview. Could you please introduce yourself?')
      }
    })()
  }, [])

  const toggleMic = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    if (micActive) {
      if (recognitionRef.current) recognitionRef.current.stop()
      setMicActive(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      alert('Microphone permission denied.')
      return
    }
    transcriptRef.current = ''
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onstart = () => setMicActive(true)
    rec.onresult = (e) => {
      let final = '', interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      if (final) transcriptRef.current += final
      setAnswer((transcriptRef.current + interim).trim())
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') alert('Microphone access was blocked.')
      setMicActive(false)
    }
    rec.onend = () => {
      setMicActive(false)
      if (transcriptRef.current.trim()) setAnswer(transcriptRef.current.trim())
    }
    try {
      rec.start()
      recognitionRef.current = rec
      setMicActive(true)
    } catch { setMicActive(false) }
  }, [micActive])

  const handleSendAnswer = async () => {
    if (thinking || phase !== 'active' || !answer.trim()) return
    const userAnswer = answer.trim()
    transcriptRef.current = ''
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
    } catch {
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
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
    if (videoRef.current) videoRef.current.srcObject = null
    setCamActive(false)
    setThinking(true)
    try { await endInterview(userUuid) } catch {}
    navigate('/results')
  }

  const iconBtn = (active, icon, onClick, danger = false) => ({
    width: 42, height: 42, borderRadius: '50%',
    border: `1.5px solid ${active ? (danger ? 'rgba(240,78,78,0.5)' : 'rgba(0,200,150,0.4)') : 'var(--border)'}`,
    background: active ? (danger ? 'rgba(240,78,78,0.1)' : 'var(--accent-dim)') : 'var(--surface2)',
    cursor: 'pointer', fontSize: '1.1rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s', position: 'relative',
  })

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Loading overlay */}
      {phase === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(8,9,12,0.96)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 99, gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
          </div>
          <p style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
            preparing your interview…
          </p>
        </div>
      )}

      {/* Minimal header bar */}
      <div style={{
        height: 48, background: 'var(--surface)', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.25rem', flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: '0.85rem', color: '#020e09' }}>N</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>Nexus</span>
          <span style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>/</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: 'var(--text-muted)' }}>interview</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {phase === 'active' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block', boxShadow: '0 0 6px var(--danger)' }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: 'var(--danger)' }}>LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: Camera + Controls ─────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Camera area */}
          <div style={{
            flex: 1, background: '#060810',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* User cam */}
            <div style={{
              width: '60%', maxWidth: 480,
              aspectRatio: '16/9',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 10, overflow: 'hidden', position: 'relative',
            }}>
              {camActive ? (
                <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem' }}>👤</div>
                  <p style={{ margin: 0, fontSize: '0.78rem', fontFamily: 'JetBrains Mono' }}>Camera off</p>
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 8, left: 8,
                background: 'rgba(0,0,0,0.65)', padding: '0.15rem 0.5rem', borderRadius: 4,
                fontSize: '0.68rem', fontFamily: 'JetBrains Mono', color: '#fff',
              }}>You</div>
              {micActive && (
                <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 8px var(--danger)' }} />
              )}
            </div>

            {/* AI interviewer pip */}
            <div style={{
              position: 'absolute', top: 12, right: 12,
              width: 150, aspectRatio: '4/3',
              background: 'var(--surface)',
              border: `1.5px solid ${thinking ? 'rgba(155,114,245,0.4)' : 'rgba(0,200,150,0.3)'}`,
              borderRadius: 8, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              boxShadow: thinking ? '0 0 16px rgba(155,114,245,0.2)' : '0 0 16px rgba(0,200,150,0.15)',
              transition: 'all 0.3s',
            }}>
              {thinking ? (
                <>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
                  </div>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>Thinking…</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2rem' }}>🤖</div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.6rem', color: 'var(--accent)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>ACTIVE</p>
                </>
              )}
              <div style={{
                position: 'absolute', bottom: 5, left: 5,
                background: 'rgba(0,0,0,0.6)', padding: '0.12rem 0.35rem', borderRadius: 3,
                fontSize: '0.6rem', fontFamily: 'JetBrains Mono', color: '#fff',
              }}>Interviewer AI</div>
            </div>

            {/* Ended banner */}
            {phase === 'ended' && (
              <div style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.3)',
                borderRadius: 6, padding: '0.6rem 1.25rem',
                color: 'var(--success)', fontFamily: 'Syne', fontWeight: 600, fontSize: '0.85rem',
              }}>
                Interview complete — click "End & See Results" below.
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div style={{
            height: 64, background: 'var(--surface)', borderTop: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem', padding: '0 1.25rem', flexShrink: 0,
          }}>
            {/* Mic */}
            <button
              onClick={toggleMic}
              disabled={thinking || phase !== 'active'}
              style={iconBtn(micActive, micActive ? '🎙️' : '🔇', toggleMic, true)}
              title="Toggle mic"
            >
              {micActive ? '🎙️' : '🔇'}
              {micActive && (
                <span className="pulse-ring" style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  border: '1.5px solid var(--danger)', opacity: 0.5,
                }} />
              )}
            </button>

            {/* End */}
            <button
              className="btn-danger"
              onClick={handleEndInterview}
              style={{ padding: '0.55rem 1.4rem', fontSize: '0.85rem' }}
            >
              {phase === 'ended' ? 'End & See Results' : '■ End Interview'}
            </button>

            {/* Camera */}
            <button
              onClick={() => setCamActive((c) => !c)}
              style={iconBtn(camActive, '📷', null)}
              title="Toggle camera"
            >
              📷
            </button>

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="btn-ghost"
              style={{ marginLeft: 'auto', fontSize: '0.75rem', fontFamily: 'JetBrains Mono', padding: '0.35rem 0.7rem' }}
            >
              {sidebarOpen ? '→' : '←'} Panel
            </button>
          </div>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────── */}
        {sidebarOpen && (
          <div style={{
            width: 360, flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            background: 'var(--surface)', borderLeft: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}>
            {/* Scrollable top section */}
            <div style={{ overflowY: 'auto', flexShrink: 0, maxHeight: '55%' }}>

              {/* Question */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="label" style={{ marginBottom: '0.5rem' }}>Current Question</p>
                <div style={{ minHeight: 56, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text)', fontWeight: 400 }}>
                  {thinking ? THINKING_INDICATOR : (
                    <>
                      {typedQ}
                      {question && typedQ.length < question.length && <span className="typing-cursor" />}
                    </>
                  )}
                </div>

                {feedback && !thinking && (
                  <div style={{
                    marginTop: '0.75rem', padding: '0.6rem 0.85rem',
                    background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.2)',
                    borderLeft: '2px solid var(--accent)', borderRadius: 6,
                    fontSize: '0.78rem', color: 'rgba(0,200,150,0.85)', lineHeight: 1.5,
                  }}>
                    <strong style={{ display: 'block', marginBottom: 2, color: 'var(--accent)', fontSize: '0.7rem', fontFamily: 'JetBrains Mono', letterSpacing: '0.05em' }}>FEEDBACK</strong>
                    {feedback}
                  </div>
                )}
              </div>

              {/* Answer */}
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="label" style={{ marginBottom: '0.5rem' }}>
                  Your Answer
                  {micActive && <span style={{ color: 'var(--danger)', marginLeft: 6, fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }}>● REC</span>}
                </p>
                <textarea
                  className="input"
                  rows={4}
                  placeholder={
                    phase === 'ended' ? 'Interview ended.'
                    : micActive ? 'Listening… speak your answer.'
                    : 'Type your answer, or use the mic…'
                  }
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={thinking || phase !== 'active'}
                  style={{ resize: 'none', fontSize: '0.85rem', lineHeight: 1.6 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSendAnswer() }}
                />
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: (thinking || phase !== 'active') ? 0.4 : 1, fontSize: '0.85rem', padding: '0.6rem' }}
                  onClick={handleSendAnswer}
                  disabled={thinking || phase !== 'active'}
                >
                  {thinking ? 'Waiting…' : 'Send Answer (Ctrl+Enter)'}
                </button>
              </div>
            </div>

            {/* Tools tabs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                {['code', 'scratch'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: '0.55rem',
                      border: 'none',
                      borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                      background: 'none',
                      color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer', fontFamily: 'JetBrains Mono',
                      fontWeight: 600, fontSize: '0.72rem',
                      letterSpacing: '0.05em', transition: 'all 0.15s',
                    }}
                  >
                    {tab === 'code' ? 'CODE' : 'NOTES'}
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
                      fontSize: 12, minimap: { enabled: false },
                      lineNumbers: 'on', scrollBeyondLastLine: false,
                      wordWrap: 'on', padding: { top: 8 },
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                ) : (
                  <textarea
                    style={{
                      width: '100%', height: '100%',
                      background: 'var(--surface2)', border: 'none', outline: 'none',
                      color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono',
                      fontSize: '0.78rem', padding: '0.75rem', resize: 'none', lineHeight: 1.7,
                    }}
                    placeholder="Scratch pad — notes, pseudocode, ASCII diagrams…"
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