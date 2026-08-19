$file = 'frontend/src/pages/Portfolio.tsx'
$c = Get-Content $file -Raw
$importStr = "import { calcBuyingPower, calcAllocation, calcTax, parseCSV, GuideModal } from '../components/portfolio/PortfolioUtils';
"
$c = $c -replace 'import \{ apiClient \} from "\.\./api/client";', "import { apiClient } from '../api/client';
$importStr"
Set-Content $file $c
