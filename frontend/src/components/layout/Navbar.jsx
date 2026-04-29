import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, BarChart2, Bell, LineChart, LayoutDashboard, X,
  ChevronDown, TrendingUp, TrendingDown, Activity, Layers,
  History, PlusCircle, Combine, GitCompare, Network,
} from 'lucide-react'
import { useMarket } from '../../hooks/useMarket'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, dropdown: null },
  {
    to: '/market', label: 'Market', Icon: BarChart2,
    dropdown: [
      { to: '/market',           label: 'All Coins',      Icon: Layers,       desc: 'Browse all tracked coins', soon: false },
      { to: '/market?sort=gain', label: 'Top Gainers',    Icon: TrendingUp,   desc: 'Best performers (24h)',    soon: false },
      { to: '/market?sort=loss', label: 'Top Losers',     Icon: TrendingDown, desc: 'Worst performers (24h)',   soon: false },
      { to: '/market?sort=vol',  label: 'Highest Volume', Icon: Activity,     desc: 'Most traded coins',        soon: false },
      { to: '#',                 label: 'Categories',     Icon: Network,      desc: 'DeFi, Layer 1, Memes...',  soon: true  },
    ],
  },
  {
    to: '/alerts', label: 'Alerts', Icon: Bell,
    dropdown: [
      { to: '/alerts', label: 'Active Alerts', Icon: Bell,       desc: 'Current market alerts', soon: false },
      { to: '#',       label: 'Alert History', Icon: History,    desc: 'Past 7 days alerts',    soon: true  },
      { to: '#',       label: 'Create Alert',  Icon: PlusCircle, desc: 'Custom alert rules',    soon: true  },
    ],
  },
  {
    to: '/analysis', label: 'Analysis', Icon: LineChart,
    dropdown: [
      { to: '/analysis', label: 'Compare Coins',       Icon: Combine,    desc: 'Multi-coin performance',  soon: false },
      { to: '#',         label: 'Performance Tracker', Icon: GitCompare, desc: 'Track ROI over time',     soon: true  },
      { to: '#',         label: 'Correlation Matrix',  Icon: Network,    desc: 'Coin price correlations', soon: true  },
    ],
  },
]

function formatLarge(n) {
  const num = Number(n)
  if (isNaN(num)) return '—'
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9)  return `$${(num / 1e9).toFixed(2)}B`
  return `$${num.toFixed(0)}`
}

