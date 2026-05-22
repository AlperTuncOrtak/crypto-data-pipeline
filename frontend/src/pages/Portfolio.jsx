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
function detectExchange(headers) {
  const h = headers.map((x) => x.toLowerCase());
  if (h.includes("pair") && h.includes("executed")) return "binance";
  if (h.includes("symbol") && h.includes("qty")) return "bybit";
  if (h.includes("instrument")) return "okx";
  if (h.includes("asset") && h.includes("quantity transacted"))
    return "coinbase";
  if (h.includes("txid") && h.includes("vol")) return "kraken";
  return "generic";
}

function parseCSV(text) {
  const lines = text
    .trim()
    .split("\n")
    .filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV too short");

  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  const exchange = detectExchange(headers);
  const trades = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.replace(/"/g, "").trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] || "";
    });

    try {
      let trade = null;

      if (exchange === "binance") {
        const [base] = (row["Pair"] || "").replace("USDT", "|").split("|");
        if (!base) continue;
        trade = {
          symbol: base.trim(),
          side: (row["Side"] || "").toLowerCase() === "buy" ? "buy" : "sell",
          quantity: parseFloat(row["Executed"] || 0),
          price: parseFloat(row["Price"] || 0),
          total: parseFloat(row["Amount"] || 0),
          fee: parseFloat((row["Fee"] || "0").replace(/[^0-9.]/g, "")) || 0,
          traded_at: new Date(row["Date"]).toISOString(),
          exchange: "binance",
        };
      } else if (exchange === "bybit") {
        const sym = (row["Symbol"] || "").replace("USDT", "");
        trade = {
          symbol: sym,
          side: (row["Side"] || "").toLowerCase(),
          quantity: parseFloat(row["Qty"] || 0),
          price: parseFloat(row["Price"] || 0),
          total: parseFloat(row["Value"] || 0),
          fee: parseFloat(row["Fee"] || 0),
          traded_at: new Date(row["Time"]).toISOString(),
          exchange: "bybit",
        };
      } else if (exchange === "okx") {
        const inst = row["Instrument"] || "";
        const sym = inst.split("-")[0];
        trade = {
          symbol: sym,
          side: (row["Trade Side"] || "").toLowerCase().includes("buy")
            ? "buy"
            : "sell",
          quantity: parseFloat(row["Filled Amount"] || 0),
          price: parseFloat(row["Filled Price"] || 0),
          total: parseFloat(row["Total"] || 0),
          fee: 0,
          traded_at: new Date(row["Order Time"]).toISOString(),
          exchange: "okx",
        };
      } else if (exchange === "coinbase") {
        if (!["Buy", "Sell"].includes(row["Transaction Type"])) continue;
        trade = {
          symbol: row["Asset"] || "",
          side: row["Transaction Type"].toLowerCase(),
          quantity: parseFloat(row["Quantity Transacted"] || 0),
          price:
            parseFloat((row["Spot Price"] || "").replace(/[^0-9.]/g, "")) || 0,
          total: parseFloat((row["Total"] || "").replace(/[^0-9.]/g, "")) || 0,
          fee: 0,
          traded_at: new Date(row["Timestamp"]).toISOString(),
          exchange: "coinbase",
        };
      } else if (exchange === "kraken") {
        const pair = row["pair"] || "";
        const sym = pair
          .replace(/USD$|USDT$|EUR$/, "")
          .replace(/^X/, "")
          .replace(/^Z/, "");
        trade = {
          symbol: sym,
          side: row["type"] === "buy" ? "buy" : "sell",
          quantity: parseFloat(row["vol"] || 0),
          price: parseFloat(row["price"] || 0),
          total: parseFloat(row["cost"] || 0),
          fee: parseFloat(row["fee"] || 0),
          traded_at: new Date(row["time"]).toISOString(),
          exchange: "kraken",
        };
      }

      if (trade && trade.quantity > 0 && trade.price > 0 && trade.symbol) {
        trades.push(trade);
      }
    } catch (e) {
      /* skip bad row */
    }
  }

  return { trades, exchange, count: trades.length };
}

