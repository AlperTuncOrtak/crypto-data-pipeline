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

export const STABLECOINS = ["USDT", "USDC", "DAI", "BUSD", "TUSD", "FDUSD", "USDP"];

// ── Trade types ───────────────────────────────────────────────
export interface Trade {
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  total?: number;
  traded_at: string;
  exchange?: string;
}

export interface Holding {
  symbol: string;
  name: string;
  slug: string;
  image_url?: string;
  quantity: number;
  wallet_quantity: number;
  trade_quantity: number;
  avg_cost: number;
  current_price: number;
  value: number;
  cost_basis: number;
  pnl: number;
  pnl_pct: number;
  change_24h: number;
  sources: string[];
  has_wallet_balance: boolean;
  /**
   * The same symbol can sit on several chains at once (USDC on Base and on
   * Ethereum are different tokens with different contracts). The table shows
   * one aggregated row, but anything that moves funds must act on a specific
   * chain, so the per-chain split is kept here.
   */
  chain_balances: ChainBalance[];
  /** True when at least one chain balance can be signed for. */
  withdrawable: boolean;
}

export interface ChainBalance {
  chain: string;
  chain_name: string;
  chain_id: number;
  quantity: number;
  /** Undefined means the chain's native coin. */
  contract_address?: string;
  decimals?: number;
}

/**
 * FIFO lot matching over a symbol's trade history.
 *
 * Returns what is still held (quantity + the cost actually paid for it) and
 * what was realized on the way out. Both the portfolio P&L and the tax report
 * are derived from this, so they can never disagree with each other.
 */
export interface Disposal {
  symbol: string;
  acquired: string;
  sold: string;
  quantity: number;
  proceeds: number;
  cost: number;
  gain: number;
  /** Held over a year — the usual long-term threshold. */
  longTerm: boolean;
  holdingDays: number;
  year: number;
}

const DAY_MS = 86_400_000;

function fifoLots(trades: Trade[], symbol = "") {
  const lots: { qty: number; price: number; date: string }[] = [];
  const disposals: Disposal[] = [];

  const sorted = trades
    .slice()
    .sort((a, b) => new Date(a.traded_at).getTime() - new Date(b.traded_at).getTime());

  for (const t of sorted) {
    const qty = Number(t.quantity) || 0;
    const price = Number(t.price) || 0;
    if (qty <= 0) continue;

    const side = String(t.side || "").toLowerCase();

    if (side === "sell") {
      let remaining = qty;
      // Each buy lot consumed by this sell becomes its own disposal line —
      // that is how a tax report has to read, because lots bought at
      // different times can fall on different sides of the long-term cutoff.
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const take = Math.min(lot.qty, remaining);
        const proceeds = take * price;
        const cost = take * lot.price;
        const holdingDays = Math.max(
          0,
          Math.floor((new Date(t.traded_at).getTime() - new Date(lot.date).getTime()) / DAY_MS)
        );

        disposals.push({
          symbol,
          acquired: lot.date,
          sold: t.traded_at,
          quantity: take,
          proceeds,
          cost,
          gain: proceeds - cost,
          longTerm: holdingDays > 365,
          holdingDays,
          year: new Date(t.traded_at).getFullYear(),
        });

        lot.qty -= take;
        remaining -= take;
        if (lot.qty <= 1e-12) lots.shift();
      }
      // A sell with no matching buys (e.g. partial CSV history) has no known
      // cost basis, so it produces no disposal rather than a phantom gain.
    } else {
      lots.push({ qty, price, date: t.traded_at });
    }
  }

  const openQty = lots.reduce((sum, l) => sum + l.qty, 0);
  const openCost = lots.reduce((sum, l) => sum + l.qty * l.price, 0);

  return { openQty, openCost, disposals };
}

function groupTradesBySymbol(trades: Trade[]) {
  const bySymbol: Record<string, Trade[]> = {};
  for (const t of trades || []) {
    if (!t?.symbol) continue;
    const sym = String(t.symbol).toUpperCase();
    (bySymbol[sym] ||= []).push(t);
  }
  return bySymbol;
}

