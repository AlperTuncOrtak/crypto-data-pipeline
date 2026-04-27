// ============================================================
// pages/Alerts.jsx
// ============================================================
// Tum aktif alert'leri listeler. Severity'ye gore sirali gelir
// (backend zaten sortlayip yolluyor). Her alert bir AlertCard
// olarak render edilir.
//
// Ust kisimda severity'ye gore ozet sayilar var - hizlica
// "kac tane High alert var" gorunsun diye.
// ============================================================

import { useAlerts } from '../hooks/useAlerts'
import AlertCard from '../components/alerts/AlertCard'


export default function Alerts() {
  const { data, isLoading, isError, error } = useAlerts()


  // Severity bazinda sayim yapalim - summary kartlari icin
  const summary = {
    High: 0,
    Medium: 0,
    Low: 0,
  }
  if (data) {
    data.forEach((a) => {
      if (summary[a.severity] !== undefined) summary[a.severity]++
    })
  }


  return (
    <div>
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Alerts</h1>
        <p className="text-slate-400 mt-1">
          Real-time market alerts — auto-refreshes every 30 seconds
        </p>
      </div>


      {/* SUMMARY CARDS */}
      {data && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 border border-red-500/20 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wider text-red-400 mb-1">
              High Severity
            </div>
            <div className="text-3xl font-bold text-slate-100">
              {summary.High}
            </div>
          </div>

          <div className="bg-slate-800 border border-amber-500/20 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wider text-amber-400 mb-1">
              Medium Severity
            </div>
            <div className="text-3xl font-bold text-slate-100">
              {summary.Medium}
            </div>
          </div>

          <div className="bg-slate-800 border border-blue-500/20 rounded-lg p-4">
            <div className="text-xs uppercase tracking-wider text-blue-400 mb-1">
              Low Severity
            </div>
            <div className="text-3xl font-bold text-slate-100">
              {summary.Low}
            </div>
          </div>
        </div>
      )}


      {/* LOADING */}
      {isLoading && (
        <div className="text-slate-400">Loading alerts...</div>
      )}


      {/* ERROR */}
      {isError && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          <p className="font-semibold">Failed to load alerts</p>
          <p className="text-sm mt-1 opacity-80">{error.message}</p>
        </div>
      )}


      {/* EMPTY */}
      {data && data.length === 0 && (
        <div className="p-8 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-center">
          <div className="text-4xl mb-2">😌</div>
          <p>No active alerts. The market is calm right now.</p>
        </div>
      )}


      {/* ALERT LIST */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((alert, idx) => (
            <AlertCard
              key={`${alert.symbol}-${alert.type}-${idx}`}
              alert={alert}
            />
          ))}
        </div>
      )}
    </div>
  )
}