$file = 'frontend/src/components/portfolio/DashboardCards.tsx'
$c = Get-Content $file -Raw
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] border border-\[var\(--border-subtle\)\]', 'bg-[#09090b]/40 border border-white/[0.04] backdrop-blur-xl'
$c = $c -replace 'border-t border-\[var\(--border-subtle\)\]', 'border-t border-white/[0.04]'
$c = $c -replace 'text-\[var\(--text-muted\)\]', 'text-white/40'
$c = $c -replace 'text-\[var\(--text-main\)\]', 'text-white'
$c = $c -replace 'text-\[var\(--positive\)\]', 'text-emerald-400'
$c = $c -replace 'text-\[var\(--negative\)\]', 'text-rose-400'
$c = $c -replace 'bg-\[var\(--bg-subtle\)\] hover:bg-\[var\(--bg-elevated\)\]', 'bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04]'
$c = $c -replace 'bg-\[var\(--accent\)\] text-white hover:bg-\[var\(--accent-hover\)\]', 'bg-white text-black hover:bg-white/90'
Set-Content $file $c
