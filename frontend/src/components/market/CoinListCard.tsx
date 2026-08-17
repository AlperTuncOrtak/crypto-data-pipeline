import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const ACCENT_COLORS = {
  orange:  'var(--accent)',
  red:     'var(--negative)',
  blue:    'var(--positive)',
  emerald: 'var(--positive)',
}

export default function CoinListCard({
  title,
  accent = 'orange',
  data,
  isLoading,
  isError,
  renderValue,
}) {
  const titleColor = ACCENT_COLORS[accent] || ACCENT_COLORS.orange
  const navigate = useNavigate()

  return (
    <div
      className="group"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        transform: 'translateZ(0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.01)";
        e.currentTarget.style.borderColor = "var(--accent-border)";
        e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
        const glow = e.currentTarget.querySelector('.feat-bg-glow') as HTMLElement;
        if (glow) { glow.style.transform = "scale(1.5) translate(-10px, 10px)"; glow.style.opacity = "1"; }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.backgroundColor = "var(--bg-card)";
        const glow = e.currentTarget.querySelector('.feat-bg-glow') as HTMLElement;
        if (glow) { glow.style.transform = "scale(1)"; glow.style.opacity = "0"; }
      }}
    >
      <div className="feat-bg-glow" style={{
        position: "absolute", top: -20, right: -20, width: 140, height: 140,
        borderRadius: "50%", background: `radial-gradient(circle, ${titleColor}15 0%, transparent 70%)`,
        filter: "blur(20px)", pointerEvents: "none", zIndex: 0,
        transform: "scale(1)", opacity: 0,
        transition: "all .6s cubic-bezier(0.25, 1, 0.5, 1)",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: titleColor, letterSpacing: '0.08em' }}
      >
        {title}
      </h3>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <div
                className="h-4 rounded animate-pulse"
                style={{ width: '60%', backgroundColor: 'var(--bg-elevated)' }}
              />
              <div
                className="h-4 rounded animate-pulse"
                style={{ width: '20%', backgroundColor: 'var(--bg-elevated)' }}
              />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm" style={{ color: 'var(--negative)' }}>Failed to load</p>
      )}

      {data && data.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data</p>
      )}

      {data && data.length > 0 && (
        <ul className="flex flex-col gap-4 relative z-10" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {data.map((coin, i) => (
            <motion.li
              key={coin.symbol}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ x: 4 }}
              onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
              className="flex items-center justify-between text-sm cursor-pointer transition-all group"
              style={{ padding: '4px 0' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {coin.image_url ? (
                  <img
                    src={coin.image_url}
                    alt={coin.symbol}
                    className="w-6 h-6 rounded-full shrink-0"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-muted)"; }}
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-mono"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                  >
                    {coin.symbol?.slice(0, 1)}
                  </div>
                )}

                <span
                  className="font-mono font-bold transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  {coin.symbol?.toUpperCase()}
                </span>
                <span
                  className="truncate text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {coin.name}
                </span>
              </div>

              <span className="font-mono whitespace-nowrap ml-2 font-semibold">
                {renderValue(coin)}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
      </div>
    </div>
  )
}