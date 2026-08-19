$file = 'frontend/src/pages/Portfolio.tsx'
$c = Get-Content $file -Raw

# Header / Subheader
$c = $c -replace 'text-4xl md:text-5xl font-black text-\[var\(--text-main\)\] tracking-tight', 'text-4xl md:text-5xl font-bold text-white tracking-tight'
$c = $c -replace 'text-\[var\(--text-muted\)\] text-\[15px\] font-medium max-w-xl', 'text-white/40 text-[15px] font-medium max-w-xl'

# Buttons
$c = $c -replace 'bg-\[var\(--bg-subtle\)\] hover:bg-\[var\(--bg-elevated\)\] text-\[var\(--text-main\)\] border border-\[var\(--border-subtle\)\] hover:border-\[var\(--border-base\)\]', 'bg-[#09090b]/40 hover:bg-white/[0.02] text-white border border-white/[0.04] hover:border-white/[0.08]'
$c = $c -replace 'bg-\[var\(--accent\)\] hover:bg-\[var\(--accent-hover\)\] text-white', 'bg-white hover:bg-white/90 text-black'
$c = $c -replace 'shadow-md shadow-\[var\(--accent\)\]/20', 'shadow-sm'

# Tabs Container
$c = $c -replace 'bg-\[var\(--bg-base\)\]/50 border border-\[var\(--border-subtle\)\] rounded-2xl w-fit backdrop-blur-md', 'bg-[#09090b]/40 border border-white/[0.04] rounded-2xl w-fit backdrop-blur-xl'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] text-\[var\(--text-main\)\] shadow-sm border border-\[var\(--border-base\)\]', 'bg-white/[0.04] text-white shadow-sm border border-white/[0.04]'
$c = $c -replace 'text-\[var\(--text-muted\)\] hover:text-\[var\(--text-main\)\] hover:bg-\[var\(--bg-elevated\)\] border border-transparent', 'text-white/40 hover:text-white hover:bg-white/[0.02] border border-transparent'

# Overview Tab Titles
$c = $c -replace 'border-b border-\[var\(--border-subtle\)\]', 'border-b border-white/[0.04]'
$c = $c -replace 'text-xl font-bold text-\[var\(--text-main\)\] mb-1', 'text-xl font-semibold text-white mb-1'
$c = $c -replace 'text-\[13px\] text-\[var\(--text-muted\)\]', 'text-[13px] text-white/40'

# Timeframe Buttons
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] rounded-2xl p-1 border border-\[var\(--border-subtle\)\] mt-4 md:mt-0', 'bg-[#09090b]/60 rounded-2xl p-1 border border-white/[0.04] mt-4 md:mt-0 backdrop-blur-xl'
$c = $c -replace 'bg-\[var\(--bg-elevated\)\] text-\[var\(--text-main\)\] shadow', 'bg-white/[0.04] text-white shadow'
$c = $c -replace 'text-\[var\(--text-muted\)\] hover:text-\[var\(--text-main\)\]', 'text-white/40 hover:text-white'

# Backgrounds
$c = $c -replace 'min-h-screen bg-\[var\(--bg-base\)\] pt-24 pb-32', 'min-h-screen bg-[#09090b] pt-24 pb-32'
$c = $c -replace 'bg-\[var\(--accent\)\]/5', 'bg-white/[0.02]'

Set-Content $file $c
