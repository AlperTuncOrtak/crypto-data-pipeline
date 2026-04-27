// ============================================================
// components/analysis/CoinSelector.jsx
// ============================================================
// Analysis sayfasinda kullanicinin karsilastirilacak coinleri
// secmesi icin kucuk bir secici. Workflow:
//
//  1. Input'a yaz -> dropdown'da eslesen coinler listelenir
//  2. Coin'e tikla -> chip olarak eklenir
//  3. Chip'teki × -> coin secimi silinir
//
// Limit: max 5 coin (chart 5'ten fazlasinda karmasik gorunur).
//
// Props:
//  - allCoins: tum coin listesi (market endpoint'inden gelir)
//  - selected: secili sembol dizisi ['BTC', 'ETH']
//  - onChange: (yeni dizi) => void
//  - maxSelection: max secim sayisi (default 5)
// ============================================================

import { useState, useRef, useEffect } from 'react'


export default function CoinSelector({
  allCoins = [],
  selected = [],
  onChange,
  maxSelection = 5,
}) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)


  // -----------------------
  // CLICK OUTSIDE -> KAPAT
  // -----------------------
  // Dropdown disinda bir yere tiklarsa kapansin.
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  // -----------------------
  // FILTRE
  // -----------------------
  // Search'e gore filtre, ayrica zaten secili olanlari gizle.
  const filtered = allCoins.filter((c) => {
    const sym = (c.symbol || '').toLowerCase()
    const name = (c.name || '').toLowerCase()
    const term = search.trim().toLowerCase()

    // Zaten secili olan coinleri dropdown'da gosterme
    if (selected.includes(c.symbol)) return false

    // Search bossa hepsini goster (ilk 50 ile sinirla, performans)
    if (!term) return true

    return sym.includes(term) || name.includes(term)
  }).slice(0, 50)


  // -----------------------
  // HANDLERS
  // -----------------------
  function handleSelect(symbol) {
    if (selected.length >= maxSelection) return
    onChange([...selected, symbol])
    setSearch('')
    // Dropdown'u acik birak ki birden fazla secebilsin
  }

  function handleRemove(symbol) {
    onChange(selected.filter((s) => s !== symbol))
  }


  return (
    <div ref={containerRef} className="relative">
      {/* SECILI CHIP'LER */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((sym) => (
            <span
              key={sym}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-sm font-mono"
            >
              {sym}
              <button
                onClick={() => handleRemove(sym)}
                className="ml-1 hover:text-emerald-200 text-emerald-500 leading-none"
                aria-label={`Remove ${sym}`}
              >
                ×
              </button>
            </span>
          ))}

          {selected.length >= maxSelection && (
            <span className="text-xs text-slate-500 self-center ml-2">
              Max {maxSelection} coins
            </span>
          )}
        </div>
      )}


      {/* SEARCH INPUT */}
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={
          selected.length === 0
            ? 'Search for a coin to compare...'
            : selected.length >= maxSelection
            ? `Maximum ${maxSelection} coins selected`
            : 'Add another coin...'
        }
        disabled={selected.length >= maxSelection}
        className="w-full max-w-md px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />


      {/* DROPDOWN */}
      {isOpen && filtered.length > 0 && selected.length < maxSelection && (
        <div className="absolute z-10 mt-1 w-full max-w-md max-h-72 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
          {filtered.map((c) => (
            <button
              key={c.symbol}
              onClick={() => handleSelect(c.symbol)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-700 text-left transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-slate-100">{c.name}</span>
                <span className="text-xs text-slate-500 font-mono">
                  {c.symbol?.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                ${Number(c.current_price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </button>
          ))}
        </div>
      )}


      {/* DROPDOWN BOS */}
      {isOpen && filtered.length === 0 && search && (
        <div className="absolute z-10 mt-1 w-full max-w-md p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-500">
          No coins match "{search}"
        </div>
      )}
    </div>
  )
}