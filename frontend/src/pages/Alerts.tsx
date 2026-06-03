import { useState, useMemo, useEffect } from 'react'
import { useAlerts } from '../hooks/useAlerts'
import { useMarket } from '../hooks/useMarket'
import { useNavigate } from 'react-router-dom'
import { TrendingDown, TrendingUp, Zap, Bell, RefreshCw } from 'lucide-react'

const TYPE_CONFIG = {
  'Sharp Drop': {
    color: 'var(--negative)',
    border: '#e74c3c',
    icon: TrendingDown,
    filter: 'drop',
    label: 'DROP',
  },
  'Strong Increase': {
    color: 'var(--positive)',
    border: '#2ecc71',
    icon: TrendingUp,
    filter: 'pump',
    label: 'PUMP',
  },
  'Rapid Movement': {
    color: 'var(--accent)',
    border: '#00F0FF',
    icon: Zap,
    filter: 'rapid',
    label: 'RAPID',
  },
}

function formatPrice(n) {
  const num = Number(n)
  if (isNaN(num) || num === 0) return '—'
  if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (num >= 1)    return `$${num.toFixed(2)}`
  if (num >= 0.01) return `$${num.toFixed(4)}`
  if (num >= 0.0001) return `$${num.toFixed(6)}`
  return `<$0.000001`
}

