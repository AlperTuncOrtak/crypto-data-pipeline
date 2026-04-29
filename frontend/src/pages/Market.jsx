import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarket } from '../hooks/useMarket'
import { useSparklines } from '../hooks/useSparklines'
import Sparkline from '../components/market/Sparkline'
import { TableRowSkeleton } from '../components/ui/Skeleton'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

const PAGE_SIZE = 100

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
  if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (num >= 1) return `$${num.toFixed(2)}`
  if (num >= 0.01) return `$${num.toFixed(4)}`
  if (num >= 0.0001) return `$${num.toFixed(6)}`
  if (num >= 0.000001) return `$${num.toFixed(8)}`
  return `<$0.000001`
}

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

function SortableHeader({ label, sortKey, currentSort, onSort, align = 'right' }) {
  const isActive = currentSort.key === sortKey
  const arrow = isActive ? (currentSort.direction === 'asc' ? '▲' : '▼') : ''
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors"
      style={{
        padding: '12px 16px',
        textAlign: align,
        color: isActive ? 'var(--accent)' : 'var(--text-muted)',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      {label} {arrow && <span style={{ color: 'var(--accent)', fontSize: 10 }}>{arrow}</span>}
    </th>
  )
}

function CoinLogo({ imageUrl, symbol }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={symbol}
        className="w-8 h-8 rounded-full shrink-0"
        onError={(e) => { e.target.style.display = 'none' }}
      />
    )
  }
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold font-mono"
      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent)' }}
    >
      {symbol?.slice(0, 2)?.toUpperCase()}
    </div>
  )
}

export default function Market() {
  const { data: marketData, isLoading, isError, error } = useMarket(500)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'total_volume', direction: 'desc' })
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const filteredAndSorted = useMemo(() => {
    if (!marketData) return []
    const term = search.trim().toLowerCase()
    let rows = marketData
    if (term) {
      rows = marketData.filter((c) =>
        (c.symbol || '').toLowerCase().includes(term) ||
        (c.name || '').toLowerCase().includes(term)
      )
    }
    return sortRows(rows, sort.key, sort.direction)
  }, [marketData, search, sort])

  // Search değişince 1. sayfaya dön
  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE)
  const paginated = filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const symbols = useMemo(() => paginated.map((c) => c.symbol).filter(Boolean), [paginated])
  const { data: sparklineData } = useSparklines(symbols, 24)

  function handleSort(key) {
    setPage(1)
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' }
    )
  }

  function handleSearch(e) {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <div style={{ color: 'var(--text-primary)' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Market Explorer
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {filteredAndSorted.length} coins — sayfa {page}/{totalPages || 1}
        </p>
      </div>

      {/* SEARCH + PAGINATION ÜST */}
      <div className="flex items-center justify-between gap-4" style={{ marginBottom: 16 }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            width: 280,
          }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by symbol or name..."
            value={search}
            onChange={handleSearch}
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
          />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 rounded-lg text-sm font-mono transition-all"
                style={{
                  backgroundColor: p === page ? 'var(--accent)' : 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: p === page ? '#111' : 'var(--text-muted)',
                  fontWeight: p === page ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.5 : 1,
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* LOADING */}
      {isLoading && (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <table className="w-full">
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={7} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ERROR */}
      {isError && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{ backgroundColor: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--negative)' }}
        >
          Failed to load market data: {error?.message}
        </div>
      )}

      {/* TABLE */}
      {paginated.length > 0 && (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
                <th className="text-xs font-semibold uppercase tracking-wider text-left" style={{ padding: '12px 16px', color: 'var(--text-muted)', width: 48 }}>#</th>
                <th className="text-xs font-semibold uppercase tracking-wider text-left" style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Name</th>
                <SortableHeader label="Price" sortKey="current_price" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="24h %" sortKey="price_change_percentage_24h" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Volume" sortKey="total_volume" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Market Cap" sortKey="market_cap" currentSort={sort} onSort={handleSort} />
                <th className="text-xs font-semibold uppercase tracking-wider text-right" style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Last 24h</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((coin, idx) => {
                const change = Number(coin.price_change_percentage_24h)
                const changeColor = change >= 0 ? 'var(--positive)' : 'var(--negative)'
                const sparkPrices = sparklineData?.[coin.symbol] || []
                const rank = (page - 1) * PAGE_SIZE + idx + 1

                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                    className="transition-colors"
                    style={{ borderTop: '1px solid var(--border-soft)', cursor: coin.slug ? 'pointer' : 'not-allowed' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245,166,35,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                      {rank}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="flex items-center gap-3">
                        <CoinLogo imageUrl={coin.image_url} symbol={coin.symbol} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {coin.name}
                          </span>
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                            {coin.symbol?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-mono text-sm" style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>
                      {formatPrice(coin.current_price)}
                    </td>
                    <td className="text-right font-mono text-sm font-semibold" style={{ padding: '14px 16px', color: changeColor }}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </td>
                    <td className="text-right font-mono text-sm" style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {formatLargeNumber(coin.total_volume)}
                    </td>
                    <td className="text-right font-mono text-sm" style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {formatLargeNumber(coin.market_cap)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="flex justify-end">
                        <Sparkline
                          prices={sparkPrices}
                          width={100}
                          height={32}
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

      {/* EMPTY */}
      {marketData && filteredAndSorted.length === 0 && (
        <div
          className="p-8 text-center rounded-xl"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          "{search}" ile eşleşen coin bulunamadı
        </div>
      )}

      {/* PAGINATION ALT */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2" style={{ marginTop: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={14} /> Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="w-8 h-8 rounded-lg text-sm font-mono transition-all"
              style={{
                backgroundColor: p === page ? 'var(--accent)' : 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: p === page ? '#111' : 'var(--text-muted)',
                fontWeight: p === page ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}