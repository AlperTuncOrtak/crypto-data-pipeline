import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarket, useGainers, useLosers, useVolume, useTrending } from '../hooks/useMarket'
import CoinListCard from '../components/market/CoinListCard'
import { TableRowSkeleton } from '../components/ui/Skeleton'
import { TrendingUp, Activity, DollarSign, Flame, Clock } from 'lucide-react'

function formatLargeNumber(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

function formatPrice(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (num >= 1) return `$${num.toFixed(2)}`
  if (num >= 0.01) return `$${num.toFixed(4)}`
  if (num >= 0.0001) return `$${num.toFixed(6)}`
  if (num >= 0.000001) return `$${num.toFixed(8)}`
  return `<$0.000001`
}

function StatCard({ icon: Icon, label, value, sub, accent = false }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="rounded-xl flex items-center gap-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: hovered ? '1px solid rgba(245,166,35,0.5)' : '1px solid var(--border)',
        padding: '20px',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 24px rgba(245,166,35,0.12)' : 'none',
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: accent || hovered
            ? 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.05))'
            : 'var(--bg-elevated)',
          color: accent || hovered ? 'var(--accent)' : 'var(--text-muted)',
          border: accent || hovered ? '1px solid rgba(245,166,35,0.2)' : '1px solid var(--border)',
          transition: 'all 0.2s ease',
        }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div
          className="text-base font-bold font-mono leading-tight mt-0.5"
          style={{ color: hovered ? 'var(--accent)' : 'var(--text-primary)', transition: 'color 0.2s ease' }}
        >
          {value}
        </div>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  )
}

function LastUpdated({ marketData }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    setSeconds(0)
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [marketData]) // marketData değişince sıfırla

  const label = seconds < 60
    ? `${seconds}s ago`
    : `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`

  return (
    <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
      <Clock size={11} />
      <span>Updated {label}</span>
    </div>
  )
}


