import { useState, useEffect } from 'react'
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'

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

function BinanceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
      <path d="M12.116 13.884L16 10l3.886 3.886 2.263-2.263L16 5.475 9.853 11.621l2.263 2.263zM5.475 16l2.263-2.263 2.263 2.263-2.263 2.263L5.475 16zm6.641 2.116L16 22l3.886-3.886 2.263 2.263L16 26.525l-6.147-6.146 2.263-2.263zm11.144-2.116l2.263-2.263 2.263 2.263-2.263 2.263L23.26 16zm-4.518 0L16 13.737 13.258 16 16 18.263 18.742 16z" fill="#1E1E1E"/>
    </svg>
  )
}

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

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
        const { error } = await supabase.auth.signUp({
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
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          width: '100%',
          maxWidth: 440,
          padding: '0 16px',
          animation: 'slideUp 0.28s cubic-bezier(0.34, 1.26, 0.64, 1)',
        }}
      >
        {/* Gradient border wrapper */}
        <div style={{
          position: 'relative',
          borderRadius: 28,
        }}>
          {/* Animated gradient border */}
          <div style={{
            position: 'absolute',
            inset: -1,
            borderRadius: 29,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.01) 70%, rgba(255,255,255,0.04) 100%)',
            zIndex: -1,
          }} />

          {/* Modal Body */}
          <div style={{
            background: 'rgba(8, 8, 8, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 28,
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.4)',
          }}>
            {/* Top neon accent */}
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), rgba(255,255,255,0.05), transparent)',
            }} />

            <div style={{ padding: '32px 32px 28px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}>
                    {mode === 'login' ? 'Hoş Geldin 👋' : 'Hesap Oluştur ✨'}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                    {mode === 'login'
                      ? 'CryptoAnalytics platformuna giriş yap'
                      : 'Ücretsiz hesabını oluştur'}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '7px',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* OAuth Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {/* Google Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px 18px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 14,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: 14, fontWeight: 500,
                    transition: 'all 0.18s ease',
                    opacity: loading ? 0.5 : 1,
                    fontFamily: 'Inter, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.03)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <GoogleIcon />
                  Google ile devam et
                </button>

                {/* Binance Button — SOON */}
                <div style={{ position: 'relative' }}>
                  <button
                    disabled
                    style={{
                      width: '100%', padding: '13px 18px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 14,
                      cursor: 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      color: 'rgba(255,255,255,0.28)',
                      fontSize: 14, fontWeight: 500,
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <div style={{ opacity: 0.4, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <BinanceIcon />
                      Binance ile devam et
                    </div>
                  </button>
                  {/* SOON badge */}
                  <span style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 6,
                    background: 'linear-gradient(135deg, rgba(243,186,47,0.2), rgba(243,186,47,0.1))',
                    border: '1px solid rgba(243,186,47,0.25)',
                    color: '#F3BA2F', letterSpacing: '0.08em',
                    boxShadow: '0 0 10px rgba(243,186,47,0.15)',
                  }}>
                    SOON
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>VEYA</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mode === 'signup' && (
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="İsmin"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="interfere-input"
                      style={{ width: '100%', padding: '13px 15px 13px 40px' }}
                    />
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    placeholder="E-posta adresin"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="interfere-input"
                    style={{ width: '100%', padding: '13px 15px 13px 40px' }}
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Şifren"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="interfere-input"
                    style={{ width: '100%', padding: '13px 44px 13px 40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.25)', display: 'flex', padding: 2,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {error && (
                  <div style={{
                    padding: '11px 15px',
                    borderRadius: 12,
                    fontSize: 13,
                    lineHeight: 1.5,
                    backgroundColor: error.includes('gönderildi') ? 'rgba(0,208,132,0.07)' : 'rgba(255,69,96,0.07)',
                    border: `1px solid ${error.includes('gönderildi') ? 'rgba(0,208,132,0.2)' : 'rgba(255,69,96,0.2)'}`,
                    color: error.includes('gönderildi') ? '#00d084' : '#ff4560',
                  }}>
                    {error}
                  </div>
                )}

                {/* Submit — Neon Gold Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-neon"
                  style={{
                    width: '100%',
                    padding: '14px',
                    marginTop: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {loading ? (
                    <span style={{ opacity: 0.7 }}>Yükleniyor...</span>
                  ) : (
                    <>
                      {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Switch mode */}
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>
                  {mode === 'login' ? 'Hesabın yok mu? ' : 'Zaten üye misin? '}
                </span>
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#f5a623', fontSize: 13, fontWeight: 600, padding: 0,
                    transition: 'color 0.15s',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ffb94a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#f5a623'}
                >
                  {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
