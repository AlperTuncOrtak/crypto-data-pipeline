import { useState } from 'react'
import { useMarket } from '../hooks/useMarket'
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Search, Loader, Zap, Shield, Target } from 'lucide-react'
import { apiClient } from '../api/client'

function formatPrice(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (num >= 1)    return `$${num.toFixed(2)}`
  if (num >= 0.01) return `$${num.toFixed(4)}`
  return `$${num.toFixed(6)}`
}

const SIGNAL_CONFIG = {
  buy:  { color: '#2ecc71', bg: 'rgba(46,204,113,0.08)',  border: 'rgba(46,204,113,0.25)',  glow: 'rgba(46,204,113,0.12)',  icon: TrendingUp,   label: 'BUY'  },
  sell: { color: '#e74c3c', bg: 'rgba(231,76,60,0.08)',   border: 'rgba(231,76,60,0.25)',   glow: 'rgba(231,76,60,0.12)',   icon: TrendingDown, label: 'SELL' },
  hold: { color: '#f5a623', bg: 'rgba(245,166,35,0.08)',  border: 'rgba(245,166,35,0.25)',  glow: 'rgba(245,166,35,0.12)',  icon: Minus,        label: 'HOLD' },
}

const SENTIMENT_COLOR = { bullish: '#2ecc71', bearish: '#e74c3c', neutral: '#f5a623' }
const RISK_COLOR = { low: '#2ecc71', medium: '#f5a623', high: '#e74c3c' }

function getSubColor(sub) {
  if (!sub) return 'var(--text-muted)'
  const s = String(sub).toLowerCase()
  if (['bullish', 'oversold', 'near_lower'].includes(s)) return '#2ecc71'
  if (['bearish', 'overbought', 'near_upper'].includes(s)) return '#e74c3c'
  return '#f5a623'
}

function RSIGauge({ value }) {
  if (!value) return null
  const pct = Math.min(Math.max(value, 0), 100)
  const color = value > 70 ? '#e74c3c' : value < 30 ? '#2ecc71' : '#f5a623'
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ position: 'relative', height: 6, borderRadius: 3, backgroundColor: 'var(--bg-elevated)', display: 'flex', overflow: 'visible' }}>
        <div style={{ width: '30%', height: '100%', backgroundColor: 'rgba(46,204,113,0.2)' }} />
        <div style={{ width: '40%', height: '100%', backgroundColor: 'rgba(245,166,35,0.2)' }} />
        <div style={{ width: '30%', height: '100%', backgroundColor: 'rgba(231,76,60,0.2)' }} />
        <div style={{
          position: 'absolute', left: `${pct}%`, top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 10, height: 10, borderRadius: '50%',
          backgroundColor: color, border: '2px solid var(--bg-surface)',
          boxShadow: `0 0 6px ${color}`, transition: 'left 1s ease', zIndex: 2,
        }} />
      </div>
      <div className="flex justify-between mt-1">
        <span style={{ fontSize: 9, color: '#2ecc71' }}>30</span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>RSI: {value}</span>
        <span style={{ fontSize: 9, color: '#e74c3c' }}>70</span>
      </div>
    </div>
  )
}

function BBBar({ position }) {
  if (position === null || position === undefined) return null
  const pct = Math.min(Math.max(position * 100, 0), 100)
  const color = pct > 80 ? '#e74c3c' : pct < 20 ? '#2ecc71' : '#f5a623'
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ position: 'relative', height: 6, borderRadius: 3, backgroundColor: 'var(--bg-elevated)', overflow: 'visible' }}>
        <div style={{
          position: 'absolute', left: `${pct}%`, top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 10, height: 10, borderRadius: '50%',
          backgroundColor: color, border: '2px solid var(--bg-surface)',
          boxShadow: `0 0 6px ${color}`, transition: 'left 1s ease',
        }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'var(--border)', opacity: 0.5 }} />
      </div>
      <div className="flex justify-between mt-1">
        <span style={{ fontSize: 9, color: '#2ecc71' }}>Lower</span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>BB: {pct.toFixed(0)}%</span>
        <span style={{ fontSize: 9, color: '#e74c3c' }}>Upper</span>
      </div>
    </div>
  )
}

function MACDIndicator({ trend }) {
  if (!trend) return null
  const isBull = trend === 'bullish'
  const color = isBull ? '#2ecc71' : '#e74c3c'
  const Icon = isBull ? TrendingUp : TrendingDown
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, backgroundColor: `${color}12`, border: `1px solid ${color}30`, width: 'fit-content' }}>
        <Icon size={12} style={{ color }} />
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'capitalize' }}>{trend}</span>
      </div>
    </div>
  )
}