function FearGreedGauge({ coins }) {
  const score = (() => {
    if (!coins || coins.length === 0) return 50
    const positives = coins.filter(c => Number(c.price_change_percentage_24h) > 0).length
    const ratio = positives / coins.length
    const avgChange = coins.reduce((s, c) => s + Math.abs(Number(c.price_change_percentage_24h) || 0), 0) / coins.length
    const volatilityFactor = Math.min(avgChange / 10, 1)
    return Math.round(ratio * 70 + volatilityFactor * 30)
  })()

  const getLabel = (s) => {
    if (s <= 20) return { text: 'Extreme Fear', color: '#e74c3c', bg: 'rgba(231,76,60,0.1)' }
    if (s <= 40) return { text: 'Fear', color: '#e67e22', bg: 'rgba(230,126,34,0.1)' }
    if (s <= 60) return { text: 'Neutral', color: '#f5a623', bg: 'rgba(245,166,35,0.1)' }
    if (s <= 80) return { text: 'Greed', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)' }
    return { text: 'Extreme Greed', color: '#27ae60', bg: 'rgba(39,174,96,0.1)' }
  }

  const { text, color, bg } = getLabel(score)
  const up = coins?.filter(c => Number(c.price_change_percentage_24h) > 0).length || 0
  const down = coins?.filter(c => Number(c.price_change_percentage_24h) < 0).length || 0

  return (
    <div
      className="rounded-xl"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px' }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <h3
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
        >
          Fear & Greed
        </h3>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: bg, color }}
        >
          {text}
        </span>
      </div>

      {/* Büyük skor */}
      <div className="flex items-end gap-3" style={{ marginBottom: 16 }}>
        <div className="text-5xl font-bold font-mono leading-none" style={{ color }}>
          {score}
        </div>
        <div className="flex flex-col pb-1" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          <span>/ 100</span>
          <span style={{ marginTop: 2 }}>index</span>
        </div>
      </div>

      {/* Gradient progress bar */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{ height: 6, backgroundColor: 'var(--bg-elevated)', marginBottom: 8 }}
      >
        {/* Gradient arka plan */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #e74c3c 0%, #e67e22 25%, #f5a623 50%, #2ecc71 75%, #27ae60 100%)',
            opacity: 0.3,
          }}
        />
        {/* Score indicator */}
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, #e74c3c, ${color})`,
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
        {/* Nokta göstergesi */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg"
          style={{
            left: `calc(${score}% - 6px)`,
            backgroundColor: color,
            border: '2px solid var(--bg-surface)',
            transition: 'left 1s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      {/* Alt etiketler */}
      <div className="flex justify-between" style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 10, color: '#e74c3c' }}>Extreme Fear</span>
        <span style={{ fontSize: 10, color: '#27ae60' }}>Extreme Greed</span>
      </div>

      {/* Up/Down */}
      <div
        className="flex items-center justify-between rounded-lg"
        style={{ backgroundColor: 'var(--bg-elevated)', padding: '8px 12px' }}
      >
        <span className="text-xs font-mono" style={{ color: 'var(--positive)' }}>↑ {up} up</span>
        <div style={{ width: 1, height: 12, backgroundColor: 'var(--border)' }} />
        <span className="text-xs font-mono" style={{ color: 'var(--negative)' }}>↓ {down} down</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const market = useMarket(500)
  const gainers = useGainers(5)
  const losers = useLosers(5)
  const volume = useVolume(5)
  const trending = useTrending()
  const navigate = useNavigate()

  const totalVolume = market.data?.reduce((s, c) => s + (Number(c.total_volume) || 0), 0) || 0
  const btcData = market.data?.find(c => c.symbol === 'BTC')
  const ethData = market.data?.find(c => c.symbol === 'ETH')
  const btcDom = totalVolume && btcData ? ((Number(btcData.total_volume) / totalVolume) * 100).toFixed(1) : '—'
  const ethDom = totalVolume && ethData ? ((Number(ethData.total_volume) / totalVolume) * 100).toFixed(1) : '—'

  return (
    <div style={{ color: 'var(--text-primary)' }}>

      {/* HEADER */}
      <div className="flex items-end justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Live market data via Binance WebSocket</p>
        </div>
        <LastUpdated marketData={market.data} />
      </div>

      {/* GLOBAL STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ marginBottom: 24 }}>
        <StatCard icon={DollarSign} label="Total 24h Volume" value={formatLargeNumber(totalVolume)} accent={true} />
        <StatCard icon={Activity} label="BTC Dominance" value={`${btcDom}%`} sub="by volume" />
        <StatCard icon={TrendingUp} label="ETH Dominance" value={`${ethDom}%`} sub="by volume" />
        <StatCard icon={Flame} label="Coins Tracked" value="388+" sub="via Binance WS" />
      </div>

      {/* İKİ KOLON LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SOL KOLON (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* TRENDING */}
          {trending.data && trending.data.length > 0 && (
            <div className="rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <Flame size={14} style={{ color: 'var(--accent)' }} />
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Trending</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {trending.data.map(coin => {
                  const change = Number(coin.price_change_percentage_24h)
                  return (
                    <div
                      key={coin.symbol}
                      onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                      className="flex items-center gap-3 rounded-xl cursor-pointer transition-all"
                      style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-soft)', padding: '12px' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,0.3)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
                    >
                      {coin.image_url ? (
                        <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--accent)' }}>
                          {coin.symbol?.slice(0, 1)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{coin.symbol?.toUpperCase()}</div>
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{coin.name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{formatPrice(coin.current_price)}</div>
                        <div className="text-xs font-mono font-semibold" style={{ color: change >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TOP 10 TABLE */}
          <div className="rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 16 }}>
              Top 10 by Volume
            </h2>
            {market.isLoading && (
              <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)}</tbody></table>
            )}
            {market.data && market.data.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Symbol', 'Price', '24h', 'Volume'].map((h, i) => (
                      <th key={h} className={`pb-3 text-xs font-semibold uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-right'}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {market.data.slice(0, 10).map((coin) => {
                    const change = Number(coin.price_change_percentage_24h)
                    const changeColor = change >= 0 ? 'var(--positive)' : 'var(--negative)'
                    return (
                      <tr
                        key={coin.symbol}
                        onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                        className="transition-colors cursor-pointer"
                        style={{ borderTop: '1px solid var(--border-soft)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245,166,35,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <div className="flex items-center gap-2">
                            {coin.image_url ? (
                              <img src={coin.image_url} alt={coin.symbol} className="w-6 h-6 rounded-full shrink-0" onError={(e) => { e.target.style.display = 'none' }} />
                            ) : (
                              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px]" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent)' }}>
                                {coin.symbol?.slice(0, 1)}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-bold font-mono" style={{ color: 'var(--accent)' }}>{coin.symbol?.toUpperCase()}</div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{coin.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right font-mono text-sm" style={{ color: 'var(--text-primary)', padding: '10px 0' }}>{formatPrice(coin.current_price)}</td>
                        <td className="text-right font-mono text-sm font-semibold" style={{ color: changeColor, padding: '10px 0' }}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</td>
                        <td className="text-right font-mono text-sm" style={{ color: 'var(--text-muted)', padding: '10px 0 10px 12px' }}>{formatLargeNumber(coin.total_volume)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* SAĞ KOLON (1/3) */}
        <div className="flex flex-col gap-4">

          {/* FEAR & GREED */}
          {market.data && <FearGreedGauge coins={market.data} />}

          <CoinListCard
            title="Top Gainers (24h)"
            accent="orange"
            data={gainers.data}
            isLoading={gainers.isLoading}
            isError={gainers.isError}
            renderValue={(coin) => {
              const pct = Number(coin.price_change_percentage_24h)
              return <span style={{ color: 'var(--positive)' }}>+{pct.toFixed(2)}%</span>
            }}
          />
          <CoinListCard
            title="Top Losers (24h)"
            accent="red"
            data={losers.data}
            isLoading={losers.isLoading}
            isError={losers.isError}
            renderValue={(coin) => {
              const pct = Number(coin.price_change_percentage_24h)
              return <span style={{ color: 'var(--negative)' }}>{pct.toFixed(2)}%</span>
            }}
          />
          <CoinListCard
            title="Highest Volume (24h)"
            accent="blue"
            data={volume.data}
            isLoading={volume.isLoading}
            isError={volume.isError}
            renderValue={(coin) => (
              <span style={{ color: 'var(--text-secondary)' }}>{formatLargeNumber(coin.total_volume)}</span>
            )}
          />
        </div>

      </div>
    </div>
  )
}