$file = 'frontend/src/components/layout/GlobalSidebar.tsx'
$c = Get-Content $file -Raw
$c = $c -replace "\s*\{ name: 'AI Analysis', path: '/analysis', icon: Brain \},", ""
$c = $c -replace "\s*\{ name: 'Whale X-Ray', path: '/whale', icon: Activity \},", ""
Set-Content $file $c
