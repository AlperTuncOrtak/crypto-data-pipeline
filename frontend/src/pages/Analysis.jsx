// ============================================================
// pages/Analysis.jsx
// ============================================================
// Multi-coin karsilastirma sayfasi:
//
//  1. CoinSelector ile 2-5 coin sec
//  2. Performance tablosu: her coin'in toplam getirisi (%)
//  3. Recharts ile zaman serisi chart - normalize edilmis (% degisim)
//  4. Tooltip: tum secili coinlerin o andaki degerini gosterir (CMC stili)
//
// NORMALIZE NEDEN: Coinlerin fiyat aralıklari cok farkli olabilir
// (BTC $78000, JST $0.08). Mutlak fiyat gostersek JST duz cizgi
// gibi gorunur. Bu yuzden her coin'i baslangic noktasina gore
// yuzde degisime cevirip birlikte gosteriyoruz.
//
// TODO (sonra): "Mouse hangi cizgi uzerinde" algilama deneyimi.
// Recharts native olarak bunu vermiyor, manuel Y koordinat hesabi
// denedik ama plot area boyutunu disardan dogru tahmin etmek zor
// (ResponsiveContainer'in ic state'ine erisim yok). Coin Detail
// sayfasinda zaten benzer bir chart olacak, orada daha saglam bir
// yaklasim deneriz - ya kendi SVG line chart'imizi yazariz, ya da
// echarts/chartjs gibi alternatif kutuphaneye bakariz.
// ============================================================

import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'

import { useMarket } from '../hooks/useMarket'
import {
  useMultiCoinHistory,
  useMultiCoinPerformance,
} from '../hooks/useAnalysis'
import CoinSelector from '../components/analysis/CoinSelector'


const CHART_COLORS = [
  '#34d399',  // emerald-400
  '#60a5fa',  // blue-400
  '#fbbf24',  // amber-400
  '#f472b6',  // pink-400
  '#a78bfa',  // violet-400
]


// -----------------------
// FORMATTERS
// -----------------------
function formatPrice(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  return `$${num.toFixed(6)}`
}

function formatPct(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
}


// -----------------------
// CHART VERISI
// -----------------------
function buildChartData(historyRows, symbols) {
  if (!historyRows || historyRows.length === 0) return []

  const grouped = {}
  const firstPrices = {}

  for (const row of historyRows) {
    const sym = row.symbol
    if (!grouped[sym]) {
      grouped[sym] = []
      firstPrices[sym] = Number(row.current_price)
    }
    grouped[sym].push({
      time: row.collected_at,
      price: Number(row.current_price),
    })
  }

  for (const sym of Object.keys(grouped)) {
    const first = firstPrices[sym]
    grouped[sym] = grouped[sym].map((p) => ({
      ...p,
      normalized: first ? ((p.price - first) / first) * 100 : 0,
    }))
  }

  const allTimes = new Set()
  for (const sym of Object.keys(grouped)) {
    grouped[sym].forEach((p) => allTimes.add(p.time))
  }
  const sortedTimes = [...allTimes].sort()

  return sortedTimes.map((time) => {
    const row = { time }
    for (const sym of symbols) {
      const point = grouped[sym]?.find((p) => p.time === time)
      if (point) row[sym] = Number(point.normalized.toFixed(2))
    }
    return row
  })
}


// -----------------------
// AXIS / TOOLTIP FORMAT
// -----------------------
function formatTimeAxis(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatTooltipLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString()
}


// -----------------------
// CUSTOM TOOLTIP
// -----------------------
// Tum secili coinlerin o andaki degerini birden gosterir.
// Recharts'in default tooltip'i sadece en yakin tek bir noktayi
// gosteriyor, biz CMC stili istiyoruz.
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-3 min-w-[180px]">
      <div className="text-xs text-slate-400 mb-2">
        {formatTooltipLabel(label)}
      </div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.stroke || entry.color }}
              />
              <span className="font-mono font-semibold text-slate-200">
                {entry.dataKey}
              </span>
            </div>
            <span
              className="font-mono"
              style={{ color: entry.stroke || entry.color }}
            >
              {Number(entry.value) >= 0 ? '+' : ''}
              {Number(entry.value).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


// -----------------------
// MAIN PAGE
// -----------------------
export default function Analysis() {
  const { data: allCoins } = useMarket(100)
  const [selected, setSelected] = useState([])
  const history = useMultiCoinHistory(selected)
  const performance = useMultiCoinPerformance(selected)

  const chartData = useMemo(
    () => buildChartData(history.data, selected),
    [history.data, selected]
  )


  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100">Analysis</h1>
        <p className="text-slate-400 mt-1">
          Compare price performance across multiple coins
        </p>
      </div>


      {/* COIN SELECTOR */}
      <div className="mb-8">
        <CoinSelector
          allCoins={allCoins || []}
          selected={selected}
          onChange={setSelected}
          maxSelection={5}
        />
      </div>


      {/* EMPTY STATE */}
      {selected.length === 0 && (
        <div className="p-8 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-center">
          <div className="text-3xl mb-2">📊</div>
          <p>Select 2 or more coins above to compare their performance.</p>
        </div>
      )}


      {/* TEK SECIM UYARISI */}
      {selected.length === 1 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
          Add at least one more coin to see performance comparison.
        </div>
      )}


      {/* PERFORMANCE TABLE */}
      {selected.length >= 2 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-3">
            Performance
          </h2>

          {performance.isLoading && (
            <div className="text-slate-400">Calculating performance...</div>
          )}

          {performance.isError && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              Failed to load performance data.
            </div>
          )}

          {performance.data && performance.data.length === 0 && (
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-sm">
              Not enough data points yet. Each coin needs at least 2 snapshots
              in price history for performance calculation.
            </div>
          )}

          {performance.data && performance.data.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Symbol</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Start Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Latest Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Total Return</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.data.map((row) => {
                    const ret = Number(row.total_return_pct)
                    const color = ret >= 0 ? 'text-emerald-400' : 'text-red-400'

                    return (
                      <tr
                        key={row.symbol}
                        className="border-t border-slate-700/50 hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-slate-100">
                          {row.symbol?.toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">
                          {formatPrice(row.start_price)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-200">
                          {formatPrice(row.latest_price)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono ${color}`}>
                          {formatPct(ret)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* CHART */}
      {selected.length >= 2 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-200 mb-3">
            Price Comparison <span className="text-sm font-normal text-slate-500">(normalized to start = 0%)</span>
          </h2>

          {history.isLoading && (
            <div className="text-slate-400">Loading chart data...</div>
          )}

          {history.isError && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              Failed to load history data.
            </div>
          )}

          {chartData.length === 0 && history.data && (
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-sm">
              No history data available yet.
            </div>
          )}

          {chartData.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={formatTimeAxis}
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v.toFixed(0)}%`}
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={<CustomTooltip />}
                  />
                  <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                  {selected.map((sym, i) => (
                    <Line
                      key={sym}
                      type="monotone"
                      dataKey={sym}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}