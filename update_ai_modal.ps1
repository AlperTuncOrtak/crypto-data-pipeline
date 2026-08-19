$file = 'frontend/src/components/portfolio/AIRebalanceModal.tsx'
$c = Get-Content $file -Raw
$c = $c -replace 'bg-\[var\(--bg-base\)\] border border-\[var\(--positive\)\]/20', 'bg-[#09090b]/90 backdrop-blur-3xl border border-white/[0.04]'
$c = $c -replace 'border-b border-\[var\(--border-subtle\)\] bg-\[var\(--bg-elevated\)\]', 'border-b border-white/[0.04] bg-[#09090b]/40'
$c = $c -replace 'text-\[var\(--text-main\)\]', 'text-white'
$c = $c -replace 'text-\[var\(--text-muted\)\]', 'text-white/40'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\]/50', 'bg-white/[0.02]'
$c = $c -replace 'text-\[var\(--accent\)\]', 'text-emerald-400'
$c = $c -replace 'border-\[var\(--border-subtle\)\] bg-\[var\(--bg-elevated\)\]', 'border-white/[0.04] bg-[#09090b]/40'
$c = $c -replace 'bg-\[var\(--positive\)\]/10 text-\[var\(--positive\)\]', 'bg-emerald-400/10 text-emerald-400'
$c = $c -replace 'hover:bg-\[var\(--bg-elevated\)\]', 'hover:bg-white/[0.04]'
$c = $c -replace 'bg-\[var\(--positive\)\] text-\[var\(--bg-base\)\] hover:opacity-90', 'bg-white text-black hover:bg-white/90'
Set-Content $file $c
