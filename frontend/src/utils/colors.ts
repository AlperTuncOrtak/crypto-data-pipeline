export function getCoinColor(symbol: string): string {
  if (!symbol || typeof symbol !== 'string') return "#00f0ff";
  
  const colors: Record<string, string> = {
    btc: "#F7931A",
    eth: "#627EEA",
    usdt: "#26A17B",
    bnb: "#F3BA2F",
    sol: "#14F195",
    xrp: "#00AAE4",
    usdc: "#2775CA",
    steth: "#627EEA",
    ada: "#0033AD",
    doge: "#C2A633",
    wtrx: "#FF0013",
    trx: "#FF0013",
    ton: "#0098EA",
    shib: "#FFA409",
    avax: "#E84142",
    link: "#2A5ADA",
    dot: "#E6007A",
    matic: "#8247E5",
    pol: "#8247E5",
    wbtc: "#F7931A",
    bch: "#0AC18E",
    ltc: "#345D9D",
    uni: "#FF007A",
    near: "#000000", // Will need a fallback for dark mode, maybe white
    apt: "#111111", 
    icp: "#29ABE2",
    etc: "#3468D1",
    xlm: "#14B6E7",
    atom: "#2E3148",
    arb: "#28A0F0",
    ftm: "#1969FF",
    rndr: "#000000",
  };

  const s = symbol.trim().toLowerCase();
  
  // Return the specific color, or a generic blue/teal neon if not found
  return colors[s] || "#00f0ff";
}