// ── Holdings hesapla (FIFO) ───────────────────────────────────
function calcHoldings(trades, marketData) {
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
    if (!bySymbol[sym]) bySymbol[sym] = { buys: [], sells: [] };
    if (t.side === "buy") bySymbol[sym].buys.push(t);
    else bySymbol[sym].sells.push(t);
  }

  const holdings = [];
  for (const [sym, { buys, sells }] of Object.entries(bySymbol)) {
    const totalBought = buys.reduce((s, t) => s + t.quantity, 0);
    const totalSold = sells.reduce((s, t) => s + t.quantity, 0);
    const qty = totalBought - totalSold;
    if (qty <= 0.000001) continue;

    const totalCost = buys.reduce((s, t) => s + t.total, 0);
    const avgCost = totalBought > 0 ? totalCost / totalBought : 0;

    const market = priceMap[sym] || {};
    const curPrice = market.price || 0;
    const value = qty * curPrice;
    const costBasis = qty * avgCost;
    const pnl = value - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

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

function AIPortfolioCard({ holdings, totalValue, totalPnl }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  if (!result)
    return (
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
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
            borderRadius: 12,
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
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
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
              borderRadius: 12,
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

// ── Main Component ────────────────────────────────────────────
export default function Portfolio() {
  const { user, isLoggedIn, isPro, isEnterprise } = useAuth();
  const navigate = useNavigate();
  const { data: marketData } = useMarket(500);
  const fileRef = useRef(null);

  const [trades, setTrades] = useState([]);
  const [importing, setImporting] = useState(false);

  // Supabase'den trades yukle
  useEffect(() => {
    if (!user) return;
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("traded_at", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setTrades(data);
      });
  }, [user]);
  const [importResult, setImportResult] = useState(null);
  const [guide, setGuide] = useState(null);
  const [activeTab, setActiveTab] = useState("holdings"); // holdings | tax | trades
  const [showGuides, setShowGuides] = useState(false);
  const [error, setError] = useState("");

  const holdings = useMemo(
    () => calcHoldings(trades, marketData),
    [trades, marketData],
  );
  const totalValue = useMemo(
    () => holdings.reduce((s, h) => s + h.value, 0),
    [holdings],
  );
  const totalCost = useMemo(
    () => holdings.reduce((s, h) => s + h.cost_basis, 0),
    [holdings],
  );
  const totalPnl = useMemo(
    () => totalValue - totalCost,
    [totalValue, totalCost],
  );
  const taxData = useMemo(() => calcTax(trades), [trades]);

  const pieData = useMemo(
    () =>
      holdings.slice(0, 8).map((h, i) => ({
        name: h.symbol,
        value: h.value,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [holdings],
  );

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setImporting(true);
    setError("");
    try {
      const text = await file.text();
      const { trades: parsed, exchange, count } = parseCSV(text);
      if (count === 0)
        throw new Error("No valid trades found. Check the file format.");
      setTrades((prev) => [...prev, ...parsed]);
      setImportResult({ exchange, count, filename: file.name });
      // Supabase'e kaydet
      if (user) {
        const rows = parsed.map((t) => ({
          user_id: user.id,
          exchange: t.exchange || exchange,
          symbol: t.symbol,
          side: t.side,
          quantity: t.quantity,
          price: t.price,
          fee: t.fee || 0,
          traded_at: t.traded_at || new Date().toISOString(),
        }));
        supabase
          .from("trades")
          .insert(rows)
          .then(({ error }) => {
            if (error) console.error("Trade save error:", error);
          });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div style={{ color: "var(--text-primary)", maxWidth: 1100 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Wallet size={24} style={{ color: "var(--accent)" }} /> Portfolio
            Tracker
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Import your trade history · AI analysis · Tax reporting
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowGuides((s) => !s)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-secondary)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <BookOpen size={14} /> How to export
          </button>
          {trades.length > 0 && (
            <button
              onClick={() => setTrades([])}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid rgba(231,76,60,0.3)",
                background: "rgba(231,76,60,0.06)",
                color: "#e74c3c",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* EXCHANGE GUIDES */}
      {showGuides && (
        <div
          style={{
            marginBottom: 24,
            padding: "20px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 14,
              color: "var(--text-secondary)",
            }}
          >
            Select your exchange to see export instructions:
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.entries(EXCHANGE_GUIDES).map(([key, g]) => (
              <button
                key={key}
                onClick={() => setGuide(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: `1px solid ${g.color}30`,
                  background: `${g.color}08`,
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = g.color)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = `${g.color}30`)
                }
              >
                <span>{g.logo}</span> {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* IMPORT ZONE */}
      {trades.length === 0 ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "2px dashed var(--border)",
            borderRadius: 16,
            padding: "48px 24px",
            textAlign: "center",
            marginBottom: 24,
            cursor: "pointer",
            transition: "border-color 0.2s",
          }}
          onClick={() => fileRef.current?.click()}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "var(--accent)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--border)")
          }
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <Upload
            size={36}
            style={{
              color: "var(--text-muted)",
              margin: "0 auto 16px",
              display: "block",
            }}
          />
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Drop your CSV file here
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 20,
            }}
          >
            Supports Binance, Bybit, OKX, Coinbase, Kraken
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {Object.values(EXCHANGE_GUIDES).map((g) => (
              <span
                key={g.name}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "var(--bg-elevated)",
                  color: "var(--text-muted)",
                }}
              >
                {g.logo} {g.name}
              </span>
            ))}
          </div>
          {importing && (
            <div
              style={{ marginTop: 16, color: "var(--accent)", fontSize: 13 }}
            >
              Parsing CSV...
            </div>
          )}
          {error && (
            <div style={{ marginTop: 16, color: "#e74c3c", fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Import success banner */}
          {importResult && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "rgba(46,204,113,0.08)",
                border: "1px solid rgba(46,204,113,0.25)",
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={16} style={{ color: "#2ecc71" }} />
                <span
                  style={{ fontSize: 13, color: "#2ecc71", fontWeight: 600 }}
                >
                  {importResult.count} trades imported from{" "}
                  {importResult.filename} ({importResult.exchange})
                </span>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                + Add more
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          )}

          {/* STATS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: "Total Value",
                value: fmtUSD(totalValue),
                color: "var(--text-primary)",
              },
              {
                label: "Total Cost",
                value: fmtUSD(totalCost),
                color: "var(--text-muted)",
              },
              {
                label: "Total P&L",
                value: fmtUSD(totalPnl),
                color: totalPnl >= 0 ? "#2ecc71" : "#e74c3c",
                sub: fmtPct(totalCost > 0 ? (totalPnl / totalCost) * 100 : 0),
              },
              {
                label: "Holdings",
                value: holdings.length + " coins",
                color: "var(--accent)",
              },
              {
                label: "Total Trades",
                value: trades.length,
                color: "var(--text-secondary)",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "16px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: s.color,
                    fontFamily: "monospace",
                  }}
                >
                  {s.value}
                </div>
                {s.sub && (
                  <div style={{ fontSize: 12, color: s.color, opacity: 0.8 }}>
                    {s.sub}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PIE + AI */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "340px 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Pie chart */}
            <div
              style={{
                padding: "20px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 16,
                }}
              >
                Allocation
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartTooltip formatter={(v) => [fmtUSD(v), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 12,
                }}
              >
                {pieData.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: d.color,
                        }}
                      />
                      <span
                        style={{ fontSize: 12, color: "var(--text-secondary)" }}
                      >
                        {d.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                      }}
                    >
                      {totalValue > 0
                        ? ((d.value / totalValue) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis */}
            <AIPortfolioCard
              holdings={holdings}
              totalValue={totalValue}
              totalPnl={totalPnl}
            />
          </div>

          {/* TABS */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 16,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 4,
              width: "fit-content",
            }}
          >
            {[
              { id: "holdings", label: "Holdings", icon: BarChart2 },
              { id: "tax", label: "Tax Report", icon: FileDown },
              {
                id: "trades",
                label: `All Trades (${trades.length})`,
                icon: TrendingUp,
              },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: activeTab === id ? 600 : 400,
                  cursor: "pointer",
                  border: "none",
                  background:
                    activeTab === id ? "var(--bg-elevated)" : "transparent",
                  color:
                    activeTab === id
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* HOLDINGS TAB */}
          {activeTab === "holdings" && (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {[
                      "Asset",
                      "Quantity",
                      "Avg Cost",
                      "Current Price",
                      "Value",
                      "P&L",
                      "24h",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign: h === "Asset" ? "left" : "right",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => (
                    <tr
                      key={h.symbol}
                      style={{
                        borderBottom: "1px solid var(--border-soft)",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--bg-elevated)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              background: CHART_COLORS[i % CHART_COLORS.length],
                            }}
                          />
                          {h.image_url && (
                            <img
                              src={h.image_url}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                              }}
                              alt={h.symbol}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                              {h.symbol}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {h.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontSize: 13,
                        }}
                      >
                        {fmtNum(h.quantity)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontSize: 13,
                        }}
                      >
                        {fmtUSD(h.avg_cost)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontSize: 13,
                        }}
                      >
                        {fmtUSD(h.current_price)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {fmtUSD(h.value)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: h.pnl >= 0 ? "#2ecc71" : "#e74c3c",
                            fontFamily: "monospace",
                          }}
                        >
                          {fmtUSD(h.pnl)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: h.pnl >= 0 ? "#2ecc71" : "#e74c3c",
                          }}
                        >
                          {fmtPct(h.pnl_pct)}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontSize: 13,
                          color: h.change_24h >= 0 ? "#2ecc71" : "#e74c3c",
                          fontFamily: "monospace",
                        }}
                      >
                        {fmtPct(h.change_24h)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAX TAB */}
          {activeTab === "tax" && (
            <div>
              {/* Disclaimer */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "10px 14px",
                  background: "rgba(245,166,35,0.06)",
                  border: "1px solid rgba(245,166,35,0.2)",
                  borderRadius: 10,
                  marginBottom: 20,
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
                  Tax estimates use 30% short-term and 15% long-term rates for
                  illustration only. Consult a tax professional for your
                  jurisdiction. FIFO method applied.
                </span>
              </div>

              {/* Ana metrikler */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {[
                  {
                    label: "Short-Term Gains",
                    value: fmtUSD(taxData.shortGain),
                    color: taxData.shortGain >= 0 ? "#2ecc71" : "#e74c3c",
                    sub: `${taxData.shortTerm.length} transactions`,
                  },
                  {
                    label: "Long-Term Gains",
                    value: fmtUSD(taxData.longGain),
                    color: taxData.longGain >= 0 ? "#2ecc71" : "#e74c3c",
                    sub: `${taxData.longTerm.length} transactions`,
                  },
                  {
                    label: "Net Realized P&L",
                    value: fmtUSD(taxData.net),
                    color: taxData.net >= 0 ? "#2ecc71" : "#e74c3c",
                    sub: "All trades",
                  },
                  {
                    label: "Est. Short-Term Tax",
                    value: fmtUSD(taxData.estShortTax),
                    color: "#e74c3c",
                    sub: "30% rate",
                  },
                  {
                    label: "Est. Long-Term Tax",
                    value: fmtUSD(taxData.estLongTax),
                    color: "#f5a623",
                    sub: "15% rate",
                  },
                  {
                    label: "Est. Total Tax",
                    value: fmtUSD(taxData.estTotalTax),
                    color: "#e74c3c",
                    sub: "Estimate only",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      padding: "14px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 6,
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: s.color,
                        fontFamily: "monospace",
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coin bazında özet */}
              {Object.keys(taxData.byCoin).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 10,
                    }}
                  >
                    By Asset
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.entries(taxData.byCoin)
                      .sort((a, b) => Math.abs(b[1].gain) - Math.abs(a[1].gain))
                      .map(([sym, data]) => (
                        <div
                          key={sym}
                          style={{
                            padding: "8px 14px",
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: 13 }}>
                            {sym}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontFamily: "monospace",
                              color: data.gain >= 0 ? "#2ecc71" : "#e74c3c",
                              fontWeight: 600,
                            }}
                          >
                            {fmtUSD(data.gain)}
                          </span>
                          <span
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            {data.count} trades
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Export butonları */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginBottom: 12,
                }}
              >
                <button
                  onClick={() => exportTaxCSV(taxData)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 18px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #f5a623, #e8941a)",
                    color: "#111",
                    fontWeight: 700,
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <FileDown size={14} /> Export CSV
                </button>
              </div>

              {/* Yıl bazında işlem tabloları */}
              {Object.entries(taxData.byYear)
                .sort((a, b) => b[0] - a[0])
                .map(([year, yearTrades]) => {
                  const yearGain = yearTrades.reduce((s, r) => s + r.gain, 0);
                  const yearShort = yearTrades
                    .filter((r) => !r.isLongTerm)
                    .reduce((s, r) => s + r.gain, 0);
                  const yearLong = yearTrades
                    .filter((r) => r.isLongTerm)
                    .reduce((s, r) => s + r.gain, 0);
                  return (
                    <div key={year} style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <span style={{ fontSize: 15, fontWeight: 700 }}>
                            {year}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: yearGain >= 0 ? "#2ecc71" : "#e74c3c",
                              fontFamily: "monospace",
                              fontWeight: 600,
                            }}
                          >
                            Net: {fmtUSD(yearGain)}
                          </span>
                          <span
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            Short: {fmtUSD(yearShort)} · Long:{" "}
                            {fmtUSD(yearLong)}
                          </span>
                        </div>
                        <span
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          {yearTrades.length} transactions
                        </span>
                      </div>
                      <div
                        style={{
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          overflow: "hidden",
                        }}
                      >
                        <table
                          style={{ width: "100%", borderCollapse: "collapse" }}
                        >
                          <thead>
                            <tr
                              style={{
                                borderBottom: "1px solid var(--border)",
                              }}
                            >
                              {[
                                "Symbol",
                                "Type",
                                "Buy Date",
                                "Sell Date",
                                "Hold",
                                "Qty",
                                "Buy Price",
                                "Sell Price",
                                "Gain/Loss",
                              ].map((h) => (
                                <th
                                  key={h}
                                  style={{
                                    padding: "10px 14px",
                                    textAlign:
                                      h === "Symbol" || h === "Type"
                                        ? "left"
                                        : "right",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {yearTrades.map((r, i) => (
                              <tr
                                key={i}
                                style={{
                                  borderBottom: "1px solid var(--border-soft)",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    fontWeight: 600,
                                    fontSize: 13,
                                  }}
                                >
                                  {r.symbol}
                                </td>
                                <td style={{ padding: "9px 14px" }}>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      background: r.isLongTerm
                                        ? "rgba(46,204,113,0.1)"
                                        : "rgba(245,166,35,0.1)",
                                      color: r.isLongTerm
                                        ? "#2ecc71"
                                        : "#f5a623",
                                    }}
                                  >
                                    {r.isLongTerm ? "LONG" : "SHORT"}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    textAlign: "right",
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {new Date(r.buy_date).toLocaleDateString()}
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    textAlign: "right",
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {new Date(r.sell_date).toLocaleDateString()}
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    textAlign: "right",
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {r.holdDays}d
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    textAlign: "right",
                                    fontFamily: "monospace",
                                    fontSize: 11,
                                  }}
                                >
                                  {r.qty.toFixed(4)}
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    textAlign: "right",
                                    fontFamily: "monospace",
                                    fontSize: 11,
                                  }}
                                >
                                  {fmtUSD(r.buy_price)}
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    textAlign: "right",
                                    fontFamily: "monospace",
                                    fontSize: 11,
                                  }}
                                >
                                  {fmtUSD(r.sell_price)}
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    textAlign: "right",
                                    fontFamily: "monospace",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: r.gain >= 0 ? "#2ecc71" : "#e74c3c",
                                  }}
                                >
                                  {fmtUSD(r.gain)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              {taxData.allRealized.length === 0 && (
                <div
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 13,
                  }}
                >
                  No realized trades found. Sell some coins to see tax data.
                </div>
              )}
            </div>
          )}

          {/* TRADES TAB */}
          {activeTab === "trades" && (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {[
                      "Date",
                      "Symbol",
                      "Side",
                      "Qty",
                      "Price",
                      "Total",
                      "Exchange",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign:
                            h === "Symbol" || h === "Date" ? "left" : "right",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...trades]
                    .sort(
                      (a, b) => new Date(b.traded_at) - new Date(a.traded_at),
                    )
                    .slice(0, 100)
                    .map((t, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: "1px solid var(--border-soft)" }}
                      >
                        <td
                          style={{
                            padding: "10px 16px",
                            fontSize: 12,
                            color: "var(--text-muted)",
                          }}
                        >
                          {new Date(t.traded_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "10px 16px", fontWeight: 600 }}>
                          {t.symbol}
                        </td>
                        <td
                          style={{ padding: "10px 16px", textAlign: "right" }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 5,
                              background:
                                t.side === "buy"
                                  ? "rgba(46,204,113,0.12)"
                                  : "rgba(231,76,60,0.12)",
                              color: t.side === "buy" ? "#2ecc71" : "#e74c3c",
                            }}
                          >
                            {t.side.toUpperCase()}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            textAlign: "right",
                            fontFamily: "monospace",
                            fontSize: 12,
                          }}
                        >
                          {fmtNum(t.quantity)}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            textAlign: "right",
                            fontFamily: "monospace",
                            fontSize: 12,
                          }}
                        >
                          {fmtUSD(t.price)}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            textAlign: "right",
                            fontFamily: "monospace",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {fmtUSD(t.total)}
                        </td>
                        <td
                          style={{
                            padding: "10px 16px",
                            textAlign: "right",
                            fontSize: 12,
                            color: "var(--text-muted)",
                          }}
                        >
                          {t.exchange || "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {guide && <GuideModal exchange={guide} onClose={() => setGuide(null)} />}
    </div>
  );
}
