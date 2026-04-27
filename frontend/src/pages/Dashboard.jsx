// ============================================================
// pages/Dashboard.jsx
// ============================================================
// Ana ekran. Ust kisimda 3 kart: gainers / losers / volume.
// Alt kisimda full market tablosu.
// Coin ismine tiklayinca /coin/:slug detail sayfasina gider.
// ============================================================

import { useNavigate } from 'react-router-dom'
import { useMarket, useGainers, useLosers, useVolume } from '../hooks/useMarket'
import CoinListCard from '../components/market/CoinListCard'


// -----------------------
// FORMATTERS
// -----------------------
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
  if (num >= 1) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  return `$${num.toFixed(6)}`
}


// -----------------------
// MAIN PAGE
// -----------------------
export default function Dashboard() {
  const market = useMarket(10)
  const gainers = useGainers(5)
  const losers = useLosers(5)
  const volume = useVolume(5)
  const navigate = useNavigate()


  return (
    <div>
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Market overview — auto-refreshes every 30 seconds
        </p>
      </div>


      {/* 3 KART GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <CoinListCard
          title="Top Gainers (24h)"
          accent="emerald"
          data={gainers.data}
          isLoading={gainers.isLoading}
          isError={gainers.isError}
          renderValue={(coin) => {
            const pct = Number(coin.price_change_percentage_24h)
            return <span className="text-emerald-400">+{pct.toFixed(2)}%</span>
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
            return <span className="text-red-400">{pct.toFixed(2)}%</span>
          }}
        />

        <CoinListCard
          title="Highest Volume (24h)"
          accent="blue"
          data={volume.data}
          isLoading={volume.isLoading}
          isError={volume.isError}
          renderValue={(coin) => formatLargeNumber(coin.total_volume)}
        />
      </div>


      {/* FULL MARKET TABLE */}
      <div>
        <h2 className="text-xl font-semibold text-slate-200 mb-4">
          Top 10 by Market Cap
        </h2>

        {market.isLoading && (
          <div className="text-slate-400">Loading market data...</div>
        )}

        {market.isError && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            <p className="font-semibold">Failed to load market data</p>
            <p className="text-sm mt-1 opacity-80">{market.error.message}</p>
          </div>
        )}

        {market.data && market.data.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Symbol</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Price</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">24h Change</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {market.data.map((coin) => {
                  const change = Number(coin.price_change_percentage_24h)
                  const changeColor = change >= 0 ? 'text-emerald-400' : 'text-red-400'

                  return (
                    <tr
                      key={coin.symbol}
                      className="border-t border-slate-700 hover:bg-slate-800/50"
                    >
                      {/* SYMBOL */}
                      <td className="px-4 py-3 font-mono font-semibold">
                        {coin.symbol?.toUpperCase()}
                      </td>

                      {/* NAME - tiklayinca coin detail'e git */}
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                      >
                        <span className="text-slate-300 hover:text-emerald-400 transition-colors">
                          {coin.name}
                        </span>
                      </td>

                      {/* PRICE */}
                      <td className="px-4 py-3 text-right font-mono">
                        {formatPrice(coin.current_price)}
                      </td>

                      {/* 24H CHANGE */}
                      <td className={`px-4 py-3 text-right font-mono ${changeColor}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </td>

                      {/* MARKET CAP */}
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        {formatLargeNumber(coin.market_cap)}
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