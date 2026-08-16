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
  const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  if (hours <= 24) return time
  return `${d.getMonth()+1}/${d.getDate()} ${time}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-[var(--bg-base)]/95 backdrop-blur-xl border border-[var(--border-base)] rounded-3xl p-4 min-w-[180px] shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
      <div className="text-[11px] text-[var(--text-muted)] mb-3 font-semibold uppercase tracking-wider">
        {new Date(label).toLocaleString()}
      </div>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.stroke }} />
            <span className="text-xs font-bold font-mono text-gray-200">{entry.dataKey}</span>
          </div>
          <span className={`text-xs font-bold font-mono ${Number(entry.value) >= 0 ? 'text-[#14F195]' : 'text-red-400'}`}>
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
    <div className="relative w-[280px]">
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-3xl bg-[#111113] border transition-colors duration-200 ${open ? 'border-[var(--accent)]' : 'border-[var(--border-base)]'}`}>
        <Search size={14} className="text-[var(--text-muted)] shrink-0" />
        <input
          type="text"
          placeholder={t("analysis.search_placeholder")}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="bg-transparent outline-none text-sm w-full text-[var(--text-main)] placeholder-white/30"
          style={{ caretColor: 'var(--accent)' }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 rounded-3xl overflow-hidden z-50 bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-[var(--border-base)] shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
          {filtered.map(coin => {
            const isSelected = selected.includes(coin.symbol)
            return (
              <div
                key={coin.symbol}
                onMouseDown={(e) => { 
                  e.preventDefault(); 
                  if (!isSelected && selected.length < 5) { onAdd(coin.symbol); setSearch(''); setOpen(false) } 
                }}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--border-subtle)]'}`}
              >
                {coin.image_url
                  ? <img src={coin.image_url} className="w-6 h-6 rounded-full" />
                  : <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">{coin.symbol?.slice(0,1)}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-main)]">{coin.name}</div>
                  <div className="text-xs font-mono text-[var(--text-muted)]">{coin.symbol?.toUpperCase()}</div>
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)] font-bold">{formatPrice(coin.current_price)}</div>
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
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] pt-24 pb-32 px-6 lg:px-12 overflow-x-hidden font-sans">
      {/* BACKGROUND GLOWS */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40">
        <div className="w-[800px] h-[300px] bg-[var(--accent)] blur-[150px] rounded-[100%] opacity-20 absolute -top-[100px] left-[10%]"></div>
        <div className="w-[600px] h-[250px] bg-[#059669] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div>
      </div>

      <div className="max-w-[1100px] mx-auto relative z-20">

      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <GitCompare size={22} className="text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">{t("analysis.title")}</h1>
            <p className="text-sm mt-1 text-[var(--text-muted)] font-medium">
              {t("analysis.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* COIN SEÇİCİ */}
      <div className="rounded-[32px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-2xl p-5 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <CoinSearchDropdown allCoins={allCoins || []} selected={selected} onAdd={addCoin} />
          {selected.map((sym, i) => {
            const coin = coinData[sym]
            return (
              <div key={sym} className="flex items-center gap-2 px-3 py-2 rounded-3xl" style={{
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
        <div className="flex flex-col items-center justify-center rounded-[32px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-2xl py-16 px-6 text-center">
          <GitCompare size={40} className="text-[var(--text-muted)] opacity-50 mb-4" />
          <div className="text-sm font-semibold text-gray-300">
            {selected.length === 0 ? t("analysis.empty_state_1") : t("analysis.empty_state_2")}
          </div>
          <div className="text-xs mt-1 text-[var(--text-muted)]">{t("analysis.empty_state_desc")}</div>
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
                  <div key={row.symbol} className="rounded-[32px] bg-[var(--bg-base)]/80 backdrop-blur-xl border shadow-xl p-5 relative overflow-hidden" style={{ borderColor: `${color}30` }}>
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
          <div className="rounded-[32px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-2xl p-6">
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
                <div className="flex items-center gap-1 rounded-3xl p-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={t => formatTimeAxis(t, hours)}
                    stroke="rgba(255,255,255,0.05)"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
                    stroke="rgba(255,255,255,0.05)"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    width={65}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
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
    </div>
  )
}
