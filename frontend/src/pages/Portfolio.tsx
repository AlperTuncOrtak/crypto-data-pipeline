// ============================================================
// pages/Portfolio.jsx
// ============================================================
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getCoinColor } from "../utils/colors";
import { supabase } from "../lib/supabase";
import { useMarket } from "../hooks/useMarket";
import { apiClient } from "../api/client";
import { useTranslation } from "react-i18next";
import AIRebalanceModal from "../components/portfolio/AIRebalanceModal";
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
const fmtPct = (n) => `${Number(n) >= 0 ? "▲" : "▼"} ${Math.abs(Number(n)).toFixed(2)}%`;
const fmtNum = (n) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: 6 });

// ── Colors ───────────────────────────────────────────────────
const COIN_COLORS = {
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

const CHART_COLORS = [
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
function SoftCard({ children, className = "", noPadding = false }) {
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

// ─────────────────────────────────────────────────────────────────
// MAIN PORTFOLIO PAGE
// ─────────────────────────────────────────────────────────────────

export default function Portfolio() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: marketData } = useMarket(500);
  const fileRef = useRef(null);

  
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
    const [trades, setTrades] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crypto_neko_trades") || "[]"); }
    catch { return []; }
  });
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [wallets, setWallets] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crypto_neko_wallets") || "[]"); }
    catch { return []; }
  });
  const [walletHoldings, setWalletHoldings] = useState([]);
  const [isFetchingWallet, setIsFetchingWallet] = useState(false);
  const [walletInput, setWalletInput] = useState("");
  const [binanceKeys, setBinanceKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crypto_neko_binance_keys") || '{"key":"","secret":""}'); }
    catch { return { key: "", secret: "" }; }
  });
  const [isSyncingBinance, setIsSyncingBinance] = useState(false);
  const [binanceHoldings, setBinanceHoldings] = useState([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [guide, setGuide] = useState(null);

  const [aiInsights, setAiInsights] = useState(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiError, setAiError] = useState(null);

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
    } catch (e) { console.error(e); }
    finally { setIsSyncingBinance(false); }
  }, []);

  useEffect(() => {
    if (binanceKeys.key && binanceKeys.secret) syncBinance(binanceKeys.key, binanceKeys.secret);
  }, []);

  useEffect(() => {
    localStorage.setItem("crypto_neko_wallets", JSON.stringify(wallets));
    if (wallets.length === 0) { setWalletHoldings([]); return; }
    const go = async () => {
      setIsFetchingWallet(true);
      let all = [];
      for (const w of wallets) {
        try {
          const res = await fetch("https://api.ethplorer.io/getAddressInfo/" + w + "?apiKey=freekey");
          const data = await res.json();
          if (data.ETH?.balance > 0) all.push({ symbol: "ETH", quantity: data.ETH.balance });
          for (const t of data.tokens || []) {
            if (!t.tokenInfo?.symbol) continue;
            const bal = t.balance / Math.pow(10, parseInt(t.tokenInfo.decimals) || 18);
            if (bal > 0) all.push({ symbol: t.tokenInfo.symbol, quantity: bal });
          }
        } catch {}
      }
      setWalletHoldings(all);
      setIsFetchingWallet(false);
    };
    go();
  }, [wallets]);

  useEffect(() => {
    if (!user) return;
    supabase.from("trades").select("*").eq("user_id", user.id)
      .order("traded_at", { ascending: true })
      .then(({ data }) => { if (data?.length > 0) setTrades(data); });
  }, [user]);

  // --- Portfolio Performance Chart Logic ---
  const [chartRange, setChartRange] = useState(24);
  const [chartData, setChartData] = useState([]);
  const [isChartLoading, setIsChartLoading] = useState(false);

  const holdings = useMemo(
    () => calcHoldings(trades, marketData, [...walletHoldings, ...binanceHoldings]),
    [trades, marketData, walletHoldings, binanceHoldings]
  );
  
  const taxData = useMemo(() => calcTax(trades), [trades]);
  const totalValue = useMemo(() => holdings.reduce((s, h) => s + h.value, 0), [holdings]);
  const totalCost  = useMemo(() => holdings.reduce((s, h) => s + h.cost_basis, 0), [holdings]);
  const totalPnl   = useMemo(() => totalValue - totalCost, [totalValue, totalCost]);

  useEffect(() => {
    if (holdings.length === 0) {
      setChartData([]);
      return;
    }

    const fetchHistory = async () => {
      setIsChartLoading(true);
      try {
        const uniqueSymbols = [...new Set(holdings.map(h => h.symbol))];
        const searchParams = new URLSearchParams();
        uniqueSymbols.forEach(sym => searchParams.append("symbols", sym));
        searchParams.append("hours", chartRange.toString());

        const res = await apiClient.get(`/analysis/history?${searchParams.toString()}`);
        const historyData = res.data;

        const masterSymbol = uniqueSymbols.find(sym => historyData[sym] && historyData[sym].length > 0);
        if (!masterSymbol) {
          setChartData([]);
          return;
        }

        const masterTimeline = historyData[masterSymbol];
        
        const newChartData = masterTimeline.map((point, idx) => {
          let totalValAtT = 0;
          uniqueSymbols.forEach(sym => {
            const h = holdings.find(x => x.symbol === sym);
            const amt = h ? h.amount : 0;
            const symHistory = historyData[sym];
            let price = h ? h.current_price : 0;
            if (symHistory && symHistory[idx]) {
              price = symHistory[idx].price;
            }
            totalValAtT += amt * price;
          });
          
          return {
            time: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullTime: point.time,
            value: totalValAtT
          };
        });

        // Live injection for the final point
        const totalValueNow = holdings.reduce((s, h) => s + h.value, 0);
        if (newChartData.length > 0 && Math.abs(newChartData[newChartData.length - 1].value - totalValueNow) > 0.1) {
          newChartData.push({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullTime: new Date().toISOString(),
            value: totalValueNow
          });
        }

        setChartData(newChartData);
      } catch (err) {
        console.error("Failed to fetch chart history", err);
      } finally {
        setIsChartLoading(false);
      }
    };
    fetchHistory();
  }, [holdings, chartRange]);

  useEffect(() => {
    try { localStorage.setItem("crypto_neko_trades", JSON.stringify(trades)); } catch {}
  }, [trades]);



  const handleGetAIInsights = async () => {
    if (holdings.length === 0) return;
    setIsAnalyzingAI(true);
    setAiError(null);
    try {
      const payload = {
        holdings: holdings.map(h => ({
          symbol: h.symbol,
          value: h.value,
          pnl_pct: h.cost_basis > 0 ? (h.pnl / h.cost_basis) * 100 : 0,
          quantity: h.amount,
          avg_cost: h.avg_buy_price
        })),
        total_value: totalValue,
        total_pnl: totalPnl
      };
      const res = await apiClient.post("/ai/portfolio", payload);
      setAiInsights(res.data);
    } catch (err) {
      console.error("AI Analysis error:", err);
      setAiError(err.response?.data?.detail || "Failed to analyze portfolio. Please try again.");
    } finally {
      setIsAnalyzingAI(false);
    }
  };
  const pnlPct     = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const isPos      = totalPnl >= 0;

  const pieData = useMemo(() =>
    holdings.slice(0, 8).map((h, i) => ({ name: h.symbol, value: h.value, color: COIN_COLORS[h.symbol?.toUpperCase()] || CHART_COLORS[i % CHART_COLORS.length] })),
    [holdings]
  );

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setImporting(true); setImportMsg(null);
    try {
      const text = await file.text();
      const { trades: parsed, exchange, count } = parseCSV(text);
      setTrades(prev => [...prev, ...parsed]);
      setImportMsg({ ok: true, text: count + " trades imported from " + exchange });
      setShowAddSource(false);
      if (user) {
        await supabase.from("trades").insert(parsed.map(t => ({
          user_id: user.id, exchange: t.exchange, symbol: t.symbol, side: t.side,
          quantity: t.quantity, price: t.price, fee: t.fee || 0,
          traded_at: t.traded_at || new Date().toISOString(),
        })));
      }
    } catch (e) { setImportMsg({ ok: false, text: e.message }); }
    finally { setImporting(false); }
  }, [user]);

  const handleClearTrades = useCallback(async () => {
    if (!window.confirm("Are you sure you want to clear all imported CSV trades?")) return;
    setTrades([]);
    try { localStorage.removeItem("crypto_neko_trades"); } catch {}
    if (user) {
      try {
        await supabase.from("trades").delete().eq("user_id", user.id);
        setImportMsg({ ok: true, text: "All imported trades have been cleared." });
      } catch (e) {
        setImportMsg({ ok: false, text: "Failed to clear trades from database." });
      }
    }
  }, [user]);


  const topPerformer = holdings.length > 0 ? [...holdings].sort((a, b) => b.pnl_pct - a.pnl_pct)[0] : null;
  const worstPerformer = holdings.length > 0 ? [...holdings].sort((a, b) => a.pnl_pct - b.pnl_pct)[0] : null;

  return (
    <div className="max-w-[1600px] mx-auto pb-16 px-4 sm:px-6">

      {/* HERO */}
      <div className="relative flex flex-col items-center justify-center pt-20 pb-10 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[300px] rounded-full blur-[120px] bg-[var(--accent)]/10" />
        </div>
        <p className="relative z-10 text-xs font-bold uppercase tracking-[0.25em] mb-5 text-gray-500">
          {t('portfolio.title')}
        </p>
        <h1 className="relative z-10 text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 text-white drop-shadow-sm break-words max-w-full px-4 flex items-baseline justify-center gap-2 font-mono">
          <span className="text-gray-400 text-4xl">$</span>
          <NumberFlow value={Number.isNaN(Number(totalValue)) ? 0 : Number(totalValue)} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
        </h1>
        <div className={`relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-[32px] border text-base font-bold transition-all duration-300 shadow-lg ${isPos ? "text-green-400 bg-green-500/10 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]" : "text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]"}`}>
          {isPos ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          <span className="flex items-center gap-1 font-mono">
            {isPos ? "+" : "-"}$
            <NumberFlow value={Number.isNaN(Number(totalPnl)) ? 0 : Math.abs(Number(totalPnl))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
          </span>
          <span className="text-sm opacity-70 font-mono ml-1 flex items-center">
            (<NumberFlow value={Number.isNaN(Number(pnlPct)) ? 0 : Math.abs(Number(pnlPct))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />%)
          </span>
        </div>

        {/* PERFORMANCE CHART */}
        {chartData.length > 0 && (
          <div className="w-full max-w-4xl mx-auto mt-12 mb-4 relative z-10">
            <div className="flex justify-end gap-2 mb-4 px-4">
              {[24, 168, 720].map((hours) => {
                const labels = { 24: "24H", 168: "7D", 720: "30D" };
                return (
                  <button
                    key={hours}
                    onClick={() => setChartRange(hours)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      chartRange === hours
                        ? "bg-[var(--accent)] text-white shadow-sm"
                        : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {labels[hours]}
                  </button>
                );
              })}
            </div>
            
            <div className="h-[250px] w-full">
              {isChartLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full opacity-50" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      hide 
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      hide 
                    />
                    <RechartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const date = new Date(data.fullTime);
                          return (
                            <div className="glass-panel px-4 py-3 rounded-xl border-none shadow-xl">
                              <p className="text-[var(--text-muted)] text-xs font-semibold mb-1">
                                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-[var(--text-primary)] font-black text-lg">
                                <NumberFlow value={Number(data.value) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} />
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="var(--accent)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Import message */}
      {importMsg && (
        <div className={`flex items-center gap-3 mb-6 px-5 py-3 rounded-[32px] border text-sm font-semibold ${importMsg.ok ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
          {importMsg.text}
          <button onClick={() => setImportMsg(null)} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
      )}

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 mt-8">
        
        {/* LEFT COLUMN: Table */}
        <div className="lg:col-span-8 flex flex-col gap-6">

        {/* TOP MOVERS WIDGETS */}
        {topPerformer && worstPerformer && topPerformer.symbol !== worstPerformer.symbol && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 shadow-[inset_0_0_80px_rgba(39,57,81,0.2)] shadow-2xl rounded-[32px] p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-green-500/20 group-hover:scale-150 transition-all duration-500 transform translate-x-1/2 -translate-y-1/2"></div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-green-400" /> Top Performer</h3>
              <div className="flex items-center gap-4 relative z-10">
                {topPerformer.image_url ? <img src={topPerformer.image_url} alt={topPerformer.symbol} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-gray-300">{topPerformer.symbol[0]}</div>}
                <div>
                  <div className="text-xl font-black text-white">{topPerformer.symbol}</div>
                  <div className="text-sm font-bold text-green-400 flex items-center gap-1">
                    ▲ <NumberFlow value={Number.isNaN(Number(topPerformer.pnl_pct)) ? 0 : Math.abs(Number(topPerformer.pnl_pct))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 shadow-[inset_0_0_80px_rgba(39,57,81,0.2)] shadow-2xl rounded-[32px] p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-red-500/20 group-hover:scale-150 transition-all duration-500 transform translate-x-1/2 -translate-y-1/2"></div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingDown size={14} className="text-red-400" /> Worst Performer</h3>
              <div className="flex items-center gap-4 relative z-10">
                {worstPerformer.image_url ? <img src={worstPerformer.image_url} alt={worstPerformer.symbol} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-gray-300">{worstPerformer.symbol[0]}</div>}
                <div>
                  <div className="text-xl font-black text-white">{worstPerformer.symbol}</div>
                  <div className="text-sm font-bold text-red-400 flex items-center gap-1">
                    ▼ <NumberFlow value={Number.isNaN(Number(worstPerformer.pnl_pct)) ? 0 : Math.abs(Number(worstPerformer.pnl_pct))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Data Sources (Collapsible) */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[var(--text-primary)]">{t('portfolio.your_holdings')}</h2>
            <button
              onClick={() => setShowAddSource(v => !v)}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-white/[0.03] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              <Wallet size={14} />
              {showAddSource ? t('portfolio.close_options') : "Manage Sources"}
            </button>
          </div>

          {showAddSource && (
            <div className="mb-6 bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 shadow-[inset_0_0_80px_rgba(39,57,81,0.2)] rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Wallet size={14} className="text-[var(--accent)]" /> Import Data
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-4 mb-2 rounded-[32px] bg-white/[0.02] border border-[#273951]/50">
                {Object.entries(EXCHANGE_GUIDES).map(([key, ex]) => (
                  <button
                    key={key}
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-[32px] bg-[#16181c] border border-[#273951]/50 hover:bg-white/[0.04] hover:border-[#273951]/50 hover:scale-[0.98] transition-transform duration-300 transition-all duration-300 group overflow-hidden shadow-lg"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">{ex.logo}</span>
                    <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors text-center truncate w-full">{ex.name}</span>
                  </button>
                ))}
                <input type="file" ref={fileRef} accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            </div>
          )}

          <div className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 shadow-[inset_0_0_80px_rgba(39,57,81,0.2)] rounded-[32px] p-6 shadow-2xl mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <RefreshCw size={14} className="text-[var(--accent)]" /> {t('portfolio.eth_wallet')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                value={walletInput} 
                onChange={e => setWalletInput(e.target.value)} 
                placeholder="0x..."
                className="flex-1 min-w-0 bg-[#121212] border border-[#273951]/50 rounded-xl px-4 py-3 sm:px-5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[var(--accent)]/50 focus:bg-[#121212] transition-all duration-300" 
              />
              <button 
                onClick={() => { if (walletInput.trim()) { setWallets(prev => [...new Set([...prev, walletInput.trim()])]); setWalletInput(""); } }}
                className="px-6 py-3 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-[0_0_15px_var(--accent-soft)] hover:shadow-[0_0_20px_var(--accent-soft)]"
              >
                {isFetchingWallet ? t('portfolio.fetching') : t('portfolio.add_wallet')}
              </button>
            </div>
            {wallets.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {wallets.map(w => (
                  <span 
                    key={w} 
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-gray-400 font-mono hover:bg-white/[0.05] transition-colors"
                  >
                    {w.slice(0,6)}...{w.slice(-4)}
                    <button 
                      onClick={() => setWallets(prev => prev.filter(x => x !== w))} 
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.04] items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {trades.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <CheckCircle size={12} /> {trades.length} CSV Trades
                </span>
              )}
              {binanceKeys.key && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                  <CheckCircle size={12} /> Binance Synced
                </span>
              )}
              {wallets.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                  <Wallet size={12} /> {wallets.length} Wallet{wallets.length > 1 ? "s" : ""}
                </span>
              )}
              {trades.length === 0 && !binanceKeys.key && wallets.length === 0 && (
                <span className="text-xs font-medium text-gray-500">{t('portfolio.no_sources')}</span>
              )}
            </div>
            
            {trades.length > 0 && (
              <button 
                onClick={handleClearTrades} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300 ml-auto uppercase tracking-wider"
              >
                {t('portfolio.clear_csv')}
              </button>
            )}
          </div>
        </div>

      {/* HOLDINGS TABLE */}
      {holdings.length > 0 ? (
        <div className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 shadow-2xl rounded-[32px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  {[t('portfolio.table.asset'), t('portfolio.table.price'), t('portfolio.table.balance'), t('portfolio.table.value'), t('portfolio.table.avg_cost'), t('portfolio.table.pnl')].map((h, i) => (
                    <th key={h} className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 ${i === 0 ? "text-left rounded-tl-2xl" : "text-right"} ${i === 5 ? "rounded-tr-2xl" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => {
                  const p = h.pnl >= 0;
                  return (
                    <motion.tr 
                      key={h.symbol} 
                      onClick={() => navigate("/coin/" + h.slug)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="transition-colors cursor-pointer group border-b border-[#273951]/50 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          {h.image_url
                            ? <img src={h.image_url} alt={h.symbol} className="w-8 h-8 rounded-full shrink-0 transition-transform group-hover:scale-105" />
                            : <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-white/[0.05] text-gray-400">
                                {h.symbol[0]}
                              </div>
                          }
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-gray-200 transition-colors">{h.symbol}</div>
                            <div className="text-xs font-bold tracking-widest uppercase text-gray-500 mt-0.5">{h.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right font-mono text-sm font-semibold text-gray-400">
                        <NumberFlow value={Number.isNaN(Number(h.current_price)) ? 0 : Number(h.current_price)} format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: h.current_price < 0.01 ? 6 : (h.current_price < 1 ? 4 : 2) }} />
                      </td>
                      <td className="px-5 py-5 text-right font-mono text-sm text-gray-500">
                        <NumberFlow value={Number.isNaN(Number(h.quantity)) ? 0 : Number(h.quantity)} format={{ maximumFractionDigits: 6 }} />
                      </td>
                      <td className="px-5 py-5 text-right font-mono text-sm font-bold text-white">
                        <NumberFlow value={Number.isNaN(Number(h.value)) ? 0 : Number(h.value)} format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
                      </td>
                      <td className="px-5 py-5 text-right font-mono text-sm text-gray-500">
                        {h.avg_cost > 0 ? <NumberFlow value={Number.isNaN(Number(h.avg_cost)) ? 0 : Number(h.avg_cost)} format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: h.avg_cost < 0.01 ? 6 : (h.avg_cost < 1 ? 4 : 2) }} /> : "—"}
                      </td>
                      <td className="px-5 py-5 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`font-mono text-sm font-bold flex items-center gap-0.5 ${p ? "text-green-400" : "text-red-400"}`}>
                            {p ? "+" : "-"}$<NumberFlow value={Number.isNaN(Number(h.pnl)) ? 0 : Math.abs(Number(h.pnl))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
                          </span>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${p ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            {p ? "▲" : "▼"} <NumberFlow value={Number.isNaN(Number(h.pnl_pct)) ? 0 : Math.abs(Number(h.pnl_pct))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/[0.05] rounded-3xl text-center">
          <Wallet size={48} className="text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-300 mb-2">No Assets Found</h3>
          <p className="text-sm text-gray-500 max-w-sm">Connect a wallet or import a CSV from your exchange to start tracking your portfolio.</p>
          {!showAddSource && (
            <button
              onClick={() => setShowAddSource(true)}
              className="mt-6 text-sm font-bold px-6 py-3 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all duration-300"
            >
              Add Data Source
            </button>
          )}
        </div>
      )}


        </div>

        {/* RIGHT COLUMN: Donut + AI Insights + Tax Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Donut */}
        <div className="w-full flex flex-col min-h-[380px] bg-[#16181c] border border-[#273951]/50 rounded-[32px] p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute left-1/2 top-1/2 w-[300px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-[80px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 group-hover:bg-[var(--accent)]/10 transition-all duration-700"></div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-4 shrink-0 relative z-10 flex items-center justify-center">
            {t('portfolio.asset_allocation')}
          </h3>
          
          <div className="flex-1 w-full relative min-h-[200px]">
            {holdings.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-500">{t('portfolio.no_assets')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RechartTooltip
                    formatter={(v) => fmtUSD(v)}
                    contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}
                    itemStyle={{ color: "var(--text-primary)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {pieData.length > 0 && (
            <div className="shrink-0 flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 pt-4 border-t border-white/[0.04]">
              {pieData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
              ))}
            </div>
          )}
        </div>

      {/* AI PORTFOLIO INSIGHTS */}
      {holdings.length > 0 && (
        <div className="mb-6 border border-[var(--accent)]/20 bg-[#16181c] rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 relative z-10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-1 flex items-center gap-2">
                <Brain size={14} /> {t('portfolio.ai_analysis.title')}
              </h3>
              <p className="text-sm text-gray-400">{t('portfolio.ai_analysis.desc')}</p>
            </div>
            
            <button 
              onClick={handleGetAIInsights}
              disabled={isAnalyzingAI}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] text-[var(--text-primary)] shadow-[0_0_20px_var(--accent-soft)] hover:shadow-[0_0_30px_var(--accent-border)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isAnalyzingAI ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> {t('portfolio.ai_analysis.analyzing')}</>
              ) : (
                <><Brain size={16} /> {t('portfolio.ai_analysis.generate')}</>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {aiError}
            </div>
          )}

            {aiInsights && (
              <div className="space-y-8 relative z-10 animate-fadeInDown mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-4">{t('portfolio.ai_analysis.risk')}</div>
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl shadow-lg shrink-0" style={{
                        backgroundColor: aiInsights.risk_score > 7 ? 'rgba(244,63,94,0.1)' : aiInsights.risk_score > 4 ? 'var(--accent-soft)' : 'rgba(45,212,191,0.1)',
                        color: aiInsights.risk_score > 7 ? '#F43F5E' : aiInsights.risk_score > 4 ? 'var(--accent)' : '#2DD4BF',
                        border: `1px solid ${aiInsights.risk_score > 7 ? 'rgba(244,63,94,0.3)' : aiInsights.risk_score > 4 ? 'var(--accent-soft)' : 'rgba(45,212,191,0.3)'}`
                      }}>
                        {aiInsights.risk_score}/10
                      </div>
                      <div>
                        <div className="text-xl font-black text-gray-200">{aiInsights.risk_label}</div>
                        <div className="text-sm text-gray-400 mt-1">BTC: <span className="text-gray-200 font-bold capitalize">{aiInsights.correlation_risk}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-4">{t('portfolio.ai_analysis.diversification')}</div>
                    <div className="flex items-center gap-5">
                       <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-lg shrink-0">
                        {aiInsights.diversification_score}/10
                      </div>
                      <div>
                        <div className="text-xl font-black text-gray-200">{aiInsights.dominant_sector}</div>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/[0.05]">
                <div className="text-xs font-bold text-gray-500 uppercase mb-3">{t('portfolio.ai_analysis.summary')}</div>
                <p className="text-base text-gray-300 leading-relaxed">{aiInsights.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10">
                  <div className="text-xs font-bold text-emerald-500/70 uppercase mb-4">{t('portfolio.ai_analysis.strengths')}</div>
                  <ul className="space-y-3">
                    {aiInsights.strengths?.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                        <span className="text-emerald-500 mt-0.5 shrink-0">•</span> <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 rounded-[32px] bg-red-500/5 border border-red-500/10">
                  <div className="text-xs font-bold text-red-500/70 uppercase mb-4">{t('portfolio.ai_analysis.risks')}</div>
                   <ul className="space-y-3">
                    {aiInsights.risks?.map((r, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                        <span className="text-red-500 mt-0.5 shrink-0">•</span> <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-[32px] bg-[var(--accent)]/5 border border-[var(--accent)]/20">
                <div className="text-xs font-bold text-[var(--accent)] uppercase mb-4">{t('portfolio.ai_analysis.recommendations')}</div>
                <ul className="space-y-4">
                  {aiInsights.recommendations?.map((r, i) => (
                    <li key={i} className="text-sm md:text-base text-[var(--accent)]/90 flex items-start gap-3">
                      <span className="text-[var(--accent)] mt-0.5 shrink-0">→</span> <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}


      {/* TAX SUMMARY */}
      {trades.length > 0 && taxData && (
        <div className="mb-10 bg-[#121212] border border-white/[0.05] rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-1">{t('portfolio.tax.title')}</h3>
              <p className="text-sm text-gray-400">{t('portfolio.tax.desc')}</p>
            </div>
            <button 
              onClick={() => exportTaxCSV(taxData)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all duration-300 shadow-[0_0_15px_var(--accent-soft)] hover:shadow-[0_0_20px_var(--accent-soft)] whitespace-nowrap"
            >
              <FileDown size={16} /> {t('portfolio.tax.export')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-[32px] bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">{t('portfolio.tax.short_term')}</div>
              <div className="text-2xl font-black font-mono text-gray-200"><NumberFlow value={Number(taxData.estShortTax) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} /></div>
              <div className="text-xs text-gray-500 mt-1">{t('portfolio.tax.held_short')}</div>
            </div>
            <div className="p-5 rounded-[32px] bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">{t('portfolio.tax.long_term')}</div>
              <div className="text-2xl font-black font-mono text-gray-200"><NumberFlow value={Number(taxData.estLongTax) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} /></div>
              <div className="text-xs text-gray-500 mt-1">{t('portfolio.tax.held_long')}</div>
            </div>
            <div className="p-5 rounded-[32px] bg-[var(--accent)]/5 border border-[var(--accent)]/20 relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-[var(--accent)]/10 rounded-full blur-2xl"></div>
              <div className="text-xs font-bold text-[var(--accent)]/70 uppercase mb-2 relative z-10">{t('portfolio.tax.total')}</div>
              <div className="text-3xl font-black font-mono text-[var(--accent)] relative z-10"><NumberFlow value={Number(taxData.estTotalTax) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} /></div>
            </div>
          </div>
        </div>
      )}


        </div>
      </div>

      {/* Empty state */}
      {holdings.length === 0 && trades.length === 0 && wallets.length === 0 && !binanceKeys.key && (
        <SoftCard className="text-center py-20">
          <BarChart2 size={36} className="mx-auto mb-4 text-gray-600" />
          <p className="font-semibold text-base mb-2 text-gray-400">{t('portfolio.empty.title')}</p>
          <p className="text-sm mb-6 text-gray-500">{t('portfolio.empty.desc')}</p>
          <button onClick={() => setShowAddSource(true)} 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[32px] font-bold text-sm bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all duration-300 shadow-[0_0_15px_var(--accent-soft)] hover:shadow-[0_0_20px_var(--accent-soft)]"
          >
            {t('portfolio.empty.btn')}
          </button>
        </SoftCard>
      )}

      {guide && <GuideModal exchange={guide} onClose={() => setGuide(null)} />}
    </div>
  );
}


