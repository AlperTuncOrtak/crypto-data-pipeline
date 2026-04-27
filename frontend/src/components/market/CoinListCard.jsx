// ============================================================
// components/market/CoinListCard.jsx
// ============================================================
// Dashboard'da kullanilan kucuk kartlar.
// Gainers / Losers / Volume uculu hepsi bu komponenti kullanir.
// Coin ismine tiklayinca /coin/:slug sayfasina gider.
//
// Props:
//  - title: Kart basligi
//  - accent: "emerald" | "red" | "blue"
//  - data: backend'den gelen dizi
//  - isLoading / isError
//  - renderValue: (coin) => ReactNode
// ============================================================

import { useNavigate } from 'react-router-dom'
import { Skeleton } from '../ui/Skeleton'

const ACCENT_CLASSES = {
  emerald: { title: 'text-emerald-400', border: 'border-emerald-500/20' },
  red: { title: 'text-red-400', border: 'border-red-500/20' },
  blue: { title: 'text-blue-400', border: 'border-blue-500/20' },
}


export default function CoinListCard({
  title,
  accent = 'emerald',
  data,
  isLoading,
  isError,
  renderValue,
}) {
  const colors = ACCENT_CLASSES[accent] || ACCENT_CLASSES.emerald
  const navigate = useNavigate()

  return (
    <div className={`bg-slate-800 border ${colors.border} rounded-lg p-5`}>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${colors.title}`}>
        {title}
      </h3>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {isError && <p className="text-sm text-red-400">Failed to load</p>}

      {data && data.length === 0 && (
        <p className="text-sm text-slate-500">No data</p>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((coin) => (
            <li
              key={coin.symbol}
              onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
              className="flex items-center justify-between text-sm cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* LOGO */}
                {coin.image_url ? (
                  <img
                    src={coin.image_url}
                    alt={coin.symbol}
                    className="w-6 h-6 rounded-full shrink-0"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-700 shrink-0 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {coin.symbol?.slice(0, 1)}
                    </span>
                  </div>
                )}

                <span className="font-mono font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {coin.symbol?.toUpperCase()}
                </span>
                <span className="text-slate-500 truncate">
                  {coin.name}
                </span>
              </div>
              <span className="font-mono text-slate-300 whitespace-nowrap ml-2">
                {renderValue(coin)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}