import React from "react";

// ── Formatters ────────────────────────────────────────────────
export const fmtUSD = (n: any) => {
  const v = Number(n);
  if (isNaN(v)) return "—";
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
};

export const fmtPct = (n: any) => {
  const num = Number(n);
  return `${num >= 0 ? "▲" : "▼"} ${Math.abs(num).toFixed(2)}%`;
};

export const fmtNum = (n: any) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 });

// ── Colors ───────────────────────────────────────────────────
export const COIN_COLORS: Record<string, string> = {
  BTC: "#F7931A",
  USDT: "#26A17B",
  ETH: "#627EEA",
  SOL: "#14F195",
  BNB: "#F3BA2F",
  XRP: "#23292F",
  DOGE: "#C2A633",
  ADA: "#0033AD",
  LINK: "#2A5ADA",
  AVAX: "#E84142",
  DOT: "#E6007A",
  MATIC: "#8247E5",
  SHIB: "#E23D19",
  TRX: "#FF0013",
  LTC: "#345D9D",
  UNI: "#FF007A",
  ATOM: "#2E3148",
  XLM: "#14B6E7",
  BCH: "#8DC351",
  ALGO: "#000000",
  VET: "#15BDFF",
  ICP: "#29ABE2",
  FIL: "#0090FF"
};

export const CHART_COLORS = [
  "var(--accent)", // Neon Cyan
  "#2dd4bf", // Teal
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#14b8a6", // Light Teal
];

// ── Holdings calculation ──────────────────────────────────────
export function calcHoldings(marketData: any[], walletHoldings: any[] = []) {
  const priceMap: Record<string, any> = {};
  (Array.isArray(marketData) ? marketData : []).forEach((c) => {
    priceMap[c.symbol?.toUpperCase()] = {
      price: parseFloat(c.current_price) || 0,
      change24h: parseFloat(c.price_change_percentage_24h) || 0,
      image_url: c.image_url,
      name: c.name,
      slug: c.slug,
    };
  });

  const bySymbol: Record<string, any> = {};
  
  for (const wh of walletHoldings) {
    const sym = wh.symbol.toUpperCase();
    if (!bySymbol[sym]) bySymbol[sym] = { walletQty: 0 };
    bySymbol[sym].walletQty += wh.quantity;
  }

  const holdings = [];
  for (const [sym, { walletQty }] of Object.entries(bySymbol)) {
    const qty = walletQty || 0;
    if (qty <= 0.000001) continue;

    const market = priceMap[sym] || {};
    const curPrice = market.price || 0;
    const value = qty * curPrice;
    
    const costBasis = value;
    const pnl = 0;
    const pnlPct = 0;

    holdings.push({
      symbol: sym,
      name: market.name || sym,
      slug: market.slug || sym.toLowerCase(),
      image_url: market.image_url,
      quantity: qty,
      avg_cost: curPrice,
      current_price: curPrice,
      value,
      cost_basis: costBasis,
      pnl,
      pnl_pct: pnlPct,
      change_24h: market.change24h || 0,
      has_wallet_balance: true,
    });
  }

  return holdings.sort((a, b) => b.value - a.value);
}

export function SoftCard({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) {
  return (
    <div className={`bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[20px] overflow-hidden backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-[var(--border-strong)] ${noPadding ? "" : "p-6"} ${className}`}>
      {children}
    </div>
  );
}

export const calcBuyingPower = (holdings: any[]) => {
  const stables = ["USDT", "USDC", "DAI", "BUSD"];
  return holdings.filter(h => stables.includes(h.symbol)).reduce((sum, h) => sum + h.value, 0);
};

export const calcAllocation = (holdings: any[]) => {
  const total = holdings.reduce((sum, h) => sum + h.value, 0);
  if (total === 0) return [];
  return holdings.filter(h => h.value > 0).map((h, index) => ({
    name: h.symbol,
    value: h.value,
    pct: (h.value / total) * 100,
    color: COIN_COLORS[h.symbol] || CHART_COLORS[index % CHART_COLORS.length]
  })).sort((a, b) => b.value - a.value);
};
