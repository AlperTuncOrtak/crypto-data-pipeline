// ============================================================
// components/market/CoinListCard.jsx
// ============================================================
// Dashboard'da kullanilan kucuk kartlar icin reusable component.
// Gainers / Losers / Volume uculu hepsi bu komponenti kullanir,
// sadece baslik + liste + nasil gosterilecegi farkli.
//
// Props:
//  - title: Kart basligi
//  - accent: "emerald" | "red" | "blue" - renk tonu (baslik + pill)
//  - data: backend'den gelen dizi (null/undefined olabilir)
//  - isLoading: yukleniyor mu
//  - isError: hata var mi
//  - renderValue: (coin) => string - her coin icin sagda ne yazilsin
// ============================================================


// Accent renk temalari - Tailwind class'lari
const ACCENT_CLASSES = {
  emerald: {
    title: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  red: {
    title: 'text-red-400',
    border: 'border-red-500/20',
  },
  blue: {
    title: 'text-blue-400',
    border: 'border-blue-500/20',
  },
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

  return (
    <div className={`bg-slate-800 border ${colors.border} rounded-lg p-5`}>
      <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${colors.title}`}>
        {title}
      </h3>

      {/* LOADING */}
      {isLoading && (
        <p className="text-sm text-slate-500">Loading...</p>
      )}

      {/* ERROR */}
      {isError && (
        <p className="text-sm text-red-400">Failed to load</p>
      )}

      {/* EMPTY */}
      {data && data.length === 0 && (
        <p className="text-sm text-slate-500">No data</p>
      )}

      {/* DATA - basit liste */}
      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((coin) => (
            <li
              key={coin.symbol}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-semibold text-slate-200">
                  {coin.symbol?.toUpperCase()}
                </span>
                <span className="text-slate-500 truncate">
                  {coin.name}
                </span>
              </div>
              <span className="font-mono text-slate-300 whitespace-nowrap">
                {renderValue(coin)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}