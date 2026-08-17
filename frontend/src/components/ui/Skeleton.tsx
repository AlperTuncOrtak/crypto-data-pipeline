// Animasyonlu loading placeholder. 
// Kullanim: <Skeleton className="h-4 w-32" />
export function Skeleton({ className = '', style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div className={`animate-pulse bg-white/[0.05] rounded ${className}`} style={style} />
  )
}

// Tablo satiri skeleton'i - kac kolon oldugunu prop olarak alir
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-t border-white/[0.05]">
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
    <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-[20px] p-5 space-y-3 shadow-2xl">
      <Skeleton className="h-4 w-24 mb-4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center py-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col justify-end gap-2 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl">
      <div className="flex items-end justify-between w-full h-[200px] gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="w-full bg-[var(--accent)]/10 rounded-t-sm" 
            style={{ height: `${Math.random() * 60 + 20}%` }} 
          />
        ))}
      </div>
      <div className="flex justify-between mt-4 border-t border-[var(--border-subtle)] pt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}