// Animasyonlu loading placeholder. 
// Kullanim: <Skeleton className="h-4 w-32" />
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-700 rounded ${className}`} />
  )
}

// Tablo satiri skeleton'i - kac kolon oldugunu prop olarak alir
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-t border-slate-700/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// Kart skeleton'i
export function CardSkeleton() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}