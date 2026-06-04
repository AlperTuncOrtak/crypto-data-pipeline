// ============================================================
// components/alerts/AlertCard.jsx
// ============================================================
// Tek bir alert'i gosteren kart. Severity'ye gore renk degisir:
//  - High   -> kirmizi (Sharp Drop)
//  - Medium -> amber/sari (Strong Increase)
//  - Low    -> mavi (Rapid Movement)
//
// Alert type'i da pill olarak gosterilir.
// ============================================================


// Severity'ye gore kart temasi
const SEVERITY_STYLES = {
  High: {
    border: 'border-red-500/40',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/20 text-red-400',
    icon: '🔻',
  },
  Medium: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/20 text-amber-400',
    icon: '🚀',
  },
  Low: {
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/5',
    badge: 'bg-blue-500/20 text-blue-400',
    icon: '⚡',
  },
}


export default function AlertCard({ alert }) {
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.Low

  return (
    <div className={`border ${style.border} ${style.bg} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        {/* ICON */}
        <div className="text-2xl leading-none mt-0.5">{style.icon}</div>

        {/* BODY */}
        <div className="flex-1 min-w-0">
          {/* TYPE + SEVERITY */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${style.badge}`}>
              {alert.type}
            </span>
            <span className="text-xs text-slate-500">
              {alert.severity}
            </span>
          </div>

          {/* SYMBOL */}
          <div className="font-mono font-bold text-slate-100 text-lg">
            {alert.symbol?.toUpperCase()}
          </div>

          {/* MESSAGE */}
          <p className="text-sm text-slate-300 mt-1">
            {alert.message}
          </p>
        </div>
      </div>
    </div>
  )
}