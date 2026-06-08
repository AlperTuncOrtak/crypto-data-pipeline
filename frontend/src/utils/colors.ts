export function getCoinColor(symbol: string | undefined): string {
  if (!symbol) return "var(--text-primary)";
  const s = symbol.toUpperCase();
  switch (s) {
    case "BTC": return "#F7931A";
    case "ETH": return "#627EEA";
    case "SOL": return "#14F195";
    case "BNB": return "#F3BA2F";
    case "XRP": return "#23292F";
    case "ADA": return "#0033AD";
    case "DOGE": return "#C2A633";
    case "AVAX": return "#E84142";
    case "DOT": return "#E6007A";
    case "LINK": return "#2A5ADA";
    case "MATIC": return "#8247E5";
    case "UNI": return "#FF007A";
    case "LTC": return "#345D9D";
    case "TRX": return "#FF0013";
    case "ATOM": return "#2E3148";
    case "XLM": return "#08B5E5";
    case "XMR": return "#FF6600";
    case "ALGO": return "#000000";
    case "NEAR": return "#000000";
    case "APT": return "#131615";
    case "OP": return "#FF0420";
    case "ARB": return "#28A0F0";
    case "SHIB": return "#E00613";
    case "BCH": return "#8DC351";
    case "TON": return "#0098EA";
    case "SUI": return "#4A8BFE";
    case "SEI": return "#E33F2B";
    case "INJ": return "#00E6ED";
    case "TIA": return "#7B2BF9";
    case "RNDR": return "#A42823";
    default: return "var(--text-primary)";
  }
}
