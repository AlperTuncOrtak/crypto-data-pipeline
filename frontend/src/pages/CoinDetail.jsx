// ============================================================
// pages/CoinDetail.jsx
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { useCoinDetail, useCoinHistory, useCoinStats } from '../hooks/useCoin'


const RANGES = [
    { label: '1H', value: '1h' },
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: 'ALL', value: 'all' },
]


function formatPrice(n) {
    const num = Number(n)
    if (isNaN(num) || n === null) return '—'
    if (num >= 1) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    return `$${num.toFixed(6)}`
}

// Iki fiyati karakter karakter karsilastir, degisen kismi renklendir
function AnimatedPrice({ current, prev, flash }) {
    const currentStr = formatPrice(current)
    const prevStr = prev ? formatPrice(prev) : currentStr

    const digitsOnly = (s) => s.replace(/[^0-9]/g, '')
    const currentDigits = digitsOnly(currentStr)
    const prevDigits = digitsOnly(prevStr)

    const maxDigits = Math.max(currentDigits.length, prevDigits.length)
    const paddedCurrent = currentDigits.padStart(maxDigits, '0')
    const paddedPrev = prevDigits.padStart(maxDigits, '0')

    // Soldan ilk farkli rakam pozisyonu (0-indexed, paddedCurrent'a gore)
    let firstDiffDigit = maxDigits // hic fark yoksa hicbiri yanmasin
    for (let i = 0; i < maxDigits; i++) {
        if (paddedCurrent[i] !== paddedPrev[i]) {
            firstDiffDigit = i
            break
        }
    }

    const color = flash === 'up' ? 'text-emerald-400' : 'text-red-400'

    // Her karakterin kacinci rakam oldugunu onceden hesapla
    let runningDigitIdx = maxDigits - currentDigits.length  // offset
    const charMeta = currentStr.split('').map((char) => {
        const isDigit = /[0-9]/.test(char)
        const digitIdx = isDigit ? runningDigitIdx : runningDigitIdx - 1
        if (isDigit) runningDigitIdx++
        return { char, isDigit, digitIdx }
    })

    return (
        <span>
            {charMeta.map(({ char, digitIdx }, i) => {
                const changed = flash && digitIdx >= firstDiffDigit
                return (
                    <span
                        key={i}
                        className={`transition-colors duration-500 ${changed ? `${color} animate-pulse` : 'text-slate-100'}`}
                    >
                        {char}
                    </span>
                )
            })}
        </span>
    )
}



function formatLargeNumber(n) {
    const num = Number(n)
    if (isNaN(num) || n === null) return '—'
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
}

