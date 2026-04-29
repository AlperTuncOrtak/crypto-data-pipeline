import { useState, useEffect } from 'react'
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// Google SVG Icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
      <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 11.7z" fill="#FF3D00"/>
      <path d="M24 45c5.5 0 10.5-1.9 14.4-5.1L31.6 34c-2.1 1.5-4.8 2.4-7.6 2.4-6.1 0-10.7-3.9-11.8-9.1l-7 5.4C8.1 40.7 15.5 45 24 45z" fill="#4CAF50"/>
      <path d="M44.5 20H24v8.5h11.8c-.6 2.9-2.4 5.4-4.9 7l6.8 5.3C41.7 37 45 31 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
    </svg>
  )
}

// Binance SVG Icon
function BinanceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
      <path d="M12.116 13.884L16 10l3.886 3.886 2.263-2.263L16 5.475 9.853 11.621l2.263 2.263zM5.475 16l2.263-2.263 2.263 2.263-2.263 2.263L5.475 16zm6.641 2.116L16 22l3.886-3.886 2.263 2.263L16 26.525l-6.147-6.146 2.263-2.263zm11.144-2.116l2.263-2.263 2.263 2.263-2.263 2.263L23.26 16zm-4.518 0L16 13.737 13.258 16 16 18.263 18.742 16z" fill="#1E1E1E"/>
    </svg>
  )
}

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ESC tuşuyla kapat
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Scroll kilitle
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleBinanceLogin() {
    // Binance henüz Supabase'de desteklenmiyor — demo mod
    onLogin({ name: 'Binance User', email: 'user@binance.com', avatar: null })
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const u = data.user
        onLogin({
          name: u.user_metadata?.full_name || u.email,
          email: u.email,
          avatar: u.user_metadata?.avatar_url || null,
        })
        onClose()
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setError('Doğrulama e-postası gönderildi! Lütfen e-postanı kontrol et.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.18s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          width: '100%',
          maxWidth: 420,
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          style={{
            backgroundColor: '#111',
            border: '1px solid #222',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(245,166,35,0.08)',
          }}
        >
          {/* Top accent line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, #f5a623, #e8941a, transparent)' }} />

          <div style={{ padding: '28px 28px 24px' }}>
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
              <div>
                <div
                  className="text-lg font-bold"
                  style={{ color: '#f0f0f0', letterSpacing: '-0.02em' }}
                >
                  {mode === 'login' ? 'Hoş Geldin 👋' : 'Hesap Oluştur ✨'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#555' }}>
                  {mode === 'login'
                    ? 'CryptoAnalytics platformuna giriş yap'
                    : 'Ücretsiz hesabını oluştur'}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: '1px solid #2a2a2a',
                  borderRadius: 8, padding: '6px', cursor: 'pointer',
                  color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#999' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* OAuth Buttons */}
            <div className="flex flex-col gap-2.5" style={{ marginBottom: 20 }}>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%', padding: '11px 16px',
                  background: loading ? '#111' : '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  color: loading ? '#444' : '#d0d0d0', fontSize: 14, fontWeight: 500,
                  transition: 'all 0.15s', opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.background = '#222' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.background = '#1a1a1a' }}
              >
                <GoogleIcon />
                Google ile devam et
              </button>

              <button
                disabled
                onClick={handleBinanceLogin}
                style={{
                  width: '100%', padding: '11px 16px',
                  background: '#111',
                  border: '1px solid #2a2a2a',
                  borderRadius: 12, cursor: 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  color: '#666', fontSize: 14, fontWeight: 500,
                  position: 'relative'
                }}
              >
                <div style={{ opacity: 0.5, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BinanceIcon />
                  Binance ile devam et
                </div>
                <span style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 10, fontWeight: 800, padding: '3px 6px', borderRadius: 6,
                  backgroundColor: 'rgba(243,186,47,0.15)', color: '#F3BA2F', letterSpacing: '0.05em'
                }}>
                  SOON
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e1e' }} />
              <span style={{ fontSize: 11, color: '#444', letterSpacing: '0.08em' }}>VEYA</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e1e' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {mode === 'signup' && (
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                  <input
                    type="text"
                    placeholder="İsmin"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px 11px 38px',
                      background: '#1a1a1a', border: '1px solid #2a2a2a',
                      borderRadius: 12, color: '#d0d0d0', fontSize: 14,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
                    onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                  />
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                <input
                  type="email"
                  placeholder="E-posta adresin"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '11px 14px 11px 38px',
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    borderRadius: 12, color: '#d0d0d0', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Şifren"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '11px 42px 11px 38px',
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    borderRadius: 12, color: '#d0d0d0', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.4)'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#444', display: 'flex', padding: 2,
                  }}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Error / Info Message */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  backgroundColor: error.includes('gönderildi') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${error.includes('gönderildi') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  color: error.includes('gönderildi') ? '#22c55e' : '#ef4444',
                  lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: 'linear-gradient(135deg, #f5a623, #e8941a)',
                  border: 'none', borderRadius: 12, cursor: 'pointer',
                  color: '#111', fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 4,
                  boxShadow: '0 4px 20px rgba(245,166,35,0.3)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 28px rgba(245,166,35,0.5)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,166,35,0.3)'}
              >
                {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                <ArrowRight size={15} />
              </button>
            </form>

            {/* Switch mode */}
            <div className="text-center" style={{ marginTop: 18 }}>
              <span style={{ fontSize: 13, color: '#555' }}>
                {mode === 'login' ? 'Hesabın yok mu? ' : 'Zaten üye misin? '}
              </span>
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#f5a623', fontSize: 13, fontWeight: 600, padding: 0,
                }}
              >
                {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) }
          to   { opacity: 1; transform: translate(-50%, -50%) }
        }
        input::placeholder { color: #3a3a3a !important; }
      `}</style>
    </>
  )
}
