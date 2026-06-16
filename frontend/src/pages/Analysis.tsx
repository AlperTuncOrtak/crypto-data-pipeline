import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useMarket } from '../hooks/useMarket'
import { useMultiCoinHistory, useMultiCoinPerformance } from '../hooks/useAnalysis'
import { GitCompare, X, TrendingUp, TrendingDown, Search } from 'lucide-react'

const CHART_COLORS = ['#2ecc71', '#3498db', 'var(--accent)', '#e91e8c', '#9b59b6']

const TIME_RANGES = [
  { label: '1H',  hours: 1   },
  { label: '24H', hours: 24  },
  { label: '7D',  hours: 168 },
  { label: '30D', hours: 720 },
]

function formatPrice(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (num >= 1)    return `$${num.toFixed(2)}`
  if (num >= 0.01) return `$${num.toFixed(4)}`
  return `$${num.toFixed(6)}`
}

function buildChartData(historyRows, symbols) {
  if (!historyRows || historyRows.length === 0) return []
  const grouped = {}
  const firstPrices = {}
  for (const row of historyRows) {
    const sym = row.symbol
    if (!grouped[sym]) { grouped[sym] = []; firstPrices[sym] = Number(row.current_price) }
    grouped[sym].push({ time: row.time, price: Number(row.current_price) })
  }
  for (const sym of Object.keys(grouped)) {
    const first = firstPrices[sym]
    grouped[sym] = grouped[sym].map(p => ({ ...p, normalized: first ? ((p.price - first) / first) * 100 : 0 }))
  }
  const allTimes = new Set()
  for (const sym of Object.keys(grouped)) grouped[sym].forEach(p => allTimes.add(p.time))
  return [...allTimes].sort().map(time => {
    const row = { time }
    for (const sym of symbols) {
      const point = grouped[sym]?.find(p => p.time === time)
      if (point) row[sym] = Number(point.normalized.toFixed(2))
    }
    return row
  })
}

