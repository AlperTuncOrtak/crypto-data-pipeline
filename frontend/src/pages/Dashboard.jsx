import { useNavigate } from 'react-router-dom'
import { useMarket, useGainers, useLosers, useVolume } from '../hooks/useMarket'
import CoinListCard from '../components/market/CoinListCard'
import { TableRowSkeleton } from '../components/ui/Skeleton'


function formatLargeNumber(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9)  return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6)  return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3)  return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

function formatPrice(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  return `$${num.toFixed(6)}`
}


export default function Dashboard() {
  const market  = useMarket(10)
  const gainers = useGainers(5)
  const losers  = useLosers(5)
  const volume  = useVolume(5)
  const navigate = useNavigate()

  return (
    <div style={{ color: 'var(--text-primary)' }}>

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Live market data via Binance WebSocket
        </p>
      </div>


      {/* 3 KART GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
            <span style={{ color: 'var(--text-secondary)' }}>
              {formatLargeNumber(coin.total_volume)}
            </span>
          )}
        />
      </div>


      {/* TOP 10 TABLE */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Top 10 by Volume
        </h2>

        {market.isLoading && (
          <table className="w-full">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={5} />
              ))}
            </tbody>
          </table>
        )}

        {market.isError && (
          <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--negative)' }}>
            Failed to load market data
          </div>
        )}

        {market.data && market.data.length > 0 && (
          <div className="overflow-x-auto rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Symbol', 'Name', 'Price', '24h Change', 'Volume'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${i >= 2 ? 'text-right' : 'text-left'}`}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {market.data.map((coin) => {
                  const change = Number(coin.price_change_percentage_24h)
                  const changeColor = change >= 0 ? 'var(--positive)' : 'var(--negative)'

                  return (
                    <tr
                      key={coin.symbol}
                      onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                      className="transition-colors cursor-pointer"
                      style={{ borderTop: '1px solid var(--border-soft)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: 'var(--accent)' }}>
                        {coin.symbol?.toUpperCase()}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {coin.image_url ? (
                            <img
                              src={coin.image_url}
                              alt={coin.symbol}
                              className="w-6 h-6 rounded-full shrink-0"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-mono"
                              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                            >
                              {coin.symbol?.slice(0, 1)}
                            </div>
                          )}
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {coin.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                        {formatPrice(coin.current_price)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold" style={{ color: changeColor }}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formatLargeNumber(coin.total_volume)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}