import { X, Star, TrendingUp, TrendingDown, Trash2, Bell, BarChart2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function formatPrice(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (num >= 1)    return `$${num.toFixed(2)}`
  if (num >= 0.01) return `$${num.toFixed(4)}`
  if (num >= 0.0001) return `$${num.toFixed(6)}`
  return `<$0.000001`
}

const PANELS = [
  { key: 'watchlist', Icon: Star,     label: 'Watchlist' },
  { key: 'alerts',   Icon: Bell,     label: 'Alerts' },
  { key: 'portfolio',Icon: BarChart2, label: 'Portfolio', soon: true },
]

function WatchlistPanel({ watchlist, removeFromWatchlist, marketData, onClose }) {
  const navigate = useNavigate()

  const watchedCoins = watchlist
    .map(symbol => marketData?.find(c => c.symbol === symbol))
    .filter(Boolean)

  return (
    <>
      <div style={{ padding: '20px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-2">
          <Star size={15} style={{ color: 'var(--accent)' }} fill="var(--accent)" />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Watchlist</span>
          {watchlist.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-mono" style={{ backgroundColor: 'rgba(245,166,35,0.15)', color: 'var(--accent)' }}>
              {watchlist.length}
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Star size={28} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.3 }} />
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Watchlist is empty</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click the star icon on any coin to add it</div>
          </div>
        ) : watchedCoins.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading market data...</div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {watchedCoins.map(coin => {
              const change = Number(coin.price_change_percentage_24h)
              const isUp = change >= 0
              return (
                <div
                  key={coin.symbol}
                  className="flex items-center gap-3 rounded-xl transition-all"
                  style={{ padding: '10px 12px' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div
                    onClick={() => { if (coin.slug) { navigate(`/coin/${coin.slug}`); onClose() } }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                  >
                    {coin.image_url ? (
                      <img src={coin.image_url} alt={coin.symbol} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        backgroundColor: 'var(--bg-elevated)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                      }}>
                        {coin.symbol?.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold font-mono" style={{ color: 'var(--accent)' }}>
                        {coin.symbol?.toUpperCase()}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{coin.name}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <div className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatPrice(coin.current_price)}
                    </div>
                    <div className="text-xs font-mono flex items-center justify-end gap-0.5" style={{ color: isUp ? 'var(--positive)' : 'var(--negative)' }}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isUp ? '+' : ''}{change.toFixed(2)}%
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromWatchlist(coin.symbol)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--negative)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {watchlist.length > 0 && (
        <div style={{ padding: '16px', borderTop: '1px solid #1e1e1e' }}>
          <button
            onClick={() => { if (window.confirm('Clear all watchlist items?')) watchlist.forEach(s => removeFromWatchlist(s)) }}
            className="flex items-center gap-2 text-xs w-full justify-center py-2 rounded-lg transition-all"
            style={{ backgroundColor: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', color: 'var(--negative)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(231,76,60,0.15)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(231,76,60,0.08)'}
          >
            <Trash2 size={12} /> Clear All
          </button>
        </div>
      )}
    </>
  )
}

function AlertsPanel() {
  return (
    <>
      <div style={{ padding: '20px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bell size={15} style={{ color: 'var(--accent)' }} />
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Quick Alerts</span>
      </div>
      <div className="flex flex-col items-center justify-center" style={{ padding: '48px 24px', textAlign: 'center', flex: 1 }}>
        <Bell size={28} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.3 }} />
        <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Coming Soon</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Custom price alerts will appear here</div>
      </div>
    </>
  )
}

export default function RightSidebar({ isOpen, activePanel, onClose, onPanelChange, watchlist, removeFromWatchlist, marketData }) {
  return (
    <>
      {/* FIXED ICON BAR */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 45,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '8px 6px',
          backgroundColor: '#111111',
          border: '1px solid #222',
          borderRight: 'none',
          borderRadius: '12px 0 0 12px',
        }}
      >
        {PANELS.map(({ key, Icon, label, soon }) => {
          const isActive = isOpen && activePanel === key
          return (
            <div key={key} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  if (soon) return
                  if (isActive) onClose()
                  else onPanelChange(key)
                }}
                title={soon ? `${label} (Coming Soon)` : label}
                style={{
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, border: 'none', cursor: soon ? 'not-allowed' : 'pointer',
                  backgroundColor: isActive ? 'rgba(245,166,35,0.15)' : 'transparent',
                  color: isActive ? 'var(--accent)' : soon ? '#333' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!soon && !isActive) e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { if (!soon && !isActive) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <Icon size={16} fill={key === 'watchlist' && watchlist?.length > 0 ? 'var(--accent)' : 'none'} />
                {key === 'watchlist' && watchlist?.length > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: 'var(--accent)', border: '1px solid #111',
                  }} />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* PANEL */}
      <div
        style={{
          position: 'fixed', top: 0, right: 44, bottom: 0,
          width: 320, zIndex: 50,
          backgroundColor: '#111111',
          borderLeft: '1px solid #222',
          transform: isOpen ? 'translateX(0)' : 'translateX(calc(100% + 44px))',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* PANEL HEADER CLOSE */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={16} />
        </button>

        {activePanel === 'watchlist' && (
          <WatchlistPanel
            watchlist={watchlist}
            removeFromWatchlist={removeFromWatchlist}
            marketData={marketData}
            onClose={onClose}
          />
        )}
        {activePanel === 'alerts' && <AlertsPanel />}
      </div>
    </>
  )
}