function formatPct(n) {
    const num = Number(n)
    if (isNaN(num) || n === null) return '—'
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`
}

function formatChartTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatTooltipTime(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleString()
}


function StatCard({ label, value, accent = 'slate' }) {
    const accentColors = {
        slate: 'border-slate-700',
        emerald: 'border-emerald-500/30',
        red: 'border-red-500/30',
        blue: 'border-blue-500/30',
    }
    return (
        <div className={`bg-slate-800 border ${accentColors[accent]} rounded-lg p-4`}>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</div>
            <div className="text-lg font-mono font-semibold text-slate-100">{value}</div>
        </div>
    )
}


function ChartTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm shadow-lg">
            <div className="text-slate-400 text-xs mb-1">{formatTooltipTime(label)}</div>
            <div className="font-mono font-semibold text-slate-100">
                {formatPrice(payload[0]?.value)}
            </div>
        </div>
    )
}


export default function CoinDetail() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [range, setRange] = useState('24h')

    const { data: coin, isLoading: coinLoading, isError: coinError } = useCoinDetail(slug)
    const { data: history, isLoading: historyLoading } = useCoinHistory(slug, range)
    const { data: stats } = useCoinStats(slug)

    const prevPriceRef = useRef(null)
    const [priceFlash, setPriceFlash] = useState(null)
    const [prevPrice, setPrevPrice] = useState(null)


    useEffect(() => {
        if (!coin?.current_price) return
        const current = coin.current_price
        const prev = prevPriceRef.current
        if (prev !== null && current !== prev) {
            console.log('prev:', prev, 'current:', current)
            console.log('prevStr:', formatPrice(prev), 'currentStr:', formatPrice(current))
            setPrevPrice(prev)
            setPriceFlash(current > prev ? 'up' : 'down')
            setTimeout(() => setPriceFlash(null), 800)
        }
        prevPriceRef.current = current
    }, [coin?.current_price])



    const chartData = history || []
    const change = Number(coin?.price_change_percentage_24h)
    const changeColor = change >= 0 ? 'text-emerald-400' : 'text-red-400'
    const chartStroke = change >= 0 ? '#34d399' : '#f87171'


    if (coinLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading coin data...</div>
            </div>
        )
    }

    if (coinError || !coin) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="text-5xl">🔍</div>
                <div className="text-slate-300 text-xl font-semibold">Coin not found</div>
                <div className="text-slate-500 text-sm">"{slug}" does not exist in the database.</div>
                <button
                    onClick={() => navigate('/market')}
                    className="mt-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors"
                >
                    ← Back to Market
                </button>
            </div>
        )
    }


    return (
        <div>
            {/* BACK */}
            <button
                onClick={() => navigate(-1)}
                className="text-slate-400 hover:text-slate-200 text-sm mb-6 flex items-center gap-1 transition-colors"
            >
                ← Back
            </button>

            {/* HERO */}
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    {coin.image_url ? (
                        <img
                            src={coin.image_url}
                            alt={coin.name}
                            className="w-16 h-16 rounded-full shrink-0"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-700 shrink-0 flex items-center justify-center">
                            <span className="text-xl text-slate-400 font-mono font-bold">
                                {coin.symbol?.slice(0, 2)}
                            </span>
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-bold text-slate-100">{coin.name}</h1>
                            <span className="text-slate-500 font-mono text-lg">
                                {coin.symbol?.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-4xl font-mono font-bold">
                        <AnimatedPrice
                            current={coin.current_price}
                            prev={prevPrice}
                            flash={priceFlash}
                        />
                    </div>
                    <div className={`text-xl font-mono mt-1 ${changeColor}`}>
                        {formatPct(change)} <span className="text-sm text-slate-500">24h</span>
                    </div>
                </div>
            </div>

            {/* STAT KARTLARI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Market Cap" value={formatLargeNumber(coin.market_cap)} accent="slate" />
                <StatCard label="Volume (24h)" value={formatLargeNumber(coin.total_volume)} accent="blue" />
                <StatCard label="24h High" value={formatPrice(stats?.high_24h)} accent="emerald" />
                <StatCard label="24h Low" value={formatPrice(stats?.low_24h)} accent="red" />
            </div>

            {/* CHART */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h2 className="text-lg font-semibold text-slate-200">Price Chart</h2>
                    <div className="flex gap-1">
                        {RANGES.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => setRange(r.value)}
                                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${range === r.value
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700'
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {historyLoading && (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        Loading chart...
                    </div>
                )}

                {!historyLoading && chartData.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 gap-2">
                        <div className="text-slate-500">No data for this time range.</div>
                        <div className="text-slate-600 text-xs">
                            {stats?.data_points ?? 0} data points in last 24h.
                        </div>
                    </div>
                )}

                {!historyLoading && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                                dataKey="time"
                                tickFormatter={formatChartTime}
                                stroke="#334155"
                                tick={{ fill: '#64748b', fontSize: 11 }}
                            />
                            <YAxis
                                tickFormatter={formatPrice}
                                stroke="#334155"
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                width={80}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke={chartStroke}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: chartStroke }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}

                {stats && (
                    <div className="mt-3 text-xs text-slate-600 text-right">
                        {stats.data_points} data points in last 24h
                    </div>
                )}
            </div>
        </div>
    )
}