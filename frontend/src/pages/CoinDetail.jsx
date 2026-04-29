import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    CartesianGrid, ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import { useCoinDetail, useCoinHistory, useCoinStats } from '../hooks/useCoin'
import { ArrowLeft } from 'lucide-react'

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
    if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    if (num >= 1) return `$${num.toFixed(2)}`
    if (num >= 0.01) return `$${num.toFixed(4)}`
    if (num >= 0.0001) return `$${num.toFixed(6)}`
    if (num >= 0.000001) return `$${num.toFixed(8)}`
    return `<$0.000001`
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

// Digit-level animasyonlu fiyat
function AnimatedPrice({ current, prev, flash }) {
    const currentStr = formatPrice(current)
    const prevStr = prev ? formatPrice(prev) : currentStr
    const digitsOnly = (s) => s.replace(/[^0-9]/g, '')
    const currentDigits = digitsOnly(currentStr)
    const prevDigits = digitsOnly(prevStr)
    const maxDigits = Math.max(currentDigits.length, prevDigits.length)
    const paddedCurrent = currentDigits.padStart(maxDigits, '0')
    const paddedPrev = prevDigits.padStart(maxDigits, '0')
    let firstDiffDigit = maxDigits
    for (let i = 0; i < maxDigits; i++) {
        if (paddedCurrent[i] !== paddedPrev[i]) { firstDiffDigit = i; break }
    }
    const color = flash === 'up' ? 'var(--positive)' : 'var(--negative)'
    let runningDigitIdx = maxDigits - currentDigits.length
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
                        style={{
                            color: changed ? color : 'var(--text-primary)',
                            transition: 'color 0.5s ease',
                        }}
                    >
                        {char}
                    </span>
                )
            })}
        </span>
    )
}

function StatCard({ label, value, sub }) {
    return (
        <div
            className="rounded-xl"
            style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                padding: '16px 20px',
            }}
        >
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 6 }}>
                {label}
            </div>
            <div className="text-lg font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                {value}
            </div>
            {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
        </div>
    )
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null
    return (
        <div
            className="rounded-xl text-sm shadow-xl"
            style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                padding: '10px 14px',
            }}
        >
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{formatTooltipTime(label)}</div>
            <div className="font-mono font-bold" style={{ color: 'var(--accent)' }}>
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
            setPrevPrice(prev)
            setPriceFlash(current > prev ? 'up' : 'down')
            setTimeout(() => setPriceFlash(null), 800)
        }
        prevPriceRef.current = current
    }, [coin?.current_price])

    const chartData = history || []
    const change = Number(coin?.price_change_percentage_24h)
    const isPositive = change >= 0

    // Chart rengi: periyot başı/sonu fiyat karşılaştırması
    const chartTrend = (() => {
        if (!chartData || chartData.length < 2) return isPositive
        const first = Number(chartData[0]?.price)
        const last = Number(chartData[chartData.length - 1]?.price)
        return last >= first
    })()
    const chartStroke = chartTrend ? 'var(--positive)' : 'var(--negative)'


    if (coinLoading) {
        return (
            <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
                Loading...
            </div>
        )
    }

    if (coinError || !coin) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="text-5xl">🔍</div>
                <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Coin not found</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>"{slug}" bulunamadı.</div>
                <button
                    onClick={() => navigate('/market')}
                    className="px-4 py-2 rounded-lg text-sm transition-all"
                    style={{
                        backgroundColor: 'rgba(245,166,35,0.1)',
                        border: '1px solid rgba(245,166,35,0.3)',
                        color: 'var(--accent)',
                    }}
                >
                    ← Market'e Dön
                </button>
            </div>
        )
    }

    return (
        <div style={{ color: 'var(--text-primary)' }}>

            {/* BACK */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm transition-all mb-6"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
                <ArrowLeft size={14} /> Back
            </button>

            {/* HERO */}
            <div className="flex items-start justify-between flex-wrap gap-4" style={{ marginBottom: 24 }}>
                <div className="flex items-center gap-4">
                    {coin.image_url ? (
                        <img src={coin.image_url} alt={coin.name} className="w-14 h-14 rounded-full shrink-0" onError={(e) => { e.target.style.display = 'none' }} />
                    ) : (
                        <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-xl font-bold font-mono" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent)' }}>
                            {coin.symbol?.slice(0, 2)}
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{coin.name}</h1>
                        <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{coin.symbol?.toUpperCase()}</span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-4xl font-mono font-bold">
                        <AnimatedPrice current={coin.current_price} prev={prevPrice} flash={priceFlash} />
                    </div>
                    <div className="text-lg font-mono mt-1" style={{ color: isPositive ? 'var(--positive)' : 'var(--negative)' }}>
                        {formatPct(change)} <span className="text-sm" style={{ color: 'var(--text-muted)' }}>24h</span>
                    </div>
                </div>
            </div>

            {/* STAT KARTLARI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ marginBottom: 24 }}>
                <StatCard label="Market Cap" value={formatLargeNumber(coin.market_cap)} />
                <StatCard label="Volume (24h)" value={formatLargeNumber(coin.total_volume)} />
                <StatCard label="24h High" value={formatPrice(stats?.high_24h)} />
                <StatCard label="24h Low" value={formatPrice(stats?.low_24h)} />
            </div>

            {/* CHART */}
            <div
                className="rounded-xl"
                style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    padding: '24px',
                }}
            >
                <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: 24 }}>
                    <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                        Price Chart
                    </h2>
                    <div className="flex gap-1" style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: 4 }}>
                        {RANGES.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => setRange(r.value)}
                                className="px-3 py-1 text-xs font-semibold rounded-lg transition-all"
                                style={{
                                    backgroundColor: range === r.value ? 'var(--bg-surface)' : 'transparent',
                                    border: range === r.value ? '1px solid var(--border)' : '1px solid transparent',
                                    color: range === r.value ? 'var(--accent)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    boxShadow: range === r.value ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                </div>

                {historyLoading && (
                    <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
                        Loading chart...
                    </div>
                )}

                {!historyLoading && chartData.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 gap-2">
                        <div style={{ color: 'var(--text-muted)' }}>Bu zaman aralığında veri yok.</div>
                    </div>
                )}

                {!historyLoading && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={chartStroke} stopOpacity={0.2} />
                                    <stop offset="100%" stopColor={chartStroke} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                                dataKey="time"
                                tickFormatter={formatChartTime}
                                stroke="var(--border)"
                                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                            />
                            <YAxis
                                tickFormatter={formatPrice}
                                stroke="var(--border)"
                                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                width={90}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke={chartStroke}
                                strokeWidth={2}
                                fill="url(#priceGradient)"
                                dot={false}
                                activeDot={{ r: 5, fill: '#f5a623', stroke: 'var(--bg-surface)', strokeWidth: 2 }}

                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}

                {stats && (
                    <div className="text-xs text-right mt-3" style={{ color: 'var(--text-muted)' }}>
                        {stats.data_points} data points in last 24h
                    </div>
                )}
            </div>
        </div>
    )
}