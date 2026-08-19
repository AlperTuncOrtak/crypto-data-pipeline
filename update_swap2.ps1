$file = 'frontend/src/pages/Swap.tsx'
$c = Get-Content $file -Raw

# Settings Popover
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] border border-\[var\(--border-base\)\] rounded-\[12px\] p-4 shadow-inner', 'bg-[#09090b]/90 backdrop-blur-3xl border border-white/[0.06] rounded-[12px] p-4 shadow-2xl'
$c = $c -replace 'text-\[12px\] font-medium text-\[var\(--text-muted\)\]', 'text-[12px] font-semibold text-white/40 uppercase tracking-wider'
$c = $c -replace 'text-\[12px\] text-\[var\(--text-main\)\] font-mono', 'text-[12px] text-white font-mono'
$c = $c -replace 'bg-\[var\(--text-main\)\] text-\[var\(--bg-base\)\]', 'bg-white text-black font-semibold'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] border border-\[var\(--border-base\)\] text-\[var\(--text-muted\)\] hover:text-\[var\(--text-main\)\]', 'bg-white/[0.02] border border-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.04]'
$c = $c -replace 'w-\[60px\] bg-\[var\(--bg-elevated\)\] border border-\[var\(--border-base\)\] rounded-\[8px\] py-1.5 px-2 text-\[12px\] text-center text-\[var\(--text-main\)\]', 'w-[60px] bg-white/[0.02] border border-white/[0.04] rounded-[8px] py-1.5 px-2 text-[12px] text-center text-white'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] rounded-\[8px\] border border-\[var\(--border-base\)\]', 'bg-white/[0.02] rounded-[8px] border border-white/[0.04]'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] text-white shadow', 'bg-white/[0.06] text-white shadow'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] text-\[var\(--text-main\)\] shadow', 'bg-white/[0.06] text-white shadow'
$c = $c -replace 'text-\[11px\] font-medium capitalize transition-colors', 'text-[11px] font-semibold tracking-wide uppercase transition-colors'

Set-Content $file $c
