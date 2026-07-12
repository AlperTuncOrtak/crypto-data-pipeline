import React from "react";
import { X, Copy, CheckCircle } from "lucide-react";

// ── Formatters ────────────────────────────────────────────────
export const fmtUSD = (n) => {
  const v = Number(n);
  if (isNaN(v)) return "—";
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
};
export const fmtPct = (n) => `${Number(n) >= 0 ? "▲" : "▼"} ${Math.abs(Number(n)).toFixed(2)}%`;
export const fmtNum = (n) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 });

// ── Colors ───────────────────────────────────────────────────
export const COIN_COLORS = {
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

// ── Exchange rehberleri ───────────────────────────────────────
export const EXCHANGE_GUIDES = {
  binance: {
    name: "Binance",
    logo: "🟡",
    color: "#F3BA2F",
    steps: [
      "Log in to your Binance account",
      'Click the profile icon in the top right → select "Orders"',
      'Go to the "Trade History" tab',
      "Select date range (max 3 months, multiple exports may be needed)",
      'Click "Export" → select CSV format',
      "Upload the downloaded file here",
    ],
    note: "Binance exports a maximum of 3 months of data. Upload multiple files for longer history.",
    columns: ["Date", "Pair", "Side", "Price", "Executed", "Amount", "Fee"],
  },
  bybit: {
    name: "Bybit",
    logo: "🟠",
    color: "#F7A600",
    steps: [
      "Log in to your Bybit account",
      'Click "Assets" → "Transaction History" in the top right',
      'Select the "Trade" tab',
      "Set the date range and coin filter",
      'Click the "Export" button',
      "Download the CSV file and upload it here",
    ],
    note: "Bybit spot and futures trades come in separate files.",
    columns: ["Time", "Symbol", "Side", "Price", "Qty", "Value", "Fee"],
  },
  okx: {
    name: "OKX",
    logo: "⚫",
    color: "#888",
    steps: [
      "Log in to your OKX account",
      'Select "Trade" → "Order History" from the top menu',
      'Go to the "Filled Orders" tab',
      "Select the date range",
      "Click the export icon in the top right",
      "Download as CSV and upload it here",
    ],
    note: "OKX provides a maximum of 90 days of data.",
    columns: [
      "Order Time",
      "Instrument",
      "Trade Side",
      "Filled Price",
      "Filled Amount",
      "Total",
    ],
  },
  coinbase: {
    name: "Coinbase",
    logo: "🔵",
    color: "#0052FF",
    steps: [
      "Log in to your Coinbase account",
      'Click profile in the top right → "Statements"',
      'Select "Generate custom statement"',
      'Select the date range and "CSV" format',
      'Click the "Generate" button',
      "Click the link sent to your email to download and upload it here",
    ],
    note: "If you use Coinbase Pro, there is a separate export page.",
    columns: [
      "Timestamp",
      "Transaction Type",
      "Asset",
      "Quantity Transacted",
      "Spot Price",
      "Total",
    ],
  },
  kraken: {
    name: "Kraken",
    logo: "🟣",
    color: "#5741d9",
    steps: [
      "Log in to your Kraken account",
      'Select "History" → "Export" from the top menu',
      'Select "Trades" as the export type',
      "Set the date range",
      'Click the "Submit" button',
      "Download when ready and upload it here",
    ],
    note: "Kraken CSV preparation may take a few minutes.",
    columns: ["txid", "pair", "time", "type", "price", "vol", "cost", "fee"],
  },
};

// ── CSV Parser ────────────────────────────────────────────────

// Smart CSV line splitter — handles commas inside quotes
export function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if ((ch === "," || ch === "\t") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

export function normalizeHdr(h) {
  return String(h).replace(/"/g, "").replace(/\(.*?\)/g, "").trim().toLowerCase();
}

export function extractSymbol(pair) {
  if (!pair) return null;
  const clean = pair.toUpperCase()
    .replace(/[-\/]?(USDT|BUSD|USD|BTC|ETH|BNB|TRY|EUR|USDC|DAI|TUSD|FDUSD)$/, "|")
    .split("|")[0].replace(/[^A-Z0-9]/g, "");
  return clean || null;
}

export function detectExchange(headers) {
  const h = headers.map(normalizeHdr);
  const has = (k) => h.some(x => x.includes(k));
  if (has("pair") && has("executed")) return "binance_trade";
  if (has("market") && has("type") && has("amount")) return "binance_trade";
  if ((has("coin") || has("asset")) && has("change")) return "binance_history";
  if (has("symbol") && has("qty")) return "bybit";
  if (has("instrument")) return "okx";
  if (has("asset") && has("quantity transacted")) return "coinbase";
  if (has("txid") && has("vol")) return "kraken";
  return "unknown";
}

export function getCol(row, ...keys) {
  for (const k of keys) {
    for (const rk of Object.keys(row)) {
      if (normalizeHdr(rk).includes(k.toLowerCase())) return row[rk] || "";
    }
  }
  return "";
}

export function safeDate(str) {
  if (!str) return new Date().toISOString();
  const d = new Date(String(str).replace(/\//g, "-").replace(" ", "T"));
  return isNaN(d) ? new Date().toISOString() : d.toISOString();
}

export function safeNum(str) {
  return parseFloat(String(str || 0).replace(/[^0-9.-]/g, "")) || 0;
}

export function parseCSV(text) {
  // Detect separator
  const firstLine = text.split("\n")[0];
  const sep = firstLine.includes("\t") ? "\t" : ",";

  const lines = text.trim().split("\n").filter(l => l.trim() && !l.startsWith("//") && !l.startsWith("#"));
  if (lines.length < 2) throw new Error("CSV dosyası çok kısa veya boş.");

  const rawHeaders = splitCSVLine(lines[0]);
  const exchange = detectExchange(rawHeaders);

  if (exchange === "unknown") {
    throw new Error(`Desteklenmeyen CSV formatı. Sütunlar: ${rawHeaders.slice(0,6).join(", ")}`);
  }

  const trades = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const row = {};
    rawHeaders.forEach((h, idx) => { row[h] = cols[idx] || ""; });

    try {
      let trade = null;

      if (exchange === "binance_trade") {
        const pairRaw = getCol(row, "pair", "market", "symbol");
        const sym = extractSymbol(pairRaw);
        if (!sym) continue;
        const qty = safeNum(getCol(row, "executed", "filled", "qty").replace(/[A-Za-z]/g, ""));
        const price = safeNum(getCol(row, "price", "avg price"));
        const total = safeNum(getCol(row, "amount", "total", "value").replace(/[A-Za-z]/g, ""));
        const side = getCol(row, "side", "type").toLowerCase().includes("buy") ? "buy" : "sell";
        trade = {
          symbol: sym,
          side,
          quantity: qty,
          price: price || (qty > 0 && total > 0 ? total / qty : 0),
          total,
          fee: safeNum(getCol(row, "fee").replace(/[A-Za-z]/g, "")),
          traded_at: safeDate(getCol(row, "date", "time", "createtime")),
          exchange: "binance",
        };
      } else if (exchange === "binance_history") {
        const op = getCol(row, "operation", "remark", "type").toLowerCase();
        const sym = getCol(row, "coin", "asset").toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (!sym) continue;

        // Skip stablecoins, fees, and non-trade operations
        const stablecoins = ["USDT","BUSD","USDC","FDUSD","DAI","TUSD","USD","EUR","TRY"];
        const isStable = stablecoins.includes(sym);
        
        // Binance uses many operation names for trades:
        // "Buy", "Sell", "Transaction Revenue" (received crypto in buy), 
        // "Transaction Spend" (spent USDT in buy), "Large OTC trading buy/sell",
        // "Small Assets Exchange BNB", "POS savings purchase"
        const isTrade = op.includes("buy") || op.includes("sell") || 
                        op.includes("transaction revenue") || op.includes("transaction spend") ||
                        op.includes("otc") || op.includes("convert") ||
                        op.includes("exchange") || op.includes("trade");
        
        const isSkip = op.includes("fee") || op.includes("deposit") || 
                       op.includes("withdraw") || op.includes("interest") ||
                       op.includes("reward") || op.includes("referral") ||
                       op.includes("staking") || op.includes("cashback") ||
                       op.includes("savings") || op.includes("distribution");

        if (!isTrade || isSkip) continue;
        
        // Skip stablecoin rows (the USDT "spend" side) — we only care about crypto side
        if (isStable) continue;

        const change = safeNum(getCol(row, "change", "amount"));
        if (Math.abs(change) < 0.000001) continue;

        // "Transaction Revenue" = received crypto = BUY
        // "Transaction Spend" with crypto = SELL
        const isBuy = op.includes("buy") || op.includes("revenue") || 
                      op.includes("purchase") || change > 0;
        trade = {
          symbol: sym,
          side: isBuy ? "buy" : "sell",
          quantity: Math.abs(change),
          price: 0,
          total: 0,
          fee: 0,
          traded_at: safeDate(getCol(row, "utc_time", "time", "date")),
          exchange: "binance",
        };
      } else if (exchange === "bybit") {
        const sym = extractSymbol(getCol(row, "symbol", "pair"));
        if (!sym) continue;
        trade = {
          symbol: sym,
          side: getCol(row, "side").toLowerCase().includes("buy") ? "buy" : "sell",
          quantity: safeNum(getCol(row, "qty", "quantity", "filled qty")),
          price: safeNum(getCol(row, "price", "avg price")),
          total: safeNum(getCol(row, "value", "total")),
          fee: safeNum(getCol(row, "fee", "trading fee")),
          traded_at: safeDate(getCol(row, "time", "createtime", "date")),
          exchange: "bybit",
        };
      } else if (exchange === "okx") {
        const inst = getCol(row, "instrument", "instid") || "";
        const sym = inst.split("-")[0] || extractSymbol(inst);
        if (!sym) continue;
        trade = {
          symbol: sym,
          side: getCol(row, "trade side", "side").toLowerCase().includes("buy") ? "buy" : "sell",
          quantity: safeNum(getCol(row, "filled amount", "size", "qty")),
          price: safeNum(getCol(row, "filled price", "avg px", "price")),
          total: safeNum(getCol(row, "total", "notional usd")),
          fee: safeNum(getCol(row, "fee", "trading fee")),
          traded_at: safeDate(getCol(row, "order time", "createtime", "time")),
          exchange: "okx",
        };
      } else if (exchange === "coinbase") {
        const txType = getCol(row, "transaction type").toLowerCase();
        if (!txType.includes("buy") && !txType.includes("sell")) continue;
        trade = {
          symbol: getCol(row, "asset") || "",
          side: txType.includes("buy") ? "buy" : "sell",
          quantity: safeNum(getCol(row, "quantity transacted")),
          price: safeNum(getCol(row, "spot price", "price at transaction")),
          total: safeNum(getCol(row, "total", "subtotal")),
          fee: 0,
          traded_at: safeDate(getCol(row, "timestamp", "date")),
          exchange: "coinbase",
        };
      } else if (exchange === "kraken") {
        const pair = getCol(row, "pair") || "";
        const sym = pair.replace(/USD$|USDT$|EUR$/, "").replace(/^X/, "").replace(/^Z/, "");
        trade = {
          symbol: sym,
          side: getCol(row, "type") === "buy" ? "buy" : "sell",
          quantity: safeNum(getCol(row, "vol", "volume")),
          price: safeNum(getCol(row, "price")),
          total: safeNum(getCol(row, "cost")),
          fee: safeNum(getCol(row, "fee")),
          traded_at: safeDate(getCol(row, "time", "date")),
          exchange: "kraken",
        };
      }

      if (trade && trade.quantity > 0 && trade.symbol && trade.symbol.length >= 2) {
        trades.push(trade);
      }
    } catch (e) { /* skip bad row */ }
  }

  if (trades.length === 0) {
    throw new Error(`CSV okundu (${exchange}) ama geçerli işlem bulunamadı. Dosyada alım/satım verisi var mı?`);
  }

  return { trades, exchange, count: trades.length };
}

// ── Holdings hesapla (FIFO) ───────────────────────────────────
export function calcHoldings(trades, marketData, walletHoldings = []) {
  const priceMap = {};
  (Array.isArray(marketData) ? marketData : []).forEach((c) => {
    priceMap[c.symbol?.toUpperCase()] = {
      price: parseFloat(c.current_price) || 0,
      change24h: parseFloat(c.price_change_percentage_24h) || 0,
      image_url: c.image_url,
      name: c.name,
      slug: c.slug,
    };
  });

  const bySymbol = {};
  for (const t of trades) {
    const sym = t.symbol.toUpperCase();
    if (!bySymbol[sym]) bySymbol[sym] = { buys: [], sells: [], walletQty: 0, binanceQty: 0 };
    if (t.side === "buy") bySymbol[sym].buys.push(t);
    else bySymbol[sym].sells.push(t);
  }
  
  for (const wh of walletHoldings) {
    const sym = wh.symbol.toUpperCase();
    if (!bySymbol[sym]) bySymbol[sym] = { buys: [], sells: [], walletQty: 0, binanceQty: 0 };
    if (wh.source === "binance") {
      bySymbol[sym].binanceQty += wh.quantity;
    } else {
      bySymbol[sym].walletQty += wh.quantity;
    }
  }

  const holdings = [];
  for (const [sym, { buys, sells, walletQty, binanceQty }] of Object.entries(bySymbol)) {
    const totalBought = buys.reduce((s, t) => s + t.quantity, 0);
    const totalSold = sells.reduce((s, t) => s + t.quantity, 0);
    const qty = totalBought - totalSold + (walletQty || 0) + (binanceQty || 0);
    if (qty <= 0.000001) continue;

    const totalCost = buys.reduce((s, t) => s + t.total, 0);
    const avgCost = totalBought > 0 ? totalCost / totalBought : 0;

    const market = priceMap[sym] || {};
    const curPrice = market.price || 0;
    const value = qty * curPrice;
    
    let costBasis = qty * avgCost;
    let pnl = value - costBasis;
    let pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    
    // If there is no trade history, assume cost basis is current value to avoid 100% false PnL
    if (totalBought === 0) {
      costBasis = value;
      pnl = 0;
      pnlPct = 0;
    }

    holdings.push({
      symbol: sym,
      name: market.name || sym,
      slug: market.slug || sym.toLowerCase(),
      image_url: market.image_url,
      quantity: qty,
      avg_cost: avgCost,
      current_price: curPrice,
      value,
      cost_basis: costBasis,
      pnl,
      pnl_pct: pnlPct,
      change_24h: market.change24h || 0,
      trades_count: buys.length + sells.length,
      has_wallet_balance: (walletQty || 0) > 0,
      has_binance_balance: (binanceQty || 0) > 0,
    });
  }

  return holdings.sort((a, b) => b.value - a.value);
}

// ── Tax hesapla (FIFO + short/long term) ─────────────────────
export function calcTax(trades) {
  const bySymbol = {};
  for (const t of [...trades].sort(
    (a, b) => new Date(a.traded_at) - new Date(b.traded_at),
  )) {
    const sym = t.symbol.toUpperCase();
    if (!bySymbol[sym]) bySymbol[sym] = { lots: [], realized: [] };
    if (t.side === "buy") {
      bySymbol[sym].lots.push({
        qty: t.quantity,
        price: t.price,
        date: t.traded_at,
      });
    } else {
      let remaining = t.quantity;
      while (remaining > 0.000001 && bySymbol[sym].lots.length > 0) {
        const lot = bySymbol[sym].lots[0];
        const used = Math.min(lot.qty, remaining);
        const gain = used * (t.price - lot.price);
        const holdDays =
          (new Date(t.traded_at) - new Date(lot.date)) / (1000 * 60 * 60 * 24);
        const isLongTerm = holdDays >= 365;
        bySymbol[sym].realized.push({
          symbol: sym,
          qty: used,
          buy_price: lot.price,
          sell_price: t.price,
          buy_date: lot.date,
          sell_date: t.traded_at,
          gain,
          holdDays: Math.round(holdDays),
          isLongTerm,
          year: new Date(t.traded_at).getFullYear(),
        });
        lot.qty -= used;
        remaining -= used;
        if (lot.qty <= 0.000001) bySymbol[sym].lots.shift();
      }
    }
  }

  const allRealized = Object.values(bySymbol).flatMap((x) => x.realized);
  const shortTerm = allRealized.filter((r) => !r.isLongTerm);
  const longTerm = allRealized.filter((r) => r.isLongTerm);

  const totalGain = allRealized.reduce((s, r) => s + r.gain, 0);
  const totalLoss = allRealized
    .filter((r) => r.gain < 0)
    .reduce((s, r) => s + r.gain, 0);
  const shortGain = shortTerm.reduce((s, r) => s + r.gain, 0);
  const longGain = longTerm.reduce((s, r) => s + r.gain, 0);

  // Yıl bazında gruplama
  const byYear = {};
  for (const r of allRealized) {
    if (!byYear[r.year]) byYear[r.year] = [];
    byYear[r.year].push(r);
  }

  // Coin bazında özet
  const byCoin = {};
  for (const r of allRealized) {
    if (!byCoin[r.symbol]) byCoin[r.symbol] = { gain: 0, count: 0 };
    byCoin[r.symbol].gain += r.gain;
    byCoin[r.symbol].count += 1;
  }

  // Vergi tahmini (TR/US karışık, kullanıcı kendi oranını girer)
  const estShortTax = Math.max(0, shortGain) * 0.3;
  const estLongTax = Math.max(0, longGain) * 0.15;
  const estTotalTax = estShortTax + estLongTax;

  return {
    allRealized,
    totalGain,
    totalLoss,
    net: totalGain,
    shortTerm,
    longTerm,
    shortGain,
    longGain,
    byYear,
    byCoin,
    estShortTax,
    estLongTax,
    estTotalTax,
  };
}

// ── CSV Export ────────────────────────────────────────────────
export function exportTaxCSV(taxData) {
  const now = new Date();
  const reportDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const year = now.getFullYear();

  // Summary section
  const summaryRows = [
    ["CRYPTO TAX REPORT", "", "", "", "", "", "", "", "", ""],
    [`Generated: ${reportDate}`, "", "", "", "", "", "", "", "", ""],
    [
      "Tax Method: FIFO (First In First Out)",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["", "", "", "", "", "", "", "", "", ""],
    ["=== SUMMARY ===", "", "", "", "", "", "", "", "", ""],
    [
      "Total Realized Gain/Loss",
      `$${taxData.net.toFixed(2)}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Short-Term Gain/Loss",
      `$${taxData.shortGain.toFixed(2)}`,
      "(held < 1 year, 30% est. rate)",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Long-Term Gain/Loss",
      `$${taxData.longGain.toFixed(2)}`,
      "(held ≥ 1 year, 15% est. rate)",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Estimated Short-Term Tax",
      `$${taxData.estShortTax.toFixed(2)}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Estimated Long-Term Tax",
      `$${taxData.estLongTax.toFixed(2)}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Estimated Total Tax",
      `$${taxData.estTotalTax.toFixed(2)}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Total Transactions",
      taxData.allRealized.length,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["", "", "", "", "", "", "", "", "", ""],
    [
      "DISCLAIMER: Tax estimates are for illustration only. Consult a tax professional.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["", "", "", "", "", "", "", "", "", ""],
  ];

  // Per-asset summary
  const assetRows = [
    ["=== BY ASSET ===", "", "", "", "", "", "", "", "", ""],
    [
      "Asset",
      "Total Gain/Loss",
      "Transactions",
      "Short-Term G/L",
      "Long-Term G/L",
      "",
      "",
      "",
      "",
      "",
    ],
    ...Object.entries(taxData.byCoin)
      .sort((a, b) => Math.abs(b[1].gain) - Math.abs(a[1].gain))
      .map(([sym, d]) => {
        const shortGain = taxData.allRealized
          .filter((r) => r.symbol === sym && !r.isLongTerm)
          .reduce((s, r) => s + r.gain, 0);
        const longGain = taxData.allRealized
          .filter((r) => r.symbol === sym && r.isLongTerm)
          .reduce((s, r) => s + r.gain, 0);
        return [
          sym,
          `$${d.gain.toFixed(2)}`,
          d.count,
          `$${shortGain.toFixed(2)}`,
          `$${longGain.toFixed(2)}`,
          "",
          "",
          "",
          "",
          "",
        ];
      }),
    ["", "", "", "", "", "", "", "", "", ""],
  ];

  // Transaction detail
  const txRows = [
    ["=== TRANSACTION DETAIL ===", "", "", "", "", "", "", "", "", ""],
    [
      "Year",
      "Asset",
      "Type",
      "Buy Date",
      "Sell Date",
      "Hold (Days)",
      "Quantity",
      "Buy Price (USD)",
      "Sell Price (USD)",
      "Gain/Loss (USD)",
    ],
    ...taxData.allRealized.map((r) => [
      r.year,
      r.symbol,
      r.isLongTerm ? "Long-Term" : "Short-Term",
      new Date(r.buy_date).toLocaleDateString("en-US"),
      new Date(r.sell_date).toLocaleDateString("en-US"),
      r.holdDays,
      r.qty.toFixed(8),
      r.buy_price.toFixed(8),
      r.sell_price.toFixed(8),
      r.gain.toFixed(2),
    ]),
  ];

  const allRows = [...summaryRows, ...assetRows, ...txRows];
  const csv = allRows
    .map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `crypto_tax_report_${year}_${now.toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Guide Modal ───────────────────────────────────────────────
export function GuideModal({ exchange, onClose }) {
  const g = EXCHANGE_GUIDES[exchange];
  if (!g) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 998,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 999,
          width: "100%",
          maxWidth: 520,
          padding: "0 16px",
        }}
      >
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-soft)",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              height: 3,
              background: `linear-gradient(90deg, ${g.color}, transparent)`,
            }}
          />
          <div style={{ padding: "24px 28px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{g.logo}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {g.name} Export Guide
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Step-by-step instructions
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {g.steps.map((step, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: `${g.color}20`,
                      border: `1px solid ${g.color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: g.color,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      paddingTop: 2,
                    }}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {g.note && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--accent-soft)",
                  border: "1px solid var(--accent-soft)",
                  borderRadius: 10,
                  display: "flex",
                  gap: 8,
                }}
              >
                <Info
                  size={14}
                  style={{
                    color: "var(--accent)",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {g.note}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────
// SOFT CARD
// ─────────────────────────────────────────────────────────────────
export function SoftCard({ children, className = "", noPadding = false }) {
  return (
    <div
      className={[
        "bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border)] rounded-[24px]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-300 ease-out overflow-hidden relative",
        noPadding ? "" : "p-6 sm:p-8",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