function EMAIndicator({ trend }) {
  if (!trend || trend === 'insufficient_data') return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Insufficient data</span>
  const isBull = trend === 'bullish'
  const color = isBull ? '#2ecc71' : '#e74c3c'
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, backgroundColor: `${color}12`, border: `1px solid ${color}30`, width: 'fit-content' }}>
        <span style={{ fontSize: 10, color, fontWeight: 700 }}>EMA20 {isBull ? '>' : '<'} EMA50</span>
      </div>
    </div>
  )
}

export default function AIAnalysis() {
  const { data: marketData } = useMarket(500)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [userInput, setUserInput] = useState({
    entryPrice: '',
    quantity: '',
    positionType: 'long',
    riskTolerance: 'balanced',
    timeframe: 'short',
  })

  const filtered = search.trim()
    ? (marketData || []).filter(c =>
        c.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : []

  async function analyze() {
    if (!selected) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await apiClient.get(`/ai/analyze/${selected.slug}`, {
        params: {
          entry_price: userInput.entryPrice || null,
          quantity: userInput.quantity || null,
          position_type: userInput.positionType,
          risk_tolerance: userInput.riskTolerance,
          timeframe: userInput.timeframe,
        }
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const signalConfig = result ? SIGNAL_CONFIG[result.signal] : null
  const SignalIcon = signalConfig?.icon

  return (
    <div style={{ color: 'var(--text-primary)', maxWidth: 1100, margin: '0 auto' }}>

      {/* MODAL */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 998, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 999, width: '100%', maxWidth: 480, padding: '0 16px' }}>
            <div style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>
              <div style={{ height: 2, background: 'linear-gradient(90deg, #f5a623, transparent)' }} />
              <div style={{ padding: '28px 28px 24px' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {selected?.image_url && <img src={selected.image_url} style={{ width: 24, height: 24, borderRadius: '50%' }} />}
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{selected?.name} Analysis</span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Enter your position details for personalized advice</div>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>×</button>
                </div>

                {/* Entry + Quantity */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { key: 'entryPrice', label: 'Entry Price (USD)', placeholder: `e.g. ${selected?.current_price?.toFixed(2)}` },
                    { key: 'quantity', label: 'Quantity', placeholder: `e.g. 0.5 ${selected?.symbol?.toUpperCase()}` },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{field.label}</label>
                      <input
                        type="number"
                        placeholder={field.placeholder}
                        value={userInput[field.key]}
                        onChange={e => setUserInput(p => ({ ...p, [field.key]: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none', caretColor: 'var(--accent)', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(245,166,35,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  ))}
                </div>

                {/* Position Type */}
                <div className="mb-4">
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Position Type</label>
                  <div className="flex gap-2">
                    {[
                      { key: 'long', label: '📈 Long', color: '#2ecc71' },
                      { key: 'short', label: '📉 Short', color: '#e74c3c' },
                      { key: 'watching', label: '👀 Watching', color: '#f5a623' },
                    ].map(opt => (
                      <button key={opt.key} onClick={() => setUserInput(p => ({ ...p, positionType: opt.key }))}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: userInput.positionType === opt.key ? `${opt.color}18` : 'var(--bg-elevated)', color: userInput.positionType === opt.key ? opt.color : 'var(--text-muted)', outline: userInput.positionType === opt.key ? `1px solid ${opt.color}44` : '1px solid var(--border)' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk Tolerance */}
                <div className="mb-4">
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Risk Tolerance</label>
                  <div className="flex gap-2">
                    {[
                      { key: 'conservative', label: '🛡️ Conservative' },
                      { key: 'balanced', label: '⚖️ Balanced' },
                      { key: 'aggressive', label: '🔥 Aggressive' },
                    ].map(opt => (
                      <button key={opt.key} onClick={() => setUserInput(p => ({ ...p, riskTolerance: opt.key }))}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: userInput.riskTolerance === opt.key ? 'rgba(245,166,35,0.12)' : 'var(--bg-elevated)', color: userInput.riskTolerance === opt.key ? 'var(--accent)' : 'var(--text-muted)', outline: userInput.riskTolerance === opt.key ? '1px solid rgba(245,166,35,0.35)' : '1px solid var(--border)' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeframe */}
                <div className="mb-6">
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Investment Timeframe</label>
                  <div className="flex gap-2">
                    {[
                      { key: 'short', label: '⚡ 1-7 days' },
                      { key: 'medium', label: '📅 1-4 weeks' },
                      { key: 'long', label: '🌙 1-6 months' },
                    ].map(opt => (
                      <button key={opt.key} onClick={() => setUserInput(p => ({ ...p, timeframe: opt.key }))}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: userInput.timeframe === opt.key ? 'rgba(245,166,35,0.12)' : 'var(--bg-elevated)', color: userInput.timeframe === opt.key ? 'var(--accent)' : 'var(--text-muted)', outline: userInput.timeframe === opt.key ? '1px solid rgba(245,166,35,0.35)' : '1px solid var(--border)' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Butonlar */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowModal(false); analyze() }}
                    style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f5a623, #e8941a)', color: '#111', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,166,35,0.35)' }}
                  >
                    🧠 Analyze
                  </button>
                  <button
                    onClick={() => { setShowModal(false); analyze() }}
                    style={{ padding: '12px 16px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Skip →
                  </button>
                </div>
                <div className="text-center mt-3 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  All fields optional · Your data stays local
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.05))', border: '1px solid rgba(245,166,35,0.3)', boxShadow: '0 0 24px rgba(245,166,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Technical Analysis</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Gemini 2.5 · RSI · MACD · Bollinger Bands · EMA 20/50</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', color: 'var(--text-muted)' }}>
            <AlertTriangle size={12} style={{ color: 'var(--accent)' }} />
            Not financial advice. DYOR.
          </div>
        </div>
      </div>

      {/* COİN SEÇİCİ */}
      <div className="rounded-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px', marginBottom: 24 }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative" style={{ flex: 1, minWidth: 200 }}>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)', border: `1px solid ${showDropdown ? 'rgba(245,166,35,0.4)' : 'var(--border)'}`, transition: 'border-color 0.2s' }}>
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder={selected ? `${selected.name} selected` : 'Search coin (BTC, ETH...)'}
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                onFocus={() => { setShowDropdown(true); setSearch('') }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className="bg-transparent outline-none text-sm w-full"
                style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
              />
              {selected && !search && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {selected.image_url && <img src={selected.image_url} style={{ width: 20, height: 20, borderRadius: '50%' }} />}
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--accent)' }}>{selected.symbol?.toUpperCase()}</span>
                </div>
              )}
            </div>
            {showDropdown && filtered.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-50" style={{ backgroundColor: '#1a1a1a', border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                {filtered.map(coin => (
                  <div key={coin.symbol} onClick={() => { setSelected(coin); setSearch(''); setShowDropdown(false) }}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {coin.image_url ? <img src={coin.image_url} style={{ width: 28, height: 28, borderRadius: '50%' }} /> : <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{coin.symbol?.slice(0, 1)}</div>}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{coin.name}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{coin.symbol?.toUpperCase()}</div>
                    </div>
                    <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatPrice(coin.current_price)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { if (selected) setShowModal(true) }}
            disabled={!selected || loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: selected && !loading ? 'linear-gradient(135deg, #f5a623, #e8941a)' : 'var(--bg-elevated)',
              color: selected && !loading ? '#111' : 'var(--text-muted)',
              border: 'none', cursor: selected && !loading ? 'pointer' : 'not-allowed',
              boxShadow: selected && !loading ? '0 4px 20px rgba(245,166,35,0.35)' : 'none',
            }}
            onMouseEnter={e => { if (selected && !loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Brain size={14} /> Analyze</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm mb-6" style={{ backgroundColor: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--negative)' }}>{error}</div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '64px 24px' }}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Brain size={36} style={{ color: 'var(--accent)', opacity: 0.4 }} />
            <div style={{ position: 'absolute', inset: -10, border: '2px solid rgba(245,166,35,0.2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Analyzing {selected?.name}...</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Calculating RSI · MACD · Bollinger Bands · EMA</div>
        </div>
      )}

      {result && signalConfig && !loading && (
        <div className="flex flex-col gap-4">

          {/* ANA SİNYAL */}
          <div className="rounded-2xl relative overflow-hidden" style={{ backgroundColor: signalConfig.bg, border: `1px solid ${signalConfig.border}`, padding: '32px 36px', boxShadow: `0 0 60px ${signalConfig.glow}` }}>
            <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', backgroundColor: signalConfig.glow, filter: 'blur(60px)', pointerEvents: 'none' }} />
            <div className="flex items-center justify-between flex-wrap gap-8 relative">
              <div className="flex items-center gap-6">
                <div style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: `${signalConfig.color}15`, border: `2px solid ${signalConfig.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${signalConfig.color}25` }}>
                  <SignalIcon size={36} style={{ color: signalConfig.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: `${signalConfig.color}bb`, marginBottom: 4 }}>AI SIGNAL</div>
                  <div style={{ fontSize: 72, fontWeight: 900, color: signalConfig.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{signalConfig.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{result.coin?.name}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(result.coin?.current_price)}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: result.coin?.change_24h >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      {result.coin?.change_24h >= 0 ? '+' : ''}{result.coin?.change_24h?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-10">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 6 }}>CONFIDENCE</div>
                  <div style={{ fontSize: 52, fontWeight: 900, fontFamily: 'monospace', color: signalConfig.color, lineHeight: 1 }}>
                    {result.confidence}<span style={{ fontSize: 28 }}>%</span>
                  </div>
                  <div style={{ marginTop: 8, height: 4, backgroundColor: `${signalConfig.color}20`, borderRadius: 2, width: 100 }}>
                    <div style={{ height: '100%', width: `${result.confidence}%`, backgroundColor: signalConfig.color, borderRadius: 2, transition: 'width 1s ease' }} />
                  </div>
                </div>
                <div style={{ width: 1, height: 80, backgroundColor: `${signalConfig.color}20` }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>SENTIMENT</div>
                  <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', padding: '8px 18px', borderRadius: 30, backgroundColor: `${SENTIMENT_COLOR[result.sentiment]}15`, color: SENTIMENT_COLOR[result.sentiment], border: `1px solid ${SENTIMENT_COLOR[result.sentiment]}40`, textTransform: 'uppercase' }}>
                    {result.sentiment}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KİŞİSEL TAVSİYE */}
          {result.personalized_advice && (
            <div className="rounded-2xl" style={{ backgroundColor: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)', padding: '20px' }}>
              <div className="flex items-center gap-2 mb-3">
                <Brain size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}>Personalized Advice</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.personalized_advice}</p>
              {(result.stop_loss || result.take_profit) && (
                <div className="flex items-center gap-6 mt-4">
                  {result.stop_loss && (
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Stop Loss</div>
                      <div className="text-sm font-bold font-mono" style={{ color: '#e74c3c' }}>{formatPrice(result.stop_loss)}</div>
                    </div>
                  )}
                  {result.take_profit && (
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Take Profit</div>
                      <div className="text-sm font-bold font-mono" style={{ color: '#2ecc71' }}>{formatPrice(result.take_profit)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3 KOLON */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px' }}>
              <div className="flex items-center gap-2 mb-5">
                <Zap size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Technical Indicators</span>
              </div>
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-soft)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>RSI (14)</span>
                  <span className="text-xs font-bold" style={{ color: getSubColor(result.technical_data?.rsi_signal) }}>{result.technical_data?.rsi_signal?.replace(/_/g, ' ')}</span>
                </div>
                <RSIGauge value={result.technical_data?.rsi} />
              </div>
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-soft)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>MACD</span>
                </div>
                <MACDIndicator trend={result.technical_data?.macd_trend} />
              </div>
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-soft)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Bollinger Bands</span>
                  <span className="text-xs font-bold" style={{ color: getSubColor(result.technical_data?.bb_signal) }}>{result.technical_data?.bb_signal?.replace(/_/g, ' ')}</span>
                </div>
                <BBBar position={result.technical_data?.bb_position} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>EMA 20/50</span>
                </div>
                <EMAIndicator trend={result.technical_data?.ema_trend} />
              </div>
              <div className="text-center mt-5" style={{ color: 'var(--text-muted)', fontSize: 11, opacity: 0.6 }}>
                {result.technical_data?.data_points} data points
              </div>
            </div>

            <div className="rounded-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px' }}>
              <div className="flex items-center gap-2 mb-5">
                <Brain size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>AI Summary</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Key Factors</div>
                <div className="flex flex-col gap-2.5">
                  {result.key_factors?.map((factor, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0, fontWeight: 700 }}>→</span>
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Risk Level</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', color: RISK_COLOR[result.risk_level], marginBottom: 8 }}>{result.risk_level}</div>
                <div style={{ height: 6, backgroundColor: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: result.risk_level === 'low' ? '25%' : result.risk_level === 'medium' ? '60%' : '92%', backgroundColor: RISK_COLOR[result.risk_level], transition: 'width 1s ease' }} />
                </div>
              </div>

              <div className="rounded-2xl flex-1" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Target size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Key Levels</span>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Resistance', value: result.resistance_level, color: '#e74c3c' },
                    { label: 'Current', value: result.coin?.current_price, color: 'var(--text-primary)', bold: true },
                    { label: 'Support', value: result.support_level, color: '#2ecc71' },
                  ].map(({ label, value, color, bold }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: bold ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: bold ? 600 : 400 }}>{label}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: bold ? 15 : 13, fontWeight: bold ? 900 : 700, color }}>{value ? formatPrice(value) : '—'}</span>
                      </div>
                      {!bold && <div style={{ height: 1, backgroundColor: 'var(--border-soft)', marginTop: 8 }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}