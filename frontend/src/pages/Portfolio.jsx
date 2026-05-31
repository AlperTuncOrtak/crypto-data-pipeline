// ============================================================
// pages/Portfolio.jsx
// ============================================================
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { useMarket } from "../hooks/useMarket";
import { apiClient } from "../api/client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Upload,
  Brain,
  FileDown,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  X,
  RefreshCw,
  Wallet,
  BarChart2,
  Info,
} from "lucide-react";

// ── Formatters ────────────────────────────────────────────────
const fmtUSD = (n) => {
  const v = Number(n);
  if (isNaN(v)) return "—";
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
};
const fmtPct = (n) => `${Number(n) >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`;
const fmtNum = (n) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 });

// ── Colors ───────────────────────────────────────────────────
const CHART_COLORS = [
  "#f5a623",
  "#2ecc71",
  "#3498db",
  "#9b59b6",
  "#e74c3c",
  "#1abc9c",
  "#f39c12",
  "#e67e22",
  "#2980b9",
  "#8e44ad",
];

// ── Exchange rehberleri ───────────────────────────────────────
const EXCHANGE_GUIDES = {
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
function splitCSVLine(line) {
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

function normalizeHdr(h) {
  return String(h).replace(/"/g, "").replace(/\(.*?\)/g, "").trim().toLowerCase();
}

function extractSymbol(pair) {
  if (!pair) return null;
  const clean = pair.toUpperCase()
    .replace(/[-\/]?(USDT|BUSD|USD|BTC|ETH|BNB|TRY|EUR|USDC|DAI|TUSD|FDUSD)$/, "|")
    .split("|")[0].replace(/[^A-Z0-9]/g, "");
  return clean || null;
}

function detectExchange(headers) {
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

function getCol(row, ...keys) {
  for (const k of keys) {
    for (const rk of Object.keys(row)) {
      if (normalizeHdr(rk).includes(k.toLowerCase())) return row[rk] || "";
    }
  }
  return "";
}

function safeDate(str) {
  if (!str) return new Date().toISOString();
  const d = new Date(String(str).replace(/\//g, "-").replace(" ", "T"));
  return isNaN(d) ? new Date().toISOString() : d.toISOString();
}

function safeNum(str) {
  return parseFloat(String(str || 0).replace(/[^0-9.-]/g, "")) || 0;
}

function parseCSV(text) {
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
function calcHoldings(trades, marketData, walletHoldings = []) {
  const priceMap = {};
  (marketData || []).forEach((c) => {
    priceMap[c.symbol?.toUpperCase()] = {
      price: parseFloat(c.current_price) || 0,
      change24h: parseFloat(c.price_change_percentage_24h) || 0,
      image_url: c.image_url,
      name: c.name,
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
function calcTax(trades) {
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
function exportTaxCSV(taxData) {
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
function GuideModal({ exchange, onClose }) {
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
            background: "#161616",
            border: "1px solid #2a2a2a",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
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
                  background: "rgba(245,166,35,0.06)",
                  border: "1px solid rgba(245,166,35,0.15)",
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

// ── AI Analysis ───────────────────────────────────────────────
function MiniGauge({ score, max = 10, color }) {
  const pct = (score / max) * 100;
  const radius = 36,
    cx = 50,
    cy = 46;
  const startAngle = 180;
  const endAngle = 180 + (pct / 100) * 180;
  const toRad = (d) => (d * Math.PI) / 180;
  const x1 = cx + radius * Math.cos(toRad(startAngle));
  const y1 = cy + radius * Math.sin(toRad(startAngle));
  const x2 = cx + radius * Math.cos(toRad(endAngle));
  const y2 = cy + radius * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return (
    <svg width="100" height="70" viewBox="0 0 100 70">
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="var(--bg-elevated)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {score > 0 && (
        <path
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      )}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        fill={color}
        style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace" }}
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        style={{ fontSize: 9 }}
      >
        / {max}
      </text>
    </svg>
  );
}

const CORR_COLOR = { low: "#2ecc71", medium: "#f5a623", high: "#e74c3c" };
const SECTOR_COLORS = {
  "Store of Value": "#f5a623",
  "Layer 1": "#3498db",
  "Layer 2": "#2ecc71",
  DeFi: "#9b59b6",
  Payments: "#1abc9c",
  Meme: "#e74c3c",
  "Exchange Token": "#e67e22",
  Oracle: "#3498db",
  "Layer 0": "#8e44ad",
  Storage: "#27ae60",
  Web3: "#2980b9",
  Enterprise: "#7f8c8d",
  Other: "#555",
};

function AIPortfolioCard({ holdings, totalValue, totalPnl, autoAnalyze }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const didAutoAnalyze = useRef(false);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post("/ai/portfolio", {
        holdings: holdings.slice(0, 12).map((h) => ({
          symbol: h.symbol,
          value: h.value,
          pnl_pct: h.pnl_pct,
          quantity: h.quantity,
          avg_cost: h.avg_cost,
        })),
        total_value: totalValue,
        total_pnl: totalPnl,
      });
      setResult(resp.data);
    } catch (e) {
      setError(e.message);
      console.error("Portfolio AI error:", e);
    } finally {
      setLoading(false);
    }
  }

  // Auto-analyze when Binance is connected and holdings loaded
  useEffect(() => {
    if (autoAnalyze && holdings.length > 0 && !result && !loading && !didAutoAnalyze.current) {
      didAutoAnalyze.current = true;
      analyze();
    }
  }, [autoAnalyze, holdings.length]);

  if (!result)
    return (
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 24,
          padding: "24px",
          textAlign: "center",
        }}
      >
        <Brain
          size={32}
          style={{
            color: "var(--accent)",
            margin: "0 auto 12px",
            display: "block",
          }}
        />
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
          AI Portfolio Analysis
        </div>
        <div
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}
        >
          Get personalized insights, risk assessment, and recommendations for
          your portfolio.
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            padding: "11px 28px",
            borderRadius: 24,
            background: "linear-gradient(135deg, #f5a623, #e8941a)",
            color: "#111",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "0 auto",
          }}
        >
          {loading ? (
            <>
              <RefreshCw
                size={14}
                style={{ animation: "spin 0.8s linear infinite" }}
              />{" "}
              Analyzing...
            </>
          ) : (
            <>
              <Brain size={14} /> Analyze Portfolio
            </>
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );

  const riskColor =
    result.risk_score <= 3
      ? "#2ecc71"
      : result.risk_score <= 6
        ? "#f5a623"
        : "#e74c3c";
  const divColor =
    result.diversification_score >= 7
      ? "#2ecc71"
      : result.diversification_score >= 4
        ? "#f5a623"
        : "#e74c3c";
  const corrColor = CORR_COLOR[result.correlation_risk] || "#f5a623";

  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 24,
        padding: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Brain size={16} style={{ color: "var(--accent)" }} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
            }}
          >
            AI Portfolio Analysis
          </span>
        </div>
        <button
          onClick={() => setResult(null)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          Re-analyze
        </button>
      </div>

      {/* Gauge row: Risk + Diversification + Correlation */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "RISK SCORE",
            score: result.risk_score,
            color: riskColor,
            sub: result.risk_label,
          },
          {
            label: "DIVERSIFICATION",
            score: result.diversification_score,
            color: divColor,
            sub: result.dominant_sector,
          },
          {
            label: "BTC CORRELATION",
            score: null,
            color: corrColor,
            sub: (result.correlation_risk || "").toUpperCase(),
            badge: true,
          },
        ].map(({ label, score, color, sub, badge }) => (
          <div
            key={label}
            style={{
              padding: "14px 10px",
              background: `${color}10`,
              border: `1px solid ${color}25`,
              borderRadius: 24,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                marginBottom: 4,
                letterSpacing: "0.08em",
              }}
            >
              {label}
            </div>
            {badge ? (
              <div style={{ padding: "10px 0" }}>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color,
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  {sub}
                </span>
              </div>
            ) : (
              <MiniGauge score={score} color={color} />
            )}
            {!badge && (
              <div
                style={{ fontSize: 11, color, fontWeight: 700, marginTop: 2 }}
              >
                {sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          marginBottom: 16,
          padding: "12px 14px",
          background: "var(--bg-elevated)",
          borderRadius: 10,
        }}
      >
        {result.summary}
      </p>

      {/* Best / Worst position */}
      {(result.best_position || result.worst_position) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {result.best_position && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(46,204,113,0.08)",
                border: "1px solid rgba(46,204,113,0.2)",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#2ecc71",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                💰 BEST POSITION
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                {result.best_position}
              </div>
            </div>
          )}
          {result.worst_position && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(231,76,60,0.08)",
                border: "1px solid rgba(231,76,60,0.2)",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#e74c3c",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                ⚠️ WORST POSITION
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                {result.worst_position}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sector breakdown */}
      {result.sector_breakdown &&
        Object.keys(result.sector_breakdown).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Sector Breakdown
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.entries(result.sector_breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([sector, pct]) => {
                  const color = SECTOR_COLORS[sector] || "#555";
                  return (
                    <div
                      key={sector}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 70,
                          fontSize: 10,
                          color: "var(--text-muted)",
                          flexShrink: 0,
                          textAlign: "right",
                        }}
                      >
                        {sector}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: "var(--bg-elevated)",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            height: "100%",
                            background: color,
                            borderRadius: 3,
                            transition: "width 0.8s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          width: 32,
                          fontSize: 10,
                          color,
                          fontWeight: 700,
                          fontFamily: "monospace",
                        }}
                      >
                        {pct}%
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      {/* Strengths / Risks / Recommendations */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {[
          {
            label: "Strengths",
            items: result.strengths,
            color: "#2ecc71",
            icon: CheckCircle,
          },
          {
            label: "Risks",
            items: result.risks,
            color: "#e74c3c",
            icon: AlertTriangle,
          },
          {
            label: "Recommendations",
            items: result.recommendations,
            color: "#f5a623",
            icon: TrendingUp,
          },
        ].map(({ label, items, color, icon: Icon }) => (
          <div
            key={label}
            style={{
              padding: "12px",
              background: `${color}08`,
              border: `1px solid ${color}20`,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 8,
              }}
            >
              <Icon size={12} style={{ color }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {label}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(items || []).map((item, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    lineHeight: 1.4,
                    display: "flex",
                    gap: 5,
                  }}
                >
                  <span style={{ color, flexShrink: 0 }}>→</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



// --- Reusable SoftCard ---
function SoftCard({ children, className = "", noPadding = false }) {
  return (
    <div
      className={`
        bg-white/[0.02] backdrop-blur-xl border border-white/[0.04] rounded-3xl 
        transition-all duration-300 ease-out hover:bg-white/[0.03] hover:border-white/[0.06] hover:-translate-y-1 hover:shadow-xl
        overflow-hidden relative
        ${noPadding ? "" : "p-6"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function Portfolio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: marketData } = useMarket(500);
  const fileRef = useRef(null);

  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem("crypto_neko_trades");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [importing, setImporting] = useState(false);
  const [wallets, setWallets] = useState(() => {
    try {
      const saved = localStorage.getItem("crypto_neko_wallets");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [walletHoldings, setWalletHoldings] = useState([]);
  const [binanceKeys, setBinanceKeys] = useState(() => {
    try {
      const saved = localStorage.getItem("crypto_neko_binance_keys");
      return saved ? JSON.parse(saved) : { key: "", secret: "" };
    } catch { return { key: "", secret: "" }; }
  });
  
  const [isSyncingBinance, setIsSyncingBinance] = useState(false);
  const [binanceHoldings, setBinanceHoldings] = useState([]);

  const syncBinance = useCallback(async (key, secret) => {
    if (!key || !secret) return;
    setIsSyncingBinance(true);
    try {
      const resp = await apiClient.post("/portfolio/binance-sync", { api_key: key, api_secret: secret });
      if (resp.data.ok && resp.data.balances) {
        setBinanceHoldings(resp.data.balances.map(b => ({ symbol: b.symbol, quantity: b.quantity, source: "binance" })));
        setBinanceKeys({ key, secret });
        localStorage.setItem("crypto_neko_binance_keys", JSON.stringify({ key, secret }));
      }
    } catch (e) {
      console.error("Binance sync failed:", e);
    } finally {
      setIsSyncingBinance(false);
    }
  }, []);

  useEffect(() => {
    if (binanceKeys.key && binanceKeys.secret) syncBinance(binanceKeys.key, binanceKeys.secret);
  }, []);

  useEffect(() => {
    localStorage.setItem("crypto_neko_wallets", JSON.stringify(wallets));
    const fetchWallets = async () => {
      let allHoldings = [];
      for (const w of wallets) {
        try {
          const res = await fetch(`https://api.ethplorer.io/getAddressInfo/${w}?apiKey=freekey`);
          const data = await res.json();
          if (data.ETH && data.ETH.balance > 0) allHoldings.push({ symbol: "ETH", quantity: data.ETH.balance });
          if (data.tokens) {
            for (const t of data.tokens) {
               if (!t.tokenInfo || !t.tokenInfo.symbol) continue;
               const decimals = parseInt(t.tokenInfo.decimals) || 18;
               const bal = t.balance / Math.pow(10, decimals);
               if (bal > 0) allHoldings.push({ symbol: t.tokenInfo.symbol, quantity: bal });
            }
          }
        } catch (e) { console.error("Wallet fetch error", e); }
      }
      setWalletHoldings(allHoldings);
    };
    if (wallets.length > 0) fetchWallets();
    else setWalletHoldings([]);
  }, [wallets]);

  useEffect(() => {
    if (!user) return;
    supabase.from("trades").select("*").eq("user_id", user.id).order("traded_at", { ascending: true })
      .then(({ data }) => { if (data && data.length > 0) setTrades(data); });
  }, [user]);

  useEffect(() => {
    try { localStorage.setItem("crypto_neko_trades", JSON.stringify(trades)); } catch (e) { }
  }, [trades]);

  const [activeTab, setActiveTab] = useState("holdings"); 
  const [showImportOpts, setShowImportOpts] = useState(false);

  const holdings = useMemo(() => calcHoldings(trades, marketData, [...walletHoldings, ...binanceHoldings]), [trades, marketData, walletHoldings, binanceHoldings]);
  const totalValue = useMemo(() => holdings.reduce((s, h) => s + h.value, 0), [holdings]);
  const totalCost = useMemo(() => holdings.reduce((s, h) => s + h.cost_basis, 0), [holdings]);
  const totalPnl = useMemo(() => totalValue - totalCost, [totalValue, totalCost]);
  const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  
  const pieData = useMemo(() => holdings.slice(0, 8).map((h, i) => ({ name: h.symbol, value: h.value, color: CHART_COLORS[i % CHART_COLORS.length] })), [holdings]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const { trades: parsed } = parseCSV(text);
      setTrades((prev) => [...prev, ...parsed]);
      if (user) {
        const rows = parsed.map((t) => ({
          user_id: user.id, exchange: t.exchange, symbol: t.symbol, side: t.side, quantity: t.quantity, price: t.price, fee: t.fee || 0, traded_at: t.traded_at || new Date().toISOString()
        }));
        await supabase.from("trades").insert(rows);
      }
    } catch (e) { alert(e.message); } finally { setImporting(false); setShowImportOpts(false); }
  }, [user]);

  return (
    <div className="max-w-[1600px] mx-auto pb-12 text-gray-100">
      
      {/* ── HERO: TOTAL BALANCE ── */}
      <div className="flex flex-col items-center justify-center py-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Total Portfolio Value</h2>
        <div className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6">
          {fmtUSD(totalValue)}
        </div>
        
        <div className={`flex items-center gap-2 text-lg font-bold px-4 py-2 rounded-2xl border ${totalPnl >= 0 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-red-400 bg-red-400/10 border-red-400/20"}`}>
          {totalPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          {totalPnl >= 0 ? "+" : ""}{fmtUSD(totalPnl)} ({fmtPct(pnlPct)})
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* ── LEFT COL: ASSET ALLOCATION (DONUT) ── */}
        <SoftCard className="lg:col-span-4 h-96 flex flex-col items-center justify-center relative">
          <h3 className="absolute top-6 left-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Asset Allocation</h3>
          {holdings.length > 0 ? (
             <div className="w-full h-full pt-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartTooltip 
                    formatter={(value) => fmtUSD(value)} 
                    contentStyle={{ backgroundColor: "#0D111C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: "#fff" }} 
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-gray-500 text-sm font-medium">No assets to display</div>
          )}
        </SoftCard>

        {/* ── RIGHT COL: IMPORT & SYNC ── */}
        <SoftCard className="lg:col-span-8 flex flex-col justify-center gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data Sources</h3>
            <button 
              onClick={() => setShowImportOpts(!showImportOpts)}
              className="text-xs font-bold bg-amber-500/10 text-amber-400 px-4 py-2 rounded-xl hover:bg-amber-500/20 transition-colors"
            >
              + Add Source
            </button>
          </div>
          
          {showImportOpts && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
              {Object.entries(EXCHANGE_GUIDES).map(([key, ex]) => (
                <button
                  key={key}
                  onClick={() => fileRef.current?.click()}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/10 transition-all flex flex-col items-center gap-2 text-sm font-bold group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{ex.logo}</span>
                  <span className="text-gray-300">{ex.name} CSV</span>
                </button>
              ))}
              <input type="file" ref={fileRef} accept=".csv" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
             <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/20">
                <CheckCircle size={14} /> Wagmi Wallet Connected
             </div>
             {binanceKeys.key && (
               <div className="flex items-center gap-2 bg-[#F3BA2F]/10 text-[#F3BA2F] px-4 py-2 rounded-xl text-xs font-bold border border-[#F3BA2F]/20">
                  <CheckCircle size={14} /> Binance Synced
               </div>
             )}
             {trades.length > 0 && (
               <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold border border-blue-500/20">
                  <CheckCircle size={14} /> {trades.length} CSV Trades
               </div>
             )}
          </div>
        </SoftCard>
      </div>

      {/* ── HOLDINGS TABLE ── */}
      <SoftCard className="overflow-x-auto">
         <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Your Holdings</h3>
         
         {holdings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-medium text-sm">
              Your portfolio is empty. Add a wallet or upload a CSV to get started.
            </div>
         ) : (
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/5">
                  {["Asset", "Price", "Balance", "Value", "Avg Cost", "PnL"].map((h, i) => (
                    <th key={h} className={`pb-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider ${i === 0 ? "text-left pl-2" : "text-right pr-2"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, idx) => {
                  const isPos = h.pnl >= 0;
                  return (
                    <tr key={h.symbol} className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => navigate(`/coin/${h.symbol.toLowerCase()}`)}>
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          {h.image_url ? (
                            <img src={h.image_url} alt={h.symbol} className="w-8 h-8 rounded-full group-hover:scale-110 transition-transform" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">{h.symbol.slice(0,1)}</div>
                          )}
                          <div>
                            <div className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{h.symbol}</div>
                            <div className="text-xs text-gray-500">{h.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-2 text-right text-sm font-mono font-bold text-gray-200">{fmtUSD(h.current_price)}</td>
                      <td className="py-4 pr-2 text-right text-sm font-mono font-medium text-gray-400">{fmtNum(h.quantity)}</td>
                      <td className="py-4 pr-2 text-right text-sm font-mono font-bold text-white">{fmtUSD(h.value)}</td>
                      <td className="py-4 pr-2 text-right text-sm font-mono font-medium text-gray-400">{h.avg_cost > 0 ? fmtUSD(h.avg_cost) : "—"}</td>
                      <td className="py-4 pr-2 text-right">
                        <div className="flex flex-col items-end">
                           <span className={`text-sm font-bold font-mono ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                             {isPos ? "+" : ""}{fmtUSD(h.pnl)}
                           </span>
                           <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md mt-1 ${isPos ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                             {isPos ? "+" : ""}{h.pnl_pct.toFixed(2)}%
                           </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
         )}
      </SoftCard>
    </div>
  );
}