// ── Holdings calculation ──────────────────────────────────────
export function calcHoldings(
  marketData: any[],
  walletHoldings: any[] = [],
  trades: Trade[] = []
): Holding[] {
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

  type Agg = {
    walletQty: number;
    sources: Set<string>;
    chains: ChainBalance[];
  };
  const bySymbol: Record<string, Agg> = {};

  const blank = (): Agg => ({
    walletQty: 0,
    sources: new Set<string>(),
    chains: [],
  });

  for (const wh of walletHoldings || []) {
    if (!wh?.symbol) continue;
    const sym = String(wh.symbol).toUpperCase();
    const qty = Number(wh.quantity) || 0;
    const agg = (bySymbol[sym] ||= blank());
    agg.walletQty += qty;
    agg.sources.add(wh.source || "Wallet");

    // Chain metadata only comes from on-chain sources; an exchange balance
    // must never inherit it, otherwise it would look withdrawable.
    if (wh.withdrawable && wh.chain_id) {
      const existing = agg.chains.find(
        (c) => c.chain_id === wh.chain_id && (c.contract_address || null) === (wh.contract_address || null)
      );
      if (existing) {
        existing.quantity += qty;
      } else {
        agg.chains.push({
          chain: wh.chain || "ethereum",
          chain_name: wh.chain_name || "Ethereum",
          chain_id: Number(wh.chain_id),
          quantity: qty,
          contract_address: wh.contract_address || undefined,
          decimals: wh.decimals === undefined || wh.decimals === null ? undefined : Number(wh.decimals),
        });
      }
    }
  }

  const tradesBySymbol = groupTradesBySymbol(trades);
  for (const sym of Object.keys(tradesBySymbol)) {
    bySymbol[sym] ||= blank();
  }

  const holdings: Holding[] = [];
  for (const [sym, agg] of Object.entries(bySymbol)) {
    const { openQty: tradeQty, openCost: tradeCost } = fifoLots(tradesBySymbol[sym] || []);
    const walletQty = agg.walletQty;
    const qty = walletQty + tradeQty;
    if (qty <= 0.000001) continue;

    const market = priceMap[sym] || {};
    const curPrice = market.price || 0;
    const value = qty * curPrice;

    // Wallet balances carry no purchase history, so their cost basis is marked
    // to market — they contribute 0 to P&L instead of a made-up number.
    const costBasis = tradeCost + walletQty * curPrice;
    const pnl = value - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    if (tradeQty > 0) agg.sources.add("Trades");

    holdings.push({
      symbol: sym,
      name: market.name || sym,
      slug: market.slug || sym.toLowerCase(),
      image_url: market.image_url,
      quantity: qty,
      wallet_quantity: walletQty,
      trade_quantity: tradeQty,
      avg_cost: qty > 0 ? costBasis / qty : 0,
      current_price: curPrice,
      value,
      cost_basis: costBasis,
      pnl,
      pnl_pct: pnlPct,
      change_24h: market.change24h || 0,
      sources: Array.from(agg.sources),
      has_wallet_balance: walletQty > 0,
      chain_balances: agg.chains.sort((a, b) => b.quantity - a.quantity),
      // Native coins have no contract; tokens without known decimals cannot be
      // encoded correctly, so they are deliberately not withdrawable.
      withdrawable: agg.chains.some(
        (c) => c.quantity > 0 && (!c.contract_address || c.decimals !== undefined)
      ),
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

export const calcBuyingPower = (holdings: Holding[]) =>
  holdings.filter((h) => STABLECOINS.includes(h.symbol)).reduce((sum, h) => sum + h.value, 0);

export const calcAllocation = (holdings: Holding[]) => {
  const total = holdings.reduce((sum, h) => sum + h.value, 0);
  if (total === 0) return [];
  return holdings.filter(h => h.value > 0).map((h, index) => ({
    name: h.symbol,
    value: h.value,
    pct: (h.value / total) * 100,
    color: COIN_COLORS[h.symbol] || CHART_COLORS[index % CHART_COLORS.length]
  })).sort((a, b) => b.value - a.value);
};

// ── Tax / realized P&L ────────────────────────────────────────
export interface TaxYear {
  year: number;
  proceeds: number;
  cost: number;
  gain: number;
  shortTermGain: number;
  longTermGain: number;
  disposalCount: number;
}

export interface TaxSummary {
  hasData: boolean;
  totalRealized: number;
  currentYear: number;
  currentYearRealized: number;
  currentYearProceeds: number;
  byYear: TaxYear[];
  disposals: Disposal[];
  disposalCount: number;
}

/**
 * Realized gains per calendar year using FIFO lot matching.
 *
 * This is a reporting aid, not tax advice — jurisdictions differ on lot
 * matching rules, holding-period thresholds and what counts as a disposal.
 */
export function calcTax(trades: Trade[] = []): TaxSummary {
  const currentYear = new Date().getFullYear();
  const byYearMap: Record<number, TaxYear> = {};
  const disposals: Disposal[] = [];

  const tradesBySymbol = groupTradesBySymbol(trades);
  for (const sym of Object.keys(tradesBySymbol)) {
    disposals.push(...fifoLots(tradesBySymbol[sym], sym).disposals);
  }

  for (const d of disposals) {
    const entry = (byYearMap[d.year] ||= {
      year: d.year,
      proceeds: 0,
      cost: 0,
      gain: 0,
      shortTermGain: 0,
      longTermGain: 0,
      disposalCount: 0,
    });
    entry.proceeds += d.proceeds;
    entry.cost += d.cost;
    entry.gain += d.gain;
    entry.disposalCount++;
    if (d.longTerm) entry.longTermGain += d.gain;
    else entry.shortTermGain += d.gain;
  }

  disposals.sort((a, b) => new Date(b.sold).getTime() - new Date(a.sold).getTime());

  const byYear = Object.values(byYearMap).sort((a, b) => b.year - a.year);
  const thisYear = byYearMap[currentYear];

  return {
    hasData: disposals.length > 0,
    totalRealized: byYear.reduce((sum, y) => sum + y.gain, 0),
    currentYear,
    currentYearRealized: thisYear?.gain || 0,
    currentYearProceeds: thisYear?.proceeds || 0,
    byYear,
    disposals,
    disposalCount: disposals.length,
  };
}

// ── CSV import ────────────────────────────────────────────────
const QUOTE_CURRENCIES = ["USDT", "USDC", "BUSD", "FDUSD", "TUSD", "USD", "EUR", "TRY", "BTC", "ETH", "BNB"];

function detectDelimiter(headerLine: string) {
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const c of candidates) {
    const count = headerLine.split(c).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

/** Split one CSV line, honouring double-quoted fields containing the delimiter. */
function splitLine(line: string, delimiter: string) {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim().replace(/^"|"$/g, "").trim());
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function findColumn(headers: string[], candidates: string[]) {
  const normalized = headers.map(norm);
  // Exact match first so "amount" doesn't get stolen by "quoteamount".
  for (const cand of candidates) {
    const idx = normalized.indexOf(norm(cand));
    if (idx !== -1) return idx;
  }
  for (const cand of candidates) {
    const idx = normalized.findIndex((h) => h.includes(norm(cand)));
    if (idx !== -1) return idx;
  }
  return -1;
}

/** "0.5BTC" → 0.5 ; "1,234.56 USDT" → 1234.56 ; "(12.5)" → -12.5 */
function parseAmount(raw: string) {
  if (!raw) return NaN;
  let s = raw.trim();
  const negative = /^\(.*\)$/.test(s);
  s = s.replace(/[()]/g, "");
  // Strip any trailing/leading currency code or symbol.
  s = s.replace(/[^0-9.,\-+eE]/g, "");
  // European decimals: "1.234,56" → "1234.56"
  if (/,\d{1,2}$/.test(s) && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  if (isNaN(n)) return NaN;
  return negative ? -n : n;
}

/** "BTC/USDT" | "BTCUSDT" | "BTC-USD" → "BTC" */
function baseSymbol(raw: string) {
  if (!raw) return "";
  let s = raw.trim().toUpperCase();
  const sep = s.match(/^([A-Z0-9]+)[\/\-_](.+)$/);
  if (sep) return sep[1];
  for (const q of QUOTE_CURRENCIES) {
    if (s.length > q.length && s.endsWith(q)) return s.slice(0, -q.length);
  }
  return s;
}

function parseSide(raw: string) {
  const s = (raw || "").toLowerCase();
  if (s.includes("sell") || s.includes("sat")) return "sell";
  if (s.includes("buy") || s.includes("al")) return "buy";
  return "";
}

function parseDate(raw: string) {
  if (!raw) return null;
  const s = raw.trim();
  // "2024-01-15 13:45:00" is not valid ISO in Safari; the T form is.
  const isoish = s.includes(" ") && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.replace(" ", "T") : s;
  let d = new Date(isoish);
  if (!isNaN(d.getTime())) return d;
  // DD/MM/YYYY or DD.MM.YYYY
  const m = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})(.*)$/);
  if (m) {
    d = new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}${m[4] ? "T" + m[4].trim() : ""}`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export interface ParseResult {
  trades: Trade[];
  count: number;
  skipped: number;
}

/**
 * Parses a trade-history CSV exported from Binance / Bybit / OKX, or any file
 * with recognisable date / pair / side / price / quantity columns.
 * Throws with a readable reason when the file clearly isn't a trade history.
 */
export function parseCSV(text: string, exchangeName?: string): ParseResult {
  if (!text || !text.trim()) throw new Error("The file is empty.");

  const lines = text
    .split(/\r\n|\n|\r/)
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) throw new Error("The file has no data rows.");

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter);

  const dateIdx = findColumn(headers, ["date(utc)", "utc_time", "traded_at", "order time", "create time", "filled time", "timestamp", "date", "time"]);
  const pairIdx = findColumn(headers, ["pair", "symbol", "market", "instrument", "contracts", "coin", "asset", "currency"]);
  const sideIdx = findColumn(headers, ["side", "trade side", "direction", "type", "operation"]);
  const priceIdx = findColumn(headers, ["price", "filled price", "avg price", "average price", "execution price", "trade price"]);
  const qtyIdx = findColumn(headers, ["executed", "filled qty", "quantity", "qty", "amount", "size", "filled", "volume"]);
  const totalIdx = findColumn(headers, ["total", "quote amount", "amount total", "value", "turnover", "cost"]);

  const missing: string[] = [];
  if (pairIdx === -1) missing.push("pair/symbol");
  if (qtyIdx === -1) missing.push("quantity");
  if (priceIdx === -1) missing.push("price");
  if (missing.length > 0) {
    throw new Error(
      `Could not find the ${missing.join(", ")} column${missing.length > 1 ? "s" : ""}. ` +
        `Detected headers: ${headers.slice(0, 8).join(", ")}`
    );
  }

  const trades: Trade[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter);
    if (cells.length < 2) continue;

    const symbol = baseSymbol(cells[pairIdx] || "");
    const quantity = parseAmount(cells[qtyIdx] || "");
    const price = parseAmount(cells[priceIdx] || "");
    const side = sideIdx !== -1 ? parseSide(cells[sideIdx] || "") : "buy";
    const date = dateIdx !== -1 ? parseDate(cells[dateIdx] || "") : new Date();

    if (!symbol || !side || !isFinite(quantity) || quantity <= 0 || !isFinite(price) || price < 0) {
      skipped++;
      continue;
    }

    const parsedTotal = totalIdx !== -1 ? parseAmount(cells[totalIdx] || "") : NaN;

    trades.push({
      symbol,
      side,
      quantity: Math.abs(quantity),
      price,
      total: isFinite(parsedTotal) ? Math.abs(parsedTotal) : Math.abs(quantity) * price,
      traded_at: (date || new Date()).toISOString(),
      exchange: exchangeName || "CSV Import",
    });
  }

  if (trades.length === 0) {
    throw new Error(
      `No valid transactions found${skipped > 0 ? ` (${skipped} row${skipped > 1 ? "s" : ""} could not be read)` : ""}.`
    );
  }

  return { trades, count: trades.length, skipped };
}
