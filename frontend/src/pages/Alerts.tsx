import { useState, useMemo, useEffect } from 'react'
import { useAlerts } from '../hooks/useAlerts'
import { useMarket } from '../hooks/useMarket'
import { useNavigate } from 'react-router-dom'
import { TrendingDown, TrendingUp, Zap, Bell, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PriceCell from '../components/ui/PriceCell'
import { motion } from 'framer-motion'
import NumberFlow from '@number-flow/react'

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
    <div className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 shadow-2xl rounded-[32px] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#273951]/50">
        <span className="text-[13px] font-bold text-white tracking-wide">{title}</span>
      </div>
      <div className="py-2">{children}</div>
    </div>
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center justify-between px-5 py-2.5 transition-all duration-200 border-l-2 ${
        active 
          ? 'bg-white/5 text-white border-white/40' 
          : 'bg-transparent text-white/50 border-transparent hover:bg-white/[0.03] hover:text-white/80'
      }`}
    >
      <div className="text-[13px] font-medium w-full flex justify-between items-center">{children}</div>
    </button>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
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

  // Determine glow color based on the most dominant or recent alert type
  const dominantAlert = filtered.length > 0 ? filtered[0].type : 'Rapid Movement'
  const glowColor = TYPE_CONFIG[dominantAlert as keyof typeof TYPE_CONFIG]?.color || '#8b5cf6'

  return (
    <div className="relative min-h-screen bg-[#0a0b0d] text-white pt-24 pb-32 px-6 lg:px-12 overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40"><div className="w-[800px] h-[300px] bg-[#533afd] blur-[150px] rounded-[100%] opacity-30 absolute -top-[100px] left-[10%]"></div><div className="w-[600px] h-[250px] bg-[#f96bee] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div></div>

      <div className="max-w-[1280px] mx-auto relative z-20">
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

        {/* ── HEADER ──────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight m-0 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Alerts
            </h1>
            <p className="text-sm text-white/50 mt-2 font-medium">
              {summary.total} active signal{summary.total !== 1 ? 's' : ''} detected
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 text-xs font-bold ${
              isFetching ? 'bg-white/10 border-white/20 text-[#22c55e]' : 'bg-[#16181c]/80 backdrop-blur-md border-[#273951]/50 text-white/60 hover:text-white hover:border-white/30'
            }`}
          >
            <RefreshCw size={14} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* ── TWO-COLUMN LAYOUT ─────────────────────────────── */}
        <div className="grid grid-cols-[240px_1fr] gap-6 items-start">

          {/* ── LEFT SIDEBAR ────────────────────────────────── */}
          <div className="flex flex-col gap-6 sticky top-24">
            {/* Summary */}
            <SidebarCard title="Summary">
              <div className="px-5 pt-1 pb-3">
                {[
                  { label: 'Sharp Drops',    count: summary.drop,  color: '#ef4444', Icon: TrendingDown },
                  { label: 'Strong Pumps',   count: summary.pump,  color: '#22c55e', Icon: TrendingUp },
                  { label: 'Rapid Moves',    count: summary.rapid, color: '#8b5cf6', Icon: Zap },
                ].map(({ label, count, color, Icon }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#273951]/50">
                    <div className="flex items-center gap-2.5">
                      <Icon size={14} color={color} />
                      <span className="text-[13px] text-white/60 font-medium">{label}</span>
                    </div>
                    <span className="font-mono text-sm font-bold" style={{ color }}>{count}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3">
                  <span className="text-[13px] text-white/50 font-semibold">Total</span>
                  <span className="font-mono text-[15px] font-black text-white">{summary.total}</span>
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
                  <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    filter === f.key ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
                  }`}>
                    {f.count}
                  </span>
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
              <div className="flex flex-col gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-[1rem] bg-[#16181c]/80 backdrop-blur-md border border-[#273951]/50" style={{ opacity: 1 - i * 0.1 }} />
                ))}
              </div>
            )}

            {/* Error */}
            {isError && (
              <div className="px-5 py-4 rounded-[1rem] bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                Failed to load alerts. Please try refreshing.
              </div>
            )}

            {/* Empty state */}
            {data && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 rounded-[32px] shadow-2xl">
                <Bell size={36} className="text-white/20 mb-4" />
                <div className="text-lg font-bold text-white mb-1">No alerts here</div>
                <div className="text-sm text-white/50">No signals matched this filter</div>
              </div>
            )}

            {/* Alert table */}
            {filtered.length > 0 && (
              <div className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 rounded-[32px] overflow-hidden shadow-2xl">
                {/* Table header */}
                <div className="grid grid-cols-[48px_1fr_110px_110px_80px] px-5 py-3 gap-2 border-b border-[#273951]/50 bg-white/[0.02]">
                  {['', 'Coin', 'Price', '% Change', 'Type'].map((h, i) => (
                    <div key={i} className={`text-[11px] font-bold uppercase tracking-wider text-white/40 ${i >= 2 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </div>
                  ))}
                </div>

                {/* Rows with Framer Motion */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
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
                      <motion.div
                        variants={itemVariants}
                        key={`${alert.symbol}-${alert.type}-${idx}`}
                        onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                        className="grid grid-cols-[48px_1fr_110px_110px_80px] items-center gap-2 px-5 py-3.5 border-b border-[#273951]/50 transition-colors duration-200 hover:bg-white/[0.04]"
                        style={{
                          borderLeft: `3px solid ${config.dot}`,
                          cursor: coin.slug ? 'pointer' : 'default',
                        }}
                      >
                        {/* Logo */}
                        <div>
                          {coin.image_url
                            ? <img src={coin.image_url} alt={alert.symbol} className="w-8 h-8 rounded-full border border-[#273951]/50" />
                            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-mono" style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}>
                                {alert.symbol?.slice(0, 2)}
                              </div>
                          }
                        </div>

                        {/* Coin name + message */}
                        <div className="min-w-0 pr-4">
                          <div className="font-mono text-[14px] font-bold text-white">
                            {alert.symbol?.toUpperCase()}
                          </div>
                          <div className="text-[12px] text-white/50 mt-0.5 truncate">
                            {alert.message}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="font-mono text-right text-[13px] text-white/80 font-bold">
                          <PriceCell price={price} />
                        </div>

                        {/* % Change */}
                        <div className="font-mono text-right text-[14px] font-black" style={{ color: pctColor }}>
                          {pct > 0 ? '+' : ''}
                          <NumberFlow value={Number(pct) || 0} format={{ maximumFractionDigits: 2, minimumFractionDigits: 2 }} />%
                        </div>

                        {/* Badge */}
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider uppercase" style={{
                            background: config.bg, color: config.color, border: `1px solid ${config.border}`
                          }}>
                            <Icon size={10} />
                            {config.label}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

