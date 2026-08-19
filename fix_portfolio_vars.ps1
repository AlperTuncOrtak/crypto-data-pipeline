$file = 'frontend/src/pages/Portfolio.tsx'
$c = Get-Content $file -Raw
$c = $c -replace 'const totalPnl = totalValue - totalCost;', "const totalPnl = totalValue - totalCost;
  const change24hValue = holdings.reduce((sum, h) => sum + (((h.value || 0) * (h.change_24h || 0)) / 100), 0);
  const change24hPct = totalValue > 0 ? (change24hValue / (totalValue - change24hValue)) * 100 : 0;"
$c = $c -replace 'totalPnl=\{totalPnl\}', 'change24hValue={change24hValue}'
$c = $c -replace 'totalCost=\{totalCost\}', 'change24hPct={change24hPct}'
Set-Content $file $c
