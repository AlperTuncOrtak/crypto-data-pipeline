$file = 'frontend/src/pages/Swap.tsx'
$c = Get-Content $file -Raw
$c = $c -replace 'text-\[11px\] text-\[var\(--text-muted\)\] font-medium', 'text-[11px] text-white/40 font-semibold tracking-wider uppercase'
$c = $c -replace 'text-\[11px\] text-\[var\(--positive\)\]', 'text-[11px] text-emerald-400 font-mono font-semibold'
$c = $c -replace 'bg-\[var\(--bg-subtle\)\] border border-\[var\(--border-base\)\] p-2 flex flex-col', 'bg-[#09090b]/40 border border-white/[0.04] p-2 flex flex-col'
Set-Content $file $c
