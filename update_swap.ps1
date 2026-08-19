$file = 'frontend/src/pages/Swap.tsx'
$c = Get-Content $file -Raw

# Card Wrapper
$c = $c -replace 'bg-gradient-to-b from-\[var\(--bg-subtle\)\] to-\[var\(--bg-base\)\] border border-\[var\(--border-base\)\] p-2 shadow-2xl', 'bg-[#09090b]/60 backdrop-blur-xl border border-white/[0.04] p-2 shadow-2xl'

# AI Input
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] border border-\[var\(--border-base\)\] rounded-\[16px\] flex items-center p-3 relative overflow-hidden group focus-within:border-\[var\(--accent\)\]', 'bg-white/[0.02] border border-white/[0.04] rounded-[16px] flex items-center p-3 relative overflow-hidden group focus-within:border-white/[0.12]'
$c = $c -replace 'text-\[var\(--text-muted\)\] group-focus-within:text-\[var\(--accent\)\]', 'text-white/30 group-focus-within:text-white'
$c = $c -replace 'text-\[var\(--text-main\)\] text-\[14px\] px-3 placeholder:text-\[var\(--text-muted\)\]', 'text-white text-[14px] px-3 placeholder:text-white/30'
$c = $c -replace 'bg-\[var\(--accent\)\]/10 text-\[var\(--accent\)\] rounded-\[6px\] hover:bg-\[var\(--accent\)\]/20', 'bg-white/[0.04] text-white rounded-[6px] hover:bg-white/[0.08]'

# Header & Chart Toggle
$c = $c -replace 'text-\[var\(--text-main\)\] font-semibold text-\[16px\] tracking-tight', 'text-white font-semibold text-[16px] tracking-tight'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] text-\[var\(--text-muted\)\] hover:text-\[var\(--text-main\)\]', 'bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04]'
$c = $c -replace 'hover:bg-\[var\(--bg-elevated\)\] text-\[var\(--text-muted\)\] hover:text-\[var\(--text-main\)\]', 'text-white/40 hover:text-white hover:bg-white/[0.04]'

# Main Inputs Background
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] rounded-\[20px\] p-5 transition-all hover:bg-\[var\(--bg-elevated\)\]', 'bg-[#09090b]/40 border border-white/[0.04] rounded-[20px] p-5 transition-all hover:border-white/[0.08]'
$c = $c -replace 'text-\[var\(--text-muted\)\]', 'text-white/40'
$c = $c -replace 'text-\[var\(--text-main\)\]', 'text-white'
$c = $c -replace 'placeholder:text-\[var\(--text-faint\)\]', 'placeholder:text-white/20'

# Token Selector Button
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] hover:bg-\[var\(--bg-elevated\)\] px-4 py-2 rounded-full transition-colors border border-\[var\(--border-base\)\] group-hover:border-\[var\(--border-base\)\]', 'bg-white/[0.02] hover:bg-white/[0.04] px-4 py-2 rounded-full transition-colors border border-white/[0.06] hover:border-white/[0.12]'

# Switch Button
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] border-\[4px\] border-\[var\(--bg-base\)\] rounded-\[12px\] hover:bg-\[var\(--bg-elevated\)\] hover:text-\[var\(--text-main\)\] transition-all text-\[var\(--text-muted\)\]', 'bg-[#09090b] border-[4px] border-[#09090b] rounded-[12px] hover:bg-white/[0.04] hover:text-white transition-all text-white/40 shadow-sm'

# Action Button
$c = $c -replace 'bg-\[var\(--accent\)\] text-white hover:bg-\[var\(--accent-hover\)\]', 'bg-white text-black hover:bg-white/90'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] text-\[var\(--text-muted\)\] cursor-not-allowed', 'bg-white/[0.02] text-white/30 cursor-not-allowed border border-white/[0.04]'

# Token Modal
$c = $c -replace 'bg-\[var\(--bg-base\)\] flex flex-col rounded-\[24px\] overflow-hidden', 'bg-[#09090b]/95 backdrop-blur-3xl flex flex-col rounded-[24px] overflow-hidden border border-white/[0.06]'
$c = $c -replace 'border-b border-\[var\(--border-base\)\]', 'border-b border-white/[0.04]'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] border border-\[var\(--border-base\)\] rounded-\[12px\] pl-10', 'bg-white/[0.02] border border-white/[0.06] rounded-[12px] pl-10'

# AI Widget
$c = $c -replace 'bg-\[var\(--bg-base\)\] border border-\[var\(--border-base\)\] rounded-\[16px\] p-5 shadow-lg', 'bg-[#09090b]/60 backdrop-blur-xl border border-white/[0.04] rounded-[16px] p-5 shadow-2xl'
$c = $c -replace 'bg-\[var\(--bg-subtle\)\] border border-\[var\(--border-base\)\]', 'bg-[#09090b]/40 border border-white/[0.04]'

Set-Content $file $c
