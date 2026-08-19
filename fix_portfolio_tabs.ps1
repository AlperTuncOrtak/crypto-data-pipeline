$file = 'frontend/src/pages/Portfolio.tsx'
$c = Get-Content $file -Raw
$c = $c -replace '\["overview", "swap", "history", "analytics", "taxes"\]', '["overview", "swap"]'
Set-Content $file $c