function NavItem({ item, isActive }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const timerRef = useRef(null)

  function onEnter() { clearTimeout(timerRef.current); setOpen(true) }
  function onLeave() { timerRef.current = setTimeout(() => setOpen(false), 100) }

  const Icon = item.Icon

  return (
    <div
      className="relative"
      onMouseEnter={item.dropdown ? onEnter : undefined}
      onMouseLeave={item.dropdown ? onLeave : undefined}
    >
      <div
        onClick={() => navigate(item.to)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer select-none"
        style={{
          color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          fontWeight: isActive ? '600' : '400',
          backgroundColor: isActive || open ? 'rgba(245,166,35,0.08)' : 'transparent',
        }}
        onMouseEnter={e => {
          if (!isActive && !item.dropdown) {
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.backgroundColor = '#1a1a1a'
          }
        }}
        onMouseLeave={e => {
          if (!isActive && !open) {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <Icon size={15} />
        {item.label}
        {item.dropdown && (
          <ChevronDown
            size={12}
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s ease',
            }}
          />
        )}
      </div>

      {item.dropdown && (
        <div
          className="absolute top-full left-0 rounded-xl overflow-hidden z-50"
          style={{
            backgroundColor: 'rgba(20,20,20,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid #2a2a2a',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,166,35,0.05)',
            minWidth: 320,
            marginTop: 8,
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
            pointerEvents: open ? 'auto' : 'none',
            transition: 'opacity 0.18s ease, transform 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'top left',
          }}
        >
          <div
            style={{
              height: 2,
              background: 'linear-gradient(90deg, #f5a623, transparent)',
            }}
          />
          <div style={{ padding: 6 }}>
            {item.dropdown.map((sub, idx) => {
              const SubIcon = sub.Icon
              return (
                <div
                  key={sub.label}
                  onClick={() => {
                    if (!sub.soon) navigate(sub.to)
                  }}
                  className="flex items-center gap-3 transition-all"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    cursor: sub.soon ? 'not-allowed' : 'pointer',
                    opacity: sub.soon ? 0.45 : 1,
                    animation: open ? `slideIn 0.25s ease ${idx * 0.04}s both` : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!sub.soon) {
                      e.currentTarget.style.backgroundColor = 'rgba(245,166,35,0.08)'
                      const iconWrap = e.currentTarget.querySelector('.icon-wrap')
                      if (iconWrap) iconWrap.style.transform = 'scale(1.08)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    const iconWrap = e.currentTarget.querySelector('.icon-wrap')
                    if (iconWrap) iconWrap.style.transform = 'scale(1)'
                  }}
                >
                  <div
                    className="icon-wrap shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.05))',
                      color: 'var(--accent)',
                      border: '1px solid rgba(245,166,35,0.2)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <SubIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {sub.label}
                      </span>
                      {sub.soon && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: 'rgba(245,166,35,0.15)',
                            color: 'var(--accent)',
                            letterSpacing: '0.1em',
                          }}
                        >
                          Soon
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {sub.desc}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: marketData } = useMarket(100)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)

  const totalVolume = marketData?.reduce((s, c) => s + (Number(c.total_volume) || 0), 0) || 0
  const btcDom = marketData ? (() => {
    const btc = marketData.find(c => c.symbol === 'BTC')
    const total = marketData.reduce((s, c) => s + (Number(c.total_volume) || 0), 0)
    return btc && total ? ((Number(btc.total_volume) / total) * 100).toFixed(1) : '—'
  })() : '—'
  const coinCount = marketData?.length || 0
  const btcPrice = marketData?.find(c => c.symbol === 'BTC')?.current_price

  useEffect(() => {
    if (!search.trim() || !marketData) {
      setSearchResults([])
      return
    }
    const term = search.toLowerCase()
    const results = marketData.filter(c =>
      c.symbol?.toLowerCase().includes(term) ||
      c.name?.toLowerCase().includes(term)
    ).slice(0, 6)
    setSearchResults(results)
  }, [search, marketData])

  return (
    <header style={{ backgroundColor: '#111111', borderBottom: '1px solid #222' }}>

      <div style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div
          className="flex items-center gap-6 text-xs overflow-x-auto"
          style={{
            color: 'var(--text-muted)',
            padding: '8px 24px',
            maxWidth: '1440px',
            margin: '0 auto',
          }}
        >
          <span>Coins: <strong style={{ color: 'var(--text-secondary)' }}>{coinCount}</strong></span>
          <span>24h Volume: <strong style={{ color: 'var(--text-secondary)' }}>{formatLarge(totalVolume)}</strong></span>
          <span>BTC: <strong style={{ color: 'var(--accent)' }}>
            {btcPrice ? `$${Number(btcPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
          </strong></span>
          <span>BTC Dom: <strong style={{ color: 'var(--text-secondary)' }}>{btcDom}%</strong></span>

          <span className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
            <span style={{ color: 'var(--accent)' }}>Live</span>
          </span>
        </div>
      </div>

      <div
        className="flex items-center gap-8"
        style={{
          padding: '0 24px',
          maxWidth: '1440px',
          margin: '0 auto',
        }}
      >
        <div
          className="flex items-center gap-2.5 py-3 cursor-pointer shrink-0"
          onClick={() => navigate('/')}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #f5a623, #e8941a)', color: '#111' }}
          >
            ₿
          </div>
          <div>
            <div className="text-sm font-bold leading-none" style={{ color: '#f0f0f0' }}>CryptoAnalytics</div>
            <div className="text-[10px] leading-none mt-0.5" style={{ color: '#444' }}>Professional Suite</div>
          </div>
        </div>

        <div className="w-px h-6 shrink-0" style={{ backgroundColor: '#222' }} />

        <nav className="flex items-center gap-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            return (
              <NavItem key={item.to} item={item} isActive={isActive} />
            )
          })}
        </nav>

        <div className="ml-auto relative">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{
              backgroundColor: '#1a1a1a',
              border: `1px solid ${searchOpen ? 'rgba(245,166,35,0.4)' : '#2a2a2a'}`,
              width: searchOpen ? 240 : 120,
              transition: 'width 0.2s ease, border-color 0.2s ease',
            }}
          >
            <Search size={13} style={{ color: '#555' }} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => { setSearchOpen(false); setSearch('') }, 150)}
              className="bg-transparent outline-none text-sm w-full"
              style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
            />
            {search && (
              <X size={12} style={{ color: '#555', cursor: 'pointer' }} onClick={() => setSearch('')} />
            )}
          </div>

          {searchResults.length > 0 && (
            <div
              className="absolute top-full mt-1 right-0 rounded-xl overflow-hidden z-50"
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                minWidth: 240,
              }}
            >
              {searchResults.map(coin => (
                <div
                  key={coin.symbol}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid #222' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#222'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => {
                    if (coin.slug) navigate(`/coin/${coin.slug}`)
                    setSearch('')
                    setSearchOpen(false)
                  }}
                >
                  {coin.image_url ? (
                    <img src={coin.image_url} alt={coin.symbol} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: '#2a2a2a', color: 'var(--accent)' }}
                    >
                      {coin.symbol?.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{coin.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{coin.symbol?.toUpperCase()}</div>
                  </div>
                  <div className="ml-auto text-xs font-mono" style={{ color: 'var(--accent)' }}>
                    {coin.current_price ? `$${Number(coin.current_price).toLocaleString(undefined, { maximumFractionDigits: 4 })}` : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}