export default function Alerts() {
  const { data, isLoading, isError, refetch, isFetching } = useAlerts()
  const { data: marketData } = useMarket(500)
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('severity')
  const [prevCount, setPrevCount] = useState(0)

  // Custom Synth Audio Ping for new alerts
  useEffect(() => {
    if (data && data.length > prevCount && prevCount !== 0) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        }
      } catch(e) {}
    }
    if (data) setPrevCount(data.length);
  }, [data, prevCount]);

  const coinMap = useMemo(() => {
    if (!marketData) return {}
    const map = {}
    marketData.forEach(c => {
      map[c.symbol?.toUpperCase()] = {
        image_url: c.image_url,
        slug: c.slug,
        current_price: c.current_price,
      }
    })
    return map
  }, [marketData])

  const summary = useMemo(() => {
    if (!data) return { drop: 0, pump: 0, rapid: 0, total: 0 }
    return {
      total: data.length,
      drop:  data.filter(a => a.type === 'Sharp Drop').length,
      pump:  data.filter(a => a.type === 'Strong Increase').length,
      rapid: data.filter(a => a.type === 'Rapid Movement').length,
    }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    let rows = filter === 'all' ? data : data.filter(a => TYPE_CONFIG[a.type]?.filter === filter)
    if (sortBy === 'pct') {
      rows = [...rows].sort((a, b) => Math.abs(b.change_pct || 0) - Math.abs(a.change_pct || 0))
    }
    return rows
  }, [data, filter, sortBy])

  const FILTERS = [
    { key: 'all',   label: 'All Alerts', count: summary.total },
    { key: 'drop',  label: 'Sharp Drop', count: summary.drop  },
    { key: 'pump',  label: 'Strong Pump', count: summary.pump  },
    { key: 'rapid', label: 'Rapid Move', count: summary.rapid },
  ]

  return (
    <div style={{ color: 'var(--text-primary)' }}>

      {/* HEADER */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {summary.total} active alerts — rule-based, auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: isFetching ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* SIDEBAR */}
        <div className="flex flex-col gap-4">

          {/* SUMMARY */}
          <div className="rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backgroundImage: 'radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>
              Summary
            </div>
            {[
              { label: 'Sharp Drop',  count: summary.drop,  color: 'var(--negative)', Icon: TrendingDown },
              { label: 'Strong Pump', count: summary.pump,  color: 'var(--positive)', Icon: TrendingUp   },
              { label: 'Rapid Move',  count: summary.rapid, color: 'var(--accent)',   Icon: Zap          },
            ].map(({ label, count, color, Icon }) => (
              <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <div className="flex items-center gap-2">
                  <Icon size={13} style={{ color }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color }}>{count}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total</span>
              <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{summary.total}</span>
            </div>
          </div>

          {/* FILTER */}
          <div className="rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backgroundImage: 'radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>
              Filter
            </div>
            <div className="flex flex-col gap-1">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all text-left w-full"
                  style={{
                    backgroundColor: filter === f.key ? 'rgba(0,240,255,0.1)' : 'transparent',
                    border: filter === f.key ? '1px solid rgba(245,166,35,0.25)' : '1px solid transparent',
                    color: filter === f.key ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: filter === f.key ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (filter !== f.key) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { if (filter !== f.key) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <span>{f.label}</span>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: filter === f.key ? 'rgba(0,240,255,0.15)' : 'var(--bg-elevated)',
                      color: filter === f.key ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SORT */}
          <div className="rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backgroundImage: 'radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>
              Sort By
            </div>
            <div className="flex flex-col gap-1">
              {[
                { key: 'severity', label: 'Severity' },
                { key: 'pct',      label: '% Change' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className="px-3 py-2.5 rounded-lg text-sm text-left w-full transition-all"
                  style={{
                    backgroundColor: sortBy === s.key ? 'rgba(0,240,255,0.1)' : 'transparent',
                    border: sortBy === s.key ? '1px solid rgba(245,166,35,0.25)' : '1px solid transparent',
                    color: sortBy === s.key ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: sortBy === s.key ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (sortBy !== s.key) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { if (sortBy !== s.key) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FEED */}
        <div className="lg:col-span-3">

          {isLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl animate-pulse" style={{ height: 60, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
              ))}
            </div>
          )}

          {isError && (
            <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--negative)' }}>
              Alerts yüklenemedi.
            </div>
          )}

          {data && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '64px 24px' }}>
              <Bell size={28} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Bu kategoride alert yok</div>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}>

              {/* HEADER */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr 90px 100px 72px',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                }}
              >
                {['', 'Coin', 'Price', 'Change', 'Type'].map((h, i) => (
                  <div
                    key={i}
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: 'var(--text-muted)',
                      letterSpacing: '0.08em',
                      textAlign: i >= 2 ? 'right' : 'left',
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* ROWS */}
              {filtered.map((alert, idx) => {
                const config = TYPE_CONFIG[alert.type] || TYPE_CONFIG['Rapid Movement']
                const Icon = config.icon
                const coin = coinMap[alert.symbol?.toUpperCase()] || {}
                const isDown = alert.type === 'Sharp Drop'
                const isUp   = alert.type === 'Strong Increase'
                const pct    = alert.change_pct ?? 0
                const price  = alert.current_price || coin.current_price

                return (
                  <div
                    key={`${alert.symbol}-${alert.type}-${idx}`}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '44px 1fr 90px 100px 72px',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderTop: idx === 0 ? 'none' : '1px solid var(--border-soft)',
                      borderLeft: `3px solid ${config.border}`,
                      cursor: coin.slug ? 'pointer' : 'default',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                      e.currentTarget.style.boxShadow = `inset 0 0 32px ${config.color}15`;
                      e.currentTarget.style.transform = 'scale(1.005)';
                      e.currentTarget.style.zIndex = '10';
                      e.currentTarget.style.position = 'relative';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.zIndex = '1';
                    }}
                  >
                    {/* LOGO */}
                    <div>
                      {coin.image_url ? (
                        <img src={coin.image_url} alt={alert.symbol} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                      ) : (
                        <div
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            backgroundColor: 'var(--bg-elevated)',
                            color: config.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                          }}
                        >
                          {alert.symbol?.slice(0, 2)}
                        </div>
                      )}
                    </div>

                    {/* COIN + MESAJ */}
                    <div style={{ minWidth: 0, paddingRight: 12 }}>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)' }}>
                        {alert.symbol?.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {alert.message}
                      </div>
                    </div>

                    {/* FİYAT */}
                    <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatPrice(price)}
                    </div>

                    {/* % DEĞİŞİM */}
                    <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: isDown ? 'var(--negative)' : isUp ? 'var(--positive)' : 'var(--accent)' }}>
                      {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
                    </div>

                    {/* BADGE */}
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                          padding: '3px 8px', borderRadius: 4,
                          backgroundColor: `${config.border}18`,
                          color: config.color,
                          border: `1px solid ${config.border}33`,
                          fontFamily: 'monospace',
                        }}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}