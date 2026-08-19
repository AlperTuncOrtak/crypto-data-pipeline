$file = 'frontend/src/components/portfolio/ChartAndWatchlist.tsx'
$c = Get-Content $file -Raw
$c = $c -replace 'bg-\[var\(--bg-base\)\]/80 backdrop-blur-xl border border-\[var\(--border-subtle\)\]', 'bg-[#09090b]/40 backdrop-blur-xl border border-white/[0.04]'
$c = $c -replace 'text-\[var\(--text-main\)\]', 'text-white'
$c = $c -replace 'text-\[var\(--text-muted\)\]', 'text-white/40'
$c = $c -replace 'text-\[var\(--positive\)\]', 'text-emerald-400'
$c = $c -replace 'bg-\[var\(--positive\)\]', 'bg-emerald-400'
$c = $c -replace 'text-\[var\(--negative\)\]', 'text-rose-400'
$c = $c -replace 'border-\[var\(--border-subtle\)\]', 'border-white/[0.04]'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\]/30', 'bg-white/[0.02]'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\]', 'bg-white/[0.02]'
$c = $c -replace 'hover:border-\[var\(--border-base\)\]', 'hover:border-white/[0.08]'
Set-Content $file $c
