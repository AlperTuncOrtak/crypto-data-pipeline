import { useState, useMemo, useEffect } from 'react'
import { useAlerts } from '../hooks/useAlerts'
import { useMarket } from '../hooks/useMarket'
import { useNavigate } from 'react-router-dom'
import { TrendingDown, TrendingUp, Zap, Bell, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PriceCell from '../components/ui/PriceCell'

const TYPE_CONFIG = {
  'Sharp Drop': {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.20)',
    dot: '#ef4444',
    icon: TrendingDown,
    filter: 'drop',
    labelKey: 'badge_drop',
    label: 'Drop',
  },
  'Strong Increase': {
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.20)',
    dot: '#22c55e',
    icon: TrendingUp,
    filter: 'pump',
    labelKey: 'badge_pump',
    label: 'Pump',
  },
  'Rapid Movement': {
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.20)',
    dot: '#8b5cf6',
    icon: Zap,
    filter: 'rapid',
    labelKey: 'badge_rapid',
    label: 'Rapid',
  },
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-soft)',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ padding: '8px 0' }}>{children}</div>
    </div>
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 20px', border: 'none',
        background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        cursor: 'pointer', transition: 'all 120ms',
        borderLeft: active ? '2px solid var(--text-primary)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

export default function Alerts() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch, isFetching } = useAlerts()
  const { data: marketData } = useMarket(500)
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('severity')
  const [prevCount, setPrevCount] = useState(0)

  // Sound ping for new alerts
  useEffect(() => {
    if (data && data.length > prevCount && prevCount !== 0) {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          const ctx = new AudioCtx()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(880, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.3)
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.6)
        }
      } catch (e) {}
    }
    if (data) setPrevCount(data.length)
  }, [data, prevCount])

  const coinMap = useMemo(() => {
    if (!marketData) return {} as Record<string, any>
    const map: Record<string, any> = {}
    marketData.forEach((c: any) => {
      map[c.symbol?.toUpperCase()] = { image_url: c.image_url, slug: c.slug, current_price: c.current_price }
    })
    return map
  }, [marketData])

  const summary = useMemo(() => {
    if (!data) return { drop: 0, pump: 0, rapid: 0, total: 0 }
    return {
      total: data.length,
      drop:  data.filter((a: any) => a.type === 'Sharp Drop').length,
      pump:  data.filter((a: any) => a.type === 'Strong Increase').length,
      rapid: data.filter((a: any) => a.type === 'Rapid Movement').length,
    }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    let rows = filter === 'all' ? data : data.filter((a: any) => TYPE_CONFIG[a.type as keyof typeof TYPE_CONFIG]?.filter === filter)
    if (sortBy === 'pct') rows = [...rows].sort((a: any, b: any) => Math.abs(b.change_pct || 0) - Math.abs(a.change_pct || 0))
    return rows
  }, [data, filter, sortBy])

  return (
    <div style={{ color: 'var(--text-primary)', fontFamily: "'Inter', -apple-system, sans-serif", maxWidth: 1280, margin: '0 auto', padding: '40px 32px' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.05em', margin: 0 }}>
            Alerts
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '6px 0 0', fontWeight: 400 }}>
            {summary.total} active signal{summary.total !== 1 ? 's' : ''} detected
          </p>
        </div>
        <button
          onClick={() => refetch()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-surface)',
            color: isFetching ? '#22c55e' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
          }}
        >
          <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── TWO-COLUMN LAYOUT ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT SIDEBAR ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary */}
          <SidebarCard title="Summary">
            <div style={{ padding: '4px 20px 12px' }}>
              {[
                { label: 'Sharp Drops',    count: summary.drop,  color: '#ef4444', Icon: TrendingDown },
                { label: 'Strong Pumps',   count: summary.pump,  color: '#22c55e', Icon: TrendingUp },
                { label: 'Rapid Moves',    count: summary.rapid, color: '#8b5cf6', Icon: Zap },
              ].map(({ label, count, color, Icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon size={13} color={color} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color }}>{count}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total</span>
                <span className="font-mono" style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{summary.total}</span>
              </div>
            </div>
          </SidebarCard>

          {/* Filter */}
          <SidebarCard title="Filter">
            {[
              { key: 'all',   label: 'All Alerts',    count: summary.total },
              { key: 'drop',  label: 'Sharp Drops',   count: summary.drop  },
              { key: 'pump',  label: 'Strong Pumps',  count: summary.pump  },
              { key: 'rapid', label: 'Rapid Moves',   count: summary.rapid },
            ].map(f => (
              <FilterBtn key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
                <span>{f.label}</span>
                <span className="font-mono" style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 4,
                  background: filter === f.key ? 'rgba(255,255,255,0.10)' : 'var(--bg-elevated)',
                  color: filter === f.key ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>{f.count}</span>
              </FilterBtn>
            ))}
          </SidebarCard>

          {/* Sort */}
          <SidebarCard title="Sort By">
            {[
              { key: 'severity', label: 'Severity' },
              { key: 'pct',      label: '% Change' },
            ].map(s => (
              <FilterBtn key={s.key} active={sortBy === s.key} onClick={() => setSortBy(s.key)}>
                {s.label}
              </FilterBtn>
            ))}
          </SidebarCard>
        </div>

        {/* ── MAIN FEED ───────────────────────────────────── */}
        <div>
          {/* Loading skeleton */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ height: 64, borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', opacity: 1 - i * 0.1 }} />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#ef4444', fontSize: 13 }}>
              Failed to load alerts. Please try refreshing.
            </div>
          )}

          {/* Empty state */}
          {data && filtered.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '80px 24px', textAlign: 'center',
              background: 'var(--bg-card)', border: '1px solid var(--border-soft)', borderRadius: 16,
            }}>
              <Bell size={32} color="var(--text-muted)" style={{ marginBottom: 14 }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No alerts here</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No signals matched this filter</div>
            </div>
          )}

          {/* Alert table */}
          {filtered.length > 0 && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-soft)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 110px 110px 80px',
                padding: '10px 20px', gap: 8,
                borderBottom: '1px solid var(--border-soft)',
                background: 'rgba(255,255,255,0.01)',
              }}>
                {['', 'Coin', 'Price', '% Change', 'Type'].map((h, i) => (
                  <div key={i} style={{
                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--text-muted)',
                    textAlign: i >= 2 ? 'right' : 'left',
                  }}>{h}</div>
                ))}
              </div>

              {/* Rows */}
              {filtered.map((alert: any, idx: number) => {
                const config = TYPE_CONFIG[alert.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG['Rapid Movement']
                const Icon = config.icon
                const coin = coinMap[alert.symbol?.toUpperCase()] || {}
                const pct = alert.change_pct ?? 0
                const price = alert.current_price || coin.current_price
                const isDown = alert.type === 'Sharp Drop'
                const isUp = alert.type === 'Strong Increase'
                const pctColor = isDown ? '#ef4444' : isUp ? '#22c55e' : '#8b5cf6'

                return (
                  <div
                    key={`${alert.symbol}-${alert.type}-${idx}`}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '48px 1fr 110px 110px 80px',
                      alignItems: 'center', gap: 8,
                      padding: '13px 20px',
                      borderBottom: '1px solid var(--border-soft)',
                      borderLeft: `3px solid ${config.dot}`,
                      cursor: coin.slug ? 'pointer' : 'default',
                      transition: 'background 100ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Logo */}
                    <div>
                      {coin.image_url
                        ? <img src={coin.image_url} alt={alert.symbol} style={{ width: 30, height: 30, borderRadius: '50%' }} />
                        : <div style={{ width: 30, height: 30, borderRadius: '50%', background: config.bg, border: `1px solid ${config.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: config.color }}>
                            {alert.symbol?.slice(0, 2)}
                          </div>
                      }
                    </div>

                    {/* Coin name + message */}
                    <div style={{ minWidth: 0 }}>
                      <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {alert.symbol?.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {alert.message}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="font-mono" style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <PriceCell price={price} />
                    </div>

                    {/* % Change */}
                    <div className="font-mono" style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: pctColor }}>
                      {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
                    </div>

                    {/* Badge */}
                    <div style={{ textAlign: 'right' }}>
                      <span className="font-mono" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 700, padding: '3px 8px',
                        borderRadius: 5,
                        background: config.bg, color: config.color,
                        border: `1px solid ${config.border}`,
                        letterSpacing: '0.04em',
                      }}>
                        <Icon size={9} />
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
    </div>
  )
}