function formatTimeAxis(iso, hours) {
  if (!iso) return ''
  const d = new Date(iso)
  if (hours <= 24) return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:00`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '12px 16px', minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
        {new Date(label).toLocaleString()}
      </div>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4" style={{ marginBottom: 4 }}>
          <div className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.stroke, display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{entry.dataKey}</span>
          </div>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: Number(entry.value) >= 0 ? '#2ecc71' : '#e74c3c', fontWeight: 700 }}>
            {Number(entry.value) >= 0 ? '+' : ''}{Number(entry.value).toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}

function CoinSearchDropdown({ allCoins, selected, onAdd }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = search.trim()
    ? allCoins.filter(c =>
        c.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : []

  return (
    <div className="relative" style={{ width: 280 }}>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{
        backgroundColor: 'var(--bg-elevated)',
        border: `1px solid ${open ? 'rgba(245,166,35,0.4)' : 'var(--border)'}`,
        transition: 'border-color 0.2s',
      }}>
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder={t("analysis.search_placeholder")}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="bg-transparent outline-none text-sm w-full"
          style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-50" style={{
          backgroundColor: '#1a1a1a', border: '1px solid var(--border)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          {filtered.map(coin => {
            const isSelected = selected.includes(coin.symbol)
            return (
              <div
                key={coin.symbol}
                onClick={() => { if (!isSelected && selected.length < 5) { onAdd(coin.symbol); setSearch(''); setOpen(false) } }}
                className="flex items-center gap-3 px-4 py-3 transition-all"
                style={{ opacity: isSelected ? 0.4 : 1, cursor: isSelected ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {coin.image_url
                  ? <img src={coin.image_url} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                  : <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{coin.symbol?.slice(0,1)}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{coin.name}</div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{coin.symbol?.toUpperCase()}</div>
                </div>
                <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatPrice(coin.current_price)}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Analysis() {
  const { t } = useTranslation()
  const { data: allCoins } = useMarket(2000)
  const [selected, setSelected] = useState([])
  const [activeRange, setActiveRange] = useState(1)  // index into TIME_RANGES
  const hours = TIME_RANGES[activeRange].hours

  const history     = useMultiCoinHistory(selected, hours)
  const performance = useMultiCoinPerformance(selected, hours)

  const chartData = useMemo(() => buildChartData(history.data, selected), [history.data, selected])

  function addCoin(symbol) {
    if (!selected.includes(symbol) && selected.length < 5) setSelected(prev => [...prev, symbol])
  }
  function removeCoin(symbol) {
    setSelected(prev => prev.filter(s => s !== symbol))
  }

  const coinData = useMemo(() => {
    if (!allCoins) return {}
    return Object.fromEntries(allCoins.map(c => [c.symbol, c]))
  }, [allCoins])

  return (
    <div style={{ color: 'var(--text-primary)', maxWidth: 1100, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <div className="flex items-center gap-3 mb-2">
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,158,11,0.05))',
            border: '1px solid rgba(245,166,35,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GitCompare size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("analysis.title")}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {t("analysis.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* COIN SEÇİCİ */}
      <div className="rounded-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px', marginBottom: 24 }}>
        <div className="flex items-center gap-3 flex-wrap">
          <CoinSearchDropdown allCoins={allCoins || []} selected={selected} onAdd={addCoin} />
          {selected.map((sym, i) => {
            const coin = coinData[sym]
            return (
              <div key={sym} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{
                backgroundColor: `${CHART_COLORS[i]}15`,
                border: `1px solid ${CHART_COLORS[i]}40`,
              }}>
                {coin?.image_url && <img src={coin.image_url} style={{ width: 20, height: 20, borderRadius: '50%' }} />}
                <span className="text-sm font-bold font-mono" style={{ color: CHART_COLORS[i] }}>{sym}</span>
                <button onClick={() => removeCoin(sym)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CHART_COLORS[i], display: 'flex', padding: 0, opacity: 0.7 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
          {selected.length === 0 && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t("analysis.select_prompt")}</span>}
          {selected.length === 5 && <span className="text-xs" style={{ color: 'var(--accent)' }}>{t("analysis.max_coins")}</span>}
        </div>
      </div>

      {/* EMPTY STATE */}
      {selected.length < 2 && (
        <div className="flex flex-col items-center justify-center rounded-2xl" style={{
          backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
          padding: '64px 24px', textAlign: 'center',
        }}>
          <GitCompare size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
          <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {selected.length === 0 ? t("analysis.empty_state_1") : t("analysis.empty_state_2")}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t("analysis.empty_state_desc")}</div>
        </div>
      )}

      {selected.length >= 2 && (
        <div className="flex flex-col gap-4">

          {/* PERFORMANCE CARDS */}
          {performance.data && performance.data.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(performance.data.length, 5)}, 1fr)`, gap: 12 }}>
              {performance.data.map((row, i) => {
                const ret  = Number(row.total_return_pct)
                const isUp = ret >= 0
                const coin = coinData[row.symbol]
                const colorIdx = selected.indexOf(row.symbol)
                const color = CHART_COLORS[colorIdx >= 0 ? colorIdx : i]
                return (
                  <div key={row.symbol} className="rounded-2xl" style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: `1px solid ${color}30`,
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* bg glow */}
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', backgroundColor: `${color}10`, filter: 'blur(20px)', pointerEvents: 'none' }} />

                    <div className="flex items-center gap-2 mb-4">
                      {coin?.image_url && <img src={coin.image_url} style={{ width: 28, height: 28, borderRadius: '50%' }} />}
                      <div>
                        <div className="font-bold font-mono text-sm" style={{ color }}>{row.symbol}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{coin?.name}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {TIME_RANGES[activeRange].label} {t("analysis.return")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isUp ? <TrendingUp size={16} style={{ color: '#2ecc71' }} /> : <TrendingDown size={16} style={{ color: '#e74c3c' }} />}
                      <span style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: isUp ? '#2ecc71' : '#e74c3c' }}>
                        {isUp ? '+' : ''}{ret.toFixed(2)}%
                      </span>
                    </div>

                    <div style={{ height: 1, backgroundColor: 'var(--border-soft)', margin: '12px 0' }} />

                    <div className="flex justify-between">
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t("analysis.start")}</div>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formatPrice(row.start_price)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t("analysis.current")}</div>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 700 }}>{formatPrice(row.latest_price)}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* CHART */}
          <div className="rounded-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '24px' }}>
            {/* Chart header */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <div className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{t("analysis.chart_title")}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6, marginTop: 2 }}>{t("analysis.chart_subtitle")}</div>
              </div>
              <div className="flex items-center gap-3">
                {/* Coin legend */}
                <div className="flex items-center gap-3">
                  {selected.map((sym, i) => (
                    <div key={sym} className="flex items-center gap-1.5">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: CHART_COLORS[i], display: 'inline-block' }} />
                      <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: CHART_COLORS[i] }}>{sym}</span>
                    </div>
                  ))}
                </div>

                {/* Time range */}
                <div className="flex items-center gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  {TIME_RANGES.map((range, idx) => (
                    <button
                      key={range.label}
                      onClick={() => setActiveRange(idx)}
                      style={{
                        padding: '4px 12px', borderRadius: 8, border: 'none',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        backgroundColor: activeRange === idx ? 'var(--accent)' : 'transparent',
                        color: activeRange === idx ? '#111' : 'var(--text-muted)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {history.isLoading && (
              <div className="flex items-center justify-center" style={{ height: 400 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t("analysis.loading")}</div>
              </div>
            )}

            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={t => formatTimeAxis(t, hours)}
                    stroke="var(--border)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
                    stroke="var(--border)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    width={65}
                  />
                  <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
                  <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={<CustomTooltip />}
                  />
                  {selected.map((sym, i) => (
                    <Line
                      key={sym}
                      type="monotone"
                      dataKey={sym}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: CHART_COLORS[i] }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}

            {chartData.length === 0 && !history.isLoading && (
              <div className="flex items-center justify-center" style={{ height: 400 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t("analysis.no_data")}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}