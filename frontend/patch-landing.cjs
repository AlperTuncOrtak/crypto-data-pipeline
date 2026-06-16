const fs = require('fs');

const file = 'src/pages/Landing.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Ensure useMarket is imported
if (!content.includes('useMarket(')) {
  content = content.replace(
    /import \{ useMarketStats.*?\}/, 
    "import { useMarket, useMarketStats } from '../hooks/useMarket';"
  );
}

// 2. Add useMarket hook to Landing
if (!content.includes('const { data: marketData }')) {
  content = content.replace(
    /const \{ data: stats \} = useMarketStats\(\);/,
    "const { data: stats } = useMarketStats();\n  const { data: marketData } = useMarket(200);"
  );
}

// 3. Pass marketData to DashboardMockup
content = content.replace(
  /<DashboardMockup coinsStr=\{coinsStr\} t=\{t\} \/>/,
  "<DashboardMockup coinsStr={coinsStr} t={t} marketData={marketData} />"
);

// 4. Update DashboardMockup definition
content = content.replace(
  /function DashboardMockup\(\{\s*coinsStr,\s*t\s*\}\s*:\s*\{\s*coinsStr:\s*string,\s*t:\s*any\s*\}\)\s*\{/,
  "function DashboardMockup({ coinsStr, t, marketData }: { coinsStr: string, t: any, marketData?: any[] }) {"
);

// 5. Replace hardcoded coins array with dynamic data inside DashboardMockup
const newCoinsLogic = `
    let coins = [
      { sym: "BTC", price: "$107,412", change: "+2.4%", up: true },
      { sym: "ETH", price: "$3,891", change: "+1.8%", up: true },
    ];
    let mcapStr = "$3.42T";
    let btcDomStr = "54.2%";
    
    if (marketData && marketData.length >= 2) {
      const btc = marketData.find(c => c.symbol?.toLowerCase() === 'btc') || marketData[0];
      const eth = marketData.find(c => c.symbol?.toLowerCase() === 'eth') || marketData[1];
      
      const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
      
      coins = [
        { 
          sym: btc.symbol?.toUpperCase(), 
          price: formatCurrency(btc.current_price), 
          change: (btc.price_change_percentage_24h > 0 ? "+" : "") + Number(btc.price_change_percentage_24h).toFixed(1) + "%", 
          up: btc.price_change_percentage_24h >= 0 
        },
        { 
          sym: eth.symbol?.toUpperCase(), 
          price: formatCurrency(eth.current_price), 
          change: (eth.price_change_percentage_24h > 0 ? "+" : "") + Number(eth.price_change_percentage_24h).toFixed(1) + "%", 
          up: eth.price_change_percentage_24h >= 0 
        }
      ];

      // Rough approximation of top 200 market cap
      const totalMcap = marketData.reduce((sum, c) => sum + (Number(c.market_cap) || 0), 0);
      if (totalMcap > 0) {
        mcapStr = "$" + (totalMcap / 1e12).toFixed(2) + "T";
        const btcDom = ((Number(btc.market_cap) || 0) / totalMcap) * 100;
        btcDomStr = btcDom.toFixed(1) + "%";
      }
    }
`;

content = content.replace(
  /const coins = \[\s*\{\s*sym: "BTC"[\s\S]*?\}\s*\];/,
  newCoinsLogic
);

// 6. Replace marketCap and BTC dom hardcoded strings
content = content.replace(/\{ l: "Market Cap", v: "\$3\.42T" \}/, '{ l: "Market Cap", v: mcapStr }');
content = content.replace(/\{ l: "BTC Dom", v: "54\.2%" \}/, '{ l: "BTC Dom", v: btcDomStr }');

fs.writeFileSync(file, content, 'utf8');
console.log("Replaced DashboardMockup successfully");
