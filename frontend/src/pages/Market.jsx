// ============================================================
// pages/Market.jsx
// ============================================================
// CoinMarketCap stilinde tablo:
//  - Top 100 coin (market cap'e gore)
//  - Search box (sembol veya isim ile filtre)
//  - Kolon basliklarina tiklayinca siralama (asc/desc)
//  - Her satirda logo + son 24h sparkline
//  - Tum satir tıklanabilir → /coin/:slug
// ============================================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarket } from '../hooks/useMarket'
import { useSparklines } from '../hooks/useSparklines'
import Sparkline from '../components/market/Sparkline'
import { TableRowSkeleton } from '../components/ui/Skeleton'


// -----------------------
// FORMATTERS
// -----------------------
function formatLargeNumber(n) {
  const num = Number(n)
  if (isNaN(num) || num === 0) return '—'
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
// SORT HELPER
// -----------------------
function sortRows(rows, key, direction) {
  if (!key) return rows
  return [...rows].sort((a, b) => {
    const av = Number(a[key])
    const bv = Number(b[key])
    if (isNaN(av)) return 1
    if (isNaN(bv)) return -1
    return direction === 'asc' ? av - bv : bv - av
  })
}


// -----------------------
// SORTABLE HEADER
// -----------------------
function SortableHeader({ label, sortKey, currentSort, onSort, align = 'right' }) {
  const isActive = currentSort.key === sortKey
  const arrow = isActive ? (currentSort.direction === 'asc' ? '▲' : '▼') : ''

  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-4 py-3 text-${align} text-xs font-semibold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-200 transition-colors`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {arrow && <span className="text-emerald-400 text-[10px]">{arrow}</span>}
      </span>
    </th>
  )
}


// -----------------------
// COIN LOGO
// -----------------------
// Reusable logo komponenti. image_url varsa img, yoksa fallback harf.
function CoinLogo({ imageUrl, symbol, size = 8 }) {
  const sizeClass = `w-${size} h-${size}`

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={symbol}
        className={`${sizeClass} rounded-full shrink-0`}
        onError={(e) => { e.target.style.display = 'none' }}
      />
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-slate-700 shrink-0 flex items-center justify-center`}>
      <span className="text-xs text-slate-400 font-mono font-bold">
        {symbol?.slice(0, 2)?.toUpperCase()}
      </span>
    </div>
  )
}


// -----------------------
// MAIN PAGE
// -----------------------
export default function Market() {
  const { data: marketData, isLoading, isError, error } = useMarket(100)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'market_cap', direction: 'desc' })
  const navigate = useNavigate()


  // FILTER + SORT
  const filteredAndSorted = useMemo(() => {
    if (!marketData) return []
    const term = search.trim().toLowerCase()
    let rows = marketData
    if (term) {
      rows = marketData.filter((c) => {
        const sym = (c.symbol || '').toLowerCase()
        const name = (c.name || '').toLowerCase()
        return sym.includes(term) || name.includes(term)
      })
    }
    return sortRows(rows, sort.key, sort.direction)
  }, [marketData, search, sort])


  // SPARKLINES
  const symbols = useMemo(
    () => filteredAndSorted.map((c) => c.symbol).filter(Boolean),
    [filteredAndSorted]
  )
  const { data: sparklineData } = useSparklines(symbols, 24)


  // SORT HANDLER
  function handleSort(key) {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'desc' }
    })
  }


  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100">Market Explorer</h1>
        <p className="text-slate-400 mt-1">
          {marketData?.length ?? 0} coins tracked — sorted by {sort.key} ({sort.direction})
        </p>
      </div>


      {/* SEARCH */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by symbol or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>


      {/* LOADING / ERROR */}
      {isLoading && (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full">
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={7} />
              ))}
            </tbody>
          </table>
        </div>
      )}


      {isError && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          <p className="font-semibold">Failed to load market data</p>
          <p className="text-sm mt-1 opacity-80">{error?.message}</p>
        </div>
      )}


      {/* TABLE */}
      {filteredAndSorted.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                <SortableHeader label="Price" sortKey="current_price" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="24h %" sortKey="price_change_percentage_24h" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Volume (24h)" sortKey="total_volume" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Market Cap" sortKey="market_cap" currentSort={sort} onSort={handleSort} />
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Last 24h</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((coin, idx) => {
                const change = Number(coin.price_change_percentage_24h)
                const changeColor = change >= 0 ? 'text-emerald-400' : 'text-red-400'
                const sparkPrices = sparklineData?.[coin.symbol] || []

                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    className="border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    {/* RANK */}
                    <td className="px-4 py-4 text-slate-500 text-sm">
                      {idx + 1}
                    </td>

                    {/* LOGO + NAME + SYMBOL */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <CoinLogo
                          imageUrl={coin.image_url}
                          symbol={coin.symbol}
                          size={8}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-100 hover:text-emerald-400 transition-colors truncate">
                            {coin.name}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {coin.symbol?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* PRICE */}
                    <td className="px-4 py-4 text-right font-mono text-slate-200">
                      {formatPrice(coin.current_price)}
                    </td>

                    {/* 24H CHANGE */}
                    <td className={`px-4 py-4 text-right font-mono ${changeColor}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </td>

                    {/* VOLUME */}
                    <td className="px-4 py-4 text-right font-mono text-slate-400">
                      {formatLargeNumber(coin.total_volume)}
                    </td>

                    {/* MARKET CAP */}
                    <td className="px-4 py-4 text-right font-mono text-slate-400">
                      {formatLargeNumber(coin.market_cap)}
                    </td>

                    {/* SPARKLINE */}
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <Sparkline
                          prices={sparkPrices}
                          width={120}
                          height={36}
                          trendOverride={change >= 0 ? 'up' : 'down'}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}


      {/* EMPTY SEARCH */}
      {marketData && marketData.length > 0 && filteredAndSorted.length === 0 && (
        <div className="p-8 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-center">
          No coins match "{search}"
        </div>
      )}
    </div>
  )
}