import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMarket } from '../hooks/useMarket'
import { useMultiCoinCorrelation } from '../hooks/useAnalysis'
import { Network, X, Search } from 'lucide-react'

const CHART_COLORS = ['#2ecc71', '#3498db', 'var(--accent)', '#e91e8c', '#9b59b6']

const TIME_RANGES = [
  { label: '1H',  hours: 1   },
  { label: '24H', hours: 24  },
  { label: '7D',  hours: 168 },
  { label: '30D', hours: 720 },
]

function formatPrice(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (num >= 1)    return `$${num.toFixed(2)}`
  if (num >= 0.01) return `$${num.toFixed(4)}`
  return `$${num.toFixed(6)}`
}

function getCorrelationColor(corr) {
  if (corr === 1) return 'var(--border)'
  if (corr > 0) {
    return `rgba(46, 204, 113, ${Math.min(corr * 0.8 + 0.2, 1)})`
  } else if (corr < 0) {
    return `rgba(231, 76, 60, ${Math.min(Math.abs(corr) * 0.8 + 0.2, 1)})`
  }
  return 'var(--border-soft)'
}

function CoinSearchDropdown({ allCoins, selected, onAdd }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const filtered = search.trim()
    ? allCoins.filter(c =>
        c.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : []

  return (
    <div className="relative" style={{ width: 280 }}>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{
        backgroundColor: 'var(--bg-elevated)',
        border: `1px solid ${open ? 'rgba(245,166,35,0.4)' : 'var(--border)'}`,
        transition: 'border-color 0.2s',
      }}>
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder={t("correlation.search_placeholder")}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="bg-transparent outline-none text-sm w-full"
          style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-50" style={{
          backgroundColor: '#1a1a1a', border: '1px solid var(--border)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          {filtered.map(coin => {
            const isSelected = selected.includes(coin.symbol)
            return (
              <div
                key={coin.symbol}
                onClick={() => { if (!isSelected && selected.length < 5) { onAdd(coin.symbol); setSearch(''); setOpen(false) } }}
                className="flex items-center gap-3 px-4 py-3 transition-all"
                style={{ opacity: isSelected ? 0.4 : 1, cursor: isSelected ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {coin.image_url
                  ? <img src={coin.image_url} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                  : <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{coin.symbol?.slice(0,1)}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{coin.name}</div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{coin.symbol?.toUpperCase()}</div>
                </div>
                <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatPrice(coin.current_price)}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Correlation() {
  const { t } = useTranslation()
  const { data: allCoins } = useMarket(2000)
  const [selected, setSelected] = useState([])
  const [activeRange, setActiveRange] = useState(1)  // index into TIME_RANGES
  const hours = TIME_RANGES[activeRange].hours

  const correlation = useMultiCoinCorrelation(selected, hours)

  function addCoin(symbol) {
    if (!selected.includes(symbol) && selected.length < 5) setSelected(prev => [...prev, symbol])
  }
  function removeCoin(symbol) {
    setSelected(prev => prev.filter(s => s !== symbol))
  }

  const coinData = useMemo(() => {
    if (!allCoins) return {}
    return Object.fromEntries(allCoins.map(c => [c.symbol, c]))
  }, [allCoins])

  return (
    <div style={{ color: 'var(--text-primary)', maxWidth: 1100, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <div className="flex items-center gap-3 mb-2">
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,158,11,0.05))',
            border: '1px solid rgba(245,166,35,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Network size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("correlation.title")}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {t("correlation.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* COIN SEÇİCİ */}
      <div className="rounded-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '20px', marginBottom: 24 }}>
        <div className="flex items-center gap-3 flex-wrap">
          <CoinSearchDropdown allCoins={allCoins || []} selected={selected} onAdd={addCoin} />
          {selected.map((sym, i) => {
            const coin = coinData[sym]
            return (
              <div key={sym} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{
                backgroundColor: `${CHART_COLORS[i]}15`,
                border: `1px solid ${CHART_COLORS[i]}40`,
              }}>
                {coin?.image_url && <img src={coin.image_url} style={{ width: 20, height: 20, borderRadius: '50%' }} />}
                <span className="text-sm font-bold font-mono" style={{ color: CHART_COLORS[i] }}>{sym}</span>
                <button onClick={() => removeCoin(sym)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: CHART_COLORS[i], display: 'flex', padding: 0, opacity: 0.7 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
          {selected.length === 0 && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t("correlation.select_prompt")}</span>}
          {selected.length === 5 && <span className="text-xs" style={{ color: 'var(--accent)' }}>{t("correlation.max_coins")}</span>}
        </div>
      </div>

      {/* EMPTY STATE */}
      {selected.length < 2 && (
        <div className="flex flex-col items-center justify-center rounded-2xl" style={{
          backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
          padding: '64px 24px', textAlign: 'center',
        }}>
          <Network size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
          <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {selected.length === 0 ? t("correlation.empty_state_1") : t("correlation.empty_state_2")}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t("correlation.empty_state_desc")}</div>
        </div>
      )}

      {selected.length >= 2 && (
        <div className="flex flex-col gap-4">
          
          {/* MATRIX AND TIME RANGE */}
          <div className="rounded-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '24px' }}>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <div className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{t("correlation.heatmap_title")}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6, marginTop: 2 }}>{t("correlation.heatmap_subtitle")}</div>
              </div>
              
              <div className="flex items-center gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                {TIME_RANGES.map((range, idx) => (
                  <button
                    key={range.label}
                    onClick={() => setActiveRange(idx)}
                    style={{
                      padding: '4px 12px', borderRadius: 8, border: 'none',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      backgroundColor: activeRange === idx ? 'var(--accent)' : 'transparent',
                      color: activeRange === idx ? '#111' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {correlation.isLoading ? (
              <div className="flex items-center justify-center" style={{ height: 200 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t("correlation.calculating")}</div>
              </div>
            ) : correlation.data && correlation.data.length > 0 ? (
              <div style={{ overflowX: 'auto', display: 'flex', paddingBottom: 16 }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: 6 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 8, width: 60 }}></th>
                      {selected.map(sym => (
                        <th key={sym} style={{ padding: '8px', textAlign: 'center', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)', width: 100 }}>{sym}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.map(rowSym => (
                      <tr key={rowSym}>
                        <th style={{ padding: '8px', textAlign: 'right', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)', width: 60, paddingRight: 16 }}>{rowSym}</th>
                        {selected.map(colSym => {
                          const match = correlation.data.find(d => d.symbol_a === rowSym && d.symbol_b === colSym)
                          const val = match ? match.correlation : 0
                          const isSelf = rowSym === colSym
                          return (
                            <td 
                              key={colSym}
                              title={`${rowSym} vs ${colSym}: ${val.toFixed(2)}`}
                              style={{ 
                                backgroundColor: getCorrelationColor(val),
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                borderRadius: 12,
                                width: 100,
                                height: 100,
                                fontSize: 15,
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: isSelf ? 'var(--text-muted)' : '#fff',
                                cursor: 'help',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                border: isSelf ? '1px solid var(--border)' : 'none',
                                position: 'relative'
                              }}
                              onMouseEnter={e => { if (!isSelf) { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.zIndex = 10; } }}
                              onMouseLeave={e => { if (!isSelf) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = 1; } }}
                            >
                              {val.toFixed(2)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center" style={{ height: 200 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t("correlation.not_enough_data")}</div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
