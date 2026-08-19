$file = 'frontend/src/components/layout/MobileNav.tsx'
$c = Get-Content $file -Raw
$c = $c -replace '\s*\{ path: "/whale".*\},', ''
$c = $c -replace '\s*\{ path: "/timemachine".*\},', ''
Set-Content $file $c
