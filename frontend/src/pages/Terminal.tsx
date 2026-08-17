import { useState, useEffect, useRef, useCallback } from "react";
import { createChart, CrosshairMode, IChartApi, ISeriesApi } from "lightweight-charts";
import { 
  Star, Bell, ChevronDown, ArrowUpDown, Settings,
  Maximize2, Minimize2, X, Info, Plus
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface OrderBookEntry { price: number; size: number; total: number; }
interface Trade { price: number; size: number; side: "buy" | "sell"; time: string; }
interface TickerInfo { symbol: string; name: string; last: number; change24h: number; changePct24h: number; high24h: number; low24h: number; vol24h: number; }

// ─── Mock Data Generators ─────────────────────────────────────────────────────
function genOrderBook(mid: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  let bidTotal = 0, askTotal = 0;
  for (let i = 0; i < 20; i++) {
    const bp = mid - (i + 1) * 0.5 - Math.random() * 0.3;
    const bs = parseFloat((Math.random() * 2 + 0.01).toFixed(4));
    bidTotal += bs;
    bids.push({ price: bp, size: bs, total: parseFloat(bidTotal.toFixed(4)) });
    const ap = mid + (i + 1) * 0.5 + Math.random() * 0.3;
    const as_ = parseFloat((Math.random() * 2 + 0.01).toFixed(4));
    askTotal += as_;
    asks.push({ price: ap, size: as_, total: parseFloat(askTotal.toFixed(4)) });
  }
  return { bids, asks };
}

function genTrades(mid: number): Trade[] {
  const trades: Trade[] = [];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const side = Math.random() > 0.5 ? "buy" : "sell";
    const price = mid + (Math.random() - 0.5) * 4;
    const size = parseFloat((Math.random() * 1.5 + 0.001).toFixed(6));
    const t = new Date(now.getTime() - i * 3000);
    trades.push({ price, size, side, time: t.toLocaleTimeString() });
  }
  return trades;
}

// ─── Candlestick Chart Component ─────────────────────────────────────────────
function CandleChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [interval, setInterval_] = useState("5m");

  const intervals = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];

  const generateCandles = useCallback(() => {
    const candles = [];
    let base = 62168;
    const now = Math.floor(Date.now() / 1000);
    const secs = interval === "1m" ? 60 : interval === "5m" ? 300 : interval === "15m" ? 900
      : interval === "1H" ? 3600 : interval === "4H" ? 14400 : interval === "1D" ? 86400 : 604800;
    for (let i = 299; i >= 0; i--) {
      const time = now - i * secs;
      const o = base + (Math.random() - 0.5) * 80;
      const c = o + (Math.random() - 0.5) * 120;
      const h = Math.max(o, c) + Math.random() * 40;
      const l = Math.min(o, c) - Math.random() * 40;
      const rootStyle = getComputedStyle(document.documentElement);
      const textColor = rootStyle.getPropertyValue('--text-muted').trim() || "#848e9c";
      const borderColor = rootStyle.getPropertyValue('--border-base').trim() || "#1c1d20";
      const upColor = rootStyle.getPropertyValue('--positive').trim() || "#26a69a";
      const downColor = rootStyle.getPropertyValue('--negative').trim() || "#ef5350";

      candles.push({ 
        time: time as any, 
        open: o, high: h, low: l, close: c, 
        value: Math.random() * 50 + 5, 
        color: c >= o ? upColor : downColor 
      });
      base = c;
    }
    return candles;
  }, [interval]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const rootStyle = getComputedStyle(document.documentElement);
    const textColor = rootStyle.getPropertyValue('--text-muted').trim() || "#848e9c";
    const borderColor = rootStyle.getPropertyValue('--border-base').trim() || "#1c1d20";
    const upColor = rootStyle.getPropertyValue('--positive').trim() || "#26a69a";
    const downColor = rootStyle.getPropertyValue('--negative').trim() || "#ef5350";

    const chart = createChart(containerRef.current, {
      layout: { background: { color: "transparent" }, textColor: textColor },
      grid: { vertLines: { color: borderColor }, horzLines: { color: borderColor } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: borderColor },
      timeScale: { borderColor: borderColor, timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: upColor, downColor: downColor,
      borderUpColor: upColor, borderDownColor: downColor,
      wickUpColor: upColor, wickDownColor: downColor,
    });
    candleRef.current = candleSeries;

    const volSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    volRef.current = volSeries;

    const candles = generateCandles();
    candleSeries.setData(candles.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
    volSeries.setData(candles.map(({ time, value, color }) => ({ time, value, color })));
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [interval, symbol, generateCandles]);

  return (
    <div className="flex flex-col h-full">
      {/* Chart Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border-base)] shrink-0">
        <button className="px-2 py-1 text-[11px] rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-base)] transition-colors">Price chart</button>
        <button className="px-2 py-1 text-[11px] rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-base)] transition-colors">Depth chart</button>
        <div className="w-px h-4 bg-[var(--border-base)] mx-1" />
        {intervals.map(iv => (
          <button key={iv} onClick={() => setInterval_(iv)}
            className={`px-2 py-1 text-[11px] rounded transition-colors ${interval === iv ? "bg-[var(--border-base)] text-[var(--text-main)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-base)]"}`}>
            {iv}
          </button>
        ))}
        <div className="w-px h-4 bg-[var(--border-base)] mx-1" />
        <button className="px-2 py-1 text-[11px] rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-base)] transition-colors flex items-center gap-1">
          <span>Indicators</span>
        </button>
      </div>

      {/* Drawing tools (left) + Chart */}
      <div className="flex flex-1 min-h-0">
        {/* Drawing toolbar */}
        <div className="w-8 flex flex-col items-center pt-2 gap-1 border-r border-[var(--border-base)] shrink-0">
          {["↖", "✏", "📐", "≡", "◯", "📊", "🔍"].map((icon, i) => (
            <button key={i} className="w-7 h-7 flex items-center justify-center text-[12px] text-[var(--text-muted)] hover:bg-[var(--border-base)] rounded transition-colors">
              {icon}
            </button>
          ))}
        </div>
        {/* Actual chart */}
        <div ref={containerRef} className="flex-1 min-w-0" />
      </div>

      {/* Bottom time controls */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--border-base)] shrink-0">
        {["6M","3M","1M","5D","1D","4H","1H"].map(t => (
          <button key={t} className="px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-base)] rounded transition-colors">{t}</button>
        ))}
        <div className="flex-1" />
        <span className="text-[10px] text-[var(--text-muted)]">
          {new Date().toLocaleTimeString()} UTC+3
        </span>
        <span className="ml-2 text-[10px] text-[var(--text-muted)]">LOG</span>
        <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[var(--border-base)] text-[var(--warning)] rounded">AUTO</span>
      </div>
    </div>
  );
}

// ─── Order Book Component ─────────────────────────────────────────────────────
function OrderBook({ mid }: { mid: number }) {
  const [data, setData] = useState(() => genOrderBook(mid));

  useEffect(() => {
    const t = setInterval(() => setData(genOrderBook(mid)), 1500);
    return () => clearInterval(t);
  }, [mid]);

  const maxTotal = Math.max(data.bids[data.bids.length - 1]?.total ?? 1, data.asks[data.asks.length - 1]?.total ?? 1);

  return (
    <div className="flex flex-col h-full text-[11px]">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--border-base)] shrink-0">
        <span className="text-[11px] text-[var(--text-muted)]">0.01</span>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[var(--text-muted)]">BTC</span>
          <ChevronDown size={12} className="text-[var(--text-muted)]" />
        </div>
      </div>

      <div className="grid grid-cols-3 px-2 py-1 border-b border-[var(--border-base)] shrink-0">
        <span className="text-[var(--text-muted)]">Price (USD)</span>
        <span className="text-[var(--text-muted)] text-right">Amount (BTC)</span>
        <span className="text-[var(--text-muted)] text-right">Total (BTC)</span>
      </div>

      {/* Asks (sells - red) - reversed so lowest ask is closest to mid */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col-reverse h-1/2 overflow-hidden">
          {data.asks.slice(0, 15).map((row, i) => (
            <div key={i} className="grid grid-cols-3 px-2 py-[2px] relative hover:bg-[var(--border-base)] cursor-pointer group">
              <div className="absolute right-0 top-0 bottom-0 bg-[var(--negative-muted)]"
                style={{ width: `${(row.total / maxTotal) * 100}%` }} />
              <span className="text-[var(--negative)] z-10">{row.price.toFixed(2)}</span>
              <span className="text-[var(--text-main)] text-right z-10">{row.size.toFixed(4)}</span>
              <span className="text-[var(--text-muted)] text-right z-10">{row.total.toFixed(4)}</span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="flex items-center justify-between px-2 py-1 border-y border-[var(--border-base)] bg-[var(--bg-subtle)]">
          <span className="text-[var(--text-main)] font-medium">{mid.toFixed(2)} ↑</span>
          <span className="text-[var(--text-muted)] text-[10px]">Spread {(Math.random() * 0.01 + 0.001).toFixed(3)}% (0.50)</span>
        </div>

        {/* Bids (buys - green) */}
        <div className="overflow-hidden h-[calc(50%-24px)]">
          {data.bids.slice(0, 15).map((row, i) => (
            <div key={i} className="grid grid-cols-3 px-2 py-[2px] relative hover:bg-[var(--border-base)] cursor-pointer">
              <div className="absolute right-0 top-0 bottom-0 bg-[var(--positive-muted)]"
                style={{ width: `${(row.total / maxTotal) * 100}%` }} />
              <span className="text-[var(--positive)] z-10">{row.price.toFixed(2)}</span>
              <span className="text-[var(--text-main)] text-right z-10">{row.size.toFixed(4)}</span>
              <span className="text-[var(--text-muted)] text-right z-10">{row.total.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Recent Trades Component ──────────────────────────────────────────────────
function RecentTrades({ mid }: { mid: number }) {
  const [trades, setTrades] = useState(() => genTrades(mid));

  useEffect(() => {
    const t = setInterval(() => {
      setTrades(prev => {
        const side = Math.random() > 0.5 ? "buy" : "sell";
        const price = mid + (Math.random() - 0.5) * 4;
        const size = parseFloat((Math.random() * 0.5 + 0.001).toFixed(6));
        const newTrade: Trade = { price, size, side, time: new Date().toLocaleTimeString() };
        return [newTrade, ...prev.slice(0, 29)];
      });
    }, 800);
    return () => clearInterval(t);
  }, [mid]);

  return (
    <div className="flex flex-col h-full text-[11px]">
      <div className="grid grid-cols-3 px-2 py-1 border-b border-[var(--border-base)] shrink-0">
        <span className="text-[var(--text-muted)]">Price (USD)</span>
        <span className="text-[var(--text-muted)] text-right">Amount (BTC)</span>
        <span className="text-[var(--text-muted)] text-right">Time</span>
      </div>
      <div className="flex-1 overflow-hidden">
        {trades.map((t, i) => (
          <div key={i} className="grid grid-cols-3 px-2 py-[2px] hover:bg-[var(--border-base)] cursor-pointer">
            <span className={t.side === "buy" ? "text-[var(--positive)]" : "text-[var(--negative)]"}>{t.price.toFixed(2)}</span>
            <span className="text-[var(--text-main)] text-right">{t.size.toFixed(6)}</span>
            <span className="text-[var(--text-muted)] text-right">{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Order Form Component ─────────────────────────────────────────────────────
function OrderForm({ mid, balanceUSDC, balanceBTC, onTrade }: { mid: number, balanceUSDC: string, balanceBTC: string, onTrade: () => void }) {
  const { token } = useAuth();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market" | "stop">("limit");
  const [price, setPrice] = useState(mid.toFixed(2));
  const [amount, setAmount] = useState("");
  const [total, setTotal] = useState("");

  const handleAmountChange = (v: string) => {
    setAmount(v);
    if (v && price) setTotal((parseFloat(v) * parseFloat(price)).toFixed(2));
  };
  const handleTotalChange = (v: string) => {
    setTotal(v);
    if (v && price) setAmount((parseFloat(v) / parseFloat(price)).toFixed(6));
  };
  const handlePct = (pct: number) => {
    const avail = side === "buy" ? parseFloat(balanceUSDC) / parseFloat(price) : parseFloat(balanceBTC);
    const a = (avail * pct).toFixed(6);
    setAmount(a);
    if (price) setTotal((parseFloat(a) * parseFloat(price)).toFixed(2));
  };

  const handleTrade = async () => {
    if (!token) return toast.error("Please login to trade");
    if (!amount || parseFloat(amount) <= 0) return toast.error("Enter a valid amount");
    try {
      const res = await fetch("http://localhost:8000/paper/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol: "BTC", side, amount: parseFloat(amount) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Trade failed");
      toast.success(`Successfully ${side === 'buy' ? 'bought' : 'sold'} ${amount} BTC`);
      setAmount("");
      setTotal("");
      onTrade();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Buy / Sell tabs */}
      <div className="grid grid-cols-2 border-b border-[var(--border-base)] shrink-0">
        <button onClick={() => setSide("buy")}
          className={`py-3 text-[13px] font-semibold transition-colors ${side === "buy" ? "text-[var(--positive)] border-b-2 border-[var(--positive)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
          Buy
        </button>
        <button onClick={() => setSide("sell")}
          className={`py-3 text-[13px] font-semibold transition-colors ${side === "sell" ? "text-[var(--negative)] border-b-2 border-[var(--negative)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
          Sell
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Order type */}
        <div className="flex items-center gap-1 border-b border-[var(--border-base)] pb-3">
          {(["Limit","Market","Stop Limit"] as const).map(t => (
            <button key={t} onClick={() => setOrderType(t.toLowerCase().split(" ")[0] as any)}
              className={`text-[11px] px-2 py-1 rounded transition-colors ${orderType === t.toLowerCase().split(" ")[0] ? "text-[var(--text-main)] bg-[var(--border-base)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
              {t}
            </button>
          ))}
          <ChevronDown size={12} className="text-[var(--text-muted)] ml-auto" />
        </div>

        {/* Portfolio */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)]">Portfolio</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[var(--text-muted)]">Primary</span>
            <ChevronDown size={10} className="text-[var(--text-muted)]" />
          </div>
        </div>

        {/* Available */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)]">Available ({side === "buy" ? "USDC" : "BTC"})</span>
          <span className="text-[11px] text-[var(--text-main)]">{side === "buy" ? balanceUSDC : balanceBTC} ⓘ</span>
        </div>

        {/* Limit price */}
        {orderType === "limit" && (
          <div>
            <label className="text-[11px] text-[var(--text-muted)] mb-1 block">Limit price (USD)</label>
            <div className="flex items-center bg-[var(--border-base)] rounded px-2 py-2 border border-[var(--border-base)] focus-within:border-[var(--warning)]">
              <input value={price} onChange={e => setPrice(e.target.value)}
                className="flex-1 bg-transparent text-[12px] text-[var(--text-main)] outline-none"
                placeholder="0.00" />
              <span className="text-[11px] text-[var(--text-muted)]">MID ED</span>
            </div>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="text-[11px] text-[var(--text-muted)] mb-1 block">Amount</label>
          <div className="flex items-center bg-[var(--border-base)] rounded px-2 py-2 border border-[var(--border-base)] focus-within:border-[var(--warning)]">
            <input value={amount} onChange={e => handleAmountChange(e.target.value)}
              className="flex-1 bg-transparent text-[12px] text-[var(--text-main)] outline-none"
              placeholder="0.00" />
            <span className="text-[11px] text-[var(--text-muted)]">BTC</span>
          </div>
        </div>

        {/* Percent selectors */}
        <div className="grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map(p => (
            <button key={p} onClick={() => handlePct(p / 100)}
              className="py-1 text-[10px] text-[var(--text-muted)] bg-[var(--border-base)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] rounded transition-colors">
              {p}%
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--border-base)] rounded-full">
          <div className="h-1 bg-[var(--warning)] rounded-full" style={{ width: amount ? `${Math.min((parseFloat(amount) / 0.01) * 100, 100)}%` : "0%" }} />
        </div>

        {/* Total */}
        <div>
          <label className="text-[11px] text-[var(--text-muted)] mb-1 block">Total</label>
          <div className="flex items-center bg-[var(--border-base)] rounded px-2 py-2 border border-[var(--border-base)] focus-within:border-[var(--warning)]">
            <input value={total} onChange={e => handleTotalChange(e.target.value)}
              className="flex-1 bg-transparent text-[12px] text-[var(--text-main)] outline-none"
              placeholder="0.00" />
            <span className="text-[11px] text-[var(--text-muted)]">USDC ↕</span>
          </div>
        </div>

        {/* Options */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-3 h-3 rounded" />
          <span className="text-[11px] text-[var(--text-muted)]">Post only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-3 h-3 rounded" />
          <span className="text-[11px] text-[var(--text-muted)]">Take profit / Stop-loss</span>
        </label>

        {/* GTC */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)]">Duration</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[var(--text-main)]">GTC</span>
            <ChevronDown size={10} className="text-[var(--text-muted)]" />
          </div>
        </div>

        {/* Fee / Subtotal / Total */}
        {[["Subtotal", "–"],["Fee","–"],["Total","–"]].map(([k,v]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">{k}</span>
            <span className="text-[11px] text-[var(--text-main)]">{v}</span>
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div className="p-3 shrink-0">
        <button onClick={handleTrade} className={`w-full py-3 rounded text-[13px] font-semibold transition-all ${
          side === "buy"
            ? "bg-[var(--positive)] hover:bg-[var(--accent)] text-[var(--text-main)]"
            : "bg-[var(--negative)] hover:bg-[var(--negative)]/90 text-[var(--text-main)]"
        }`}>
          {side === "buy" ? "Buy BTC" : "Sell BTC"}
        </button>
        <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">Spot trading provided by Coinbase Bermuda Services Limited</p>
      </div>
    </div>
  );
}

// ─── Main Terminal Page ───────────────────────────────────────────────────────
export default function Terminal() {
  const { token } = useAuth();
  const [ticker, setTicker] = useState<TickerInfo>({
    symbol: "BTC-USDC", name: "Bitcoin",
    last: 62168.97, change24h: -2.29, changePct24h: -2.29,
    high24h: 63883.69, low24h: 61453.09, vol24h: 473878634.72
  });
  const [midPanel, setMidPanel] = useState<"orderbook" | "trades">("orderbook");
  const [balanceUSDC, setBalanceUSDC] = useState("0.00");
  const [balanceBTC, setBalanceBTC] = useState("0.00");

  const fetchPortfolio = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/paper/portfolio", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBalanceUSDC(data.cash_balance?.toFixed(2) || "0.00");
      const btcPos = data.positions?.find((p: any) => p.symbol === "BTC");
      setBalanceBTC(btcPos ? btcPos.amount.toString() : "0");
    } catch (e) {}
  }, [token]);

  useEffect(() => {
    fetchPortfolio();
    const t = setInterval(fetchPortfolio, 5000);
    return () => clearInterval(t);
  }, [fetchPortfolio]);

  // Slowly tick price
  useEffect(() => {
    const t = setInterval(() => {
      setTicker(prev => {
        const change = (Math.random() - 0.5) * 8;
        const newLast = prev.last + change;
        return { ...prev, last: newLast, change24h: newLast - 63883.69, changePct24h: ((newLast - 63883.69) / 63883.69) * 100 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const isUp = ticker.changePct24h >= 0;

  return (
    <div className="flex flex-col w-full h-screen bg-[var(--bg-base)] text-[var(--text-main)] font-sans overflow-hidden" style={{ fontFamily: "'IBM Plex Mono', 'Roboto Mono', monospace" }}>

      {/* ── Top Bar ── */}
      <div className="flex items-center px-3 h-10 border-b border-[var(--border-base)] shrink-0 gap-3">
        {/* Coin selector */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-5 h-5 rounded-full bg-[#f7931a] flex items-center justify-center text-[10px] font-bold text-[var(--text-main)] shrink-0">₿</div>
          <span className="text-[13px] font-semibold text-[var(--text-main)]">{ticker.symbol}</span>
          <ChevronDown size={12} className="text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
        </div>
        <button className="text-[var(--text-muted)] hover:text-[var(--warning)] transition-colors">
          <Star size={14} />
        </button>

        <div className="w-px h-4 bg-[var(--border-base)] mx-1" />

        {/* Price & stats */}
        <div className="flex items-center gap-4 text-[11px]">
          <div>
            <div className="text-[var(--text-muted)]">Last Price (24h)</div>
            <div className={`font-semibold text-[12px] ${isUp ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
              ${ticker.last.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {ticker.changePct24h.toFixed(2)}%
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-[var(--text-muted)]">24h Volume</div>
            <div className="text-[var(--text-main)]">${(ticker.vol24h / 1e6).toFixed(1)}M</div>
          </div>
          <div className="hidden md:block">
            <div className="text-[var(--text-muted)]">24H High</div>
            <div className="text-[var(--text-main)]">${ticker.high24h.toLocaleString()}</div>
          </div>
          <div className="hidden md:block">
            <div className="text-[var(--text-muted)]">24H Low</div>
            <div className="text-[var(--text-main)]">${ticker.low24h.toLocaleString()}</div>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-[var(--border-base)] rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)] transition-colors">
            <ArrowUpDown size={12} /> Advanced
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-[var(--border-base)] rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)] transition-colors">
            <Plus size={12} /> Add widget
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-[var(--positive)] text-[var(--text-main)] rounded hover:bg-[var(--accent)] transition-colors font-medium">
            Deposit
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-[var(--border-base)] rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)] transition-colors">
            Manage funds
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--border-base)] hover:text-[var(--text-main)] transition-colors">
            <Bell size={14} />
          </button>
          <div className="w-7 h-7 rounded-full bg-[var(--positive)] flex items-center justify-center text-[11px] font-bold text-[var(--text-main)]">U</div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 min-h-0">

        {/* Left icon sidebar */}
        <div className="w-10 flex flex-col items-center pt-3 gap-1 border-r border-[var(--border-base)] shrink-0 bg-[var(--bg-subtle)]">
          {[
            { icon: "◈", label: "Spot" },
            { icon: "⟁", label: "Deriv" },
            { icon: "📊", label: "Portfolio" },
            { icon: "≡", label: "Orders" },
          ].map((item, i) => (
            <button key={i} className={`w-9 flex flex-col items-center py-2 gap-0.5 rounded text-[var(--text-muted)] hover:bg-[var(--border-base)] hover:text-[var(--text-main)] transition-colors ${i === 0 ? "text-[var(--text-main)] bg-[var(--border-base)]" : ""}`}>
              <span className="text-[14px]">{item.icon}</span>
              <span className="text-[8px]">{item.label}</span>
            </button>
          ))}
          <div className="flex-1" />
          <button className="w-9 flex flex-col items-center py-2 gap-0.5 rounded text-[var(--text-muted)] hover:bg-[var(--border-base)] hover:text-[var(--text-main)] transition-colors mb-2">
            <span className="text-[14px]">⚙</span>
            <span className="text-[8px]">More</span>
          </button>
        </div>

        {/* Chart area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border-base)]">
          <CandleChart symbol={ticker.symbol} />
          
          {/* Open Orders table */}
          <div className="h-48 shrink-0 border-t border-[var(--border-base)] flex flex-col">
            <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[var(--border-base)] shrink-0">
              {["Open orders","Order history","Positions","Assets","Trade history"].map((tab, i) => (
                <button key={tab} className={`text-[11px] pb-1 transition-colors ${i === 0 ? "text-[var(--text-main)] border-b border-white" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
                  {tab}
                  {i === 0 && <span className="ml-1 text-[var(--warning)]">0</span>}
                </button>
              ))}
              <div className="flex-1" />
              <Maximize2 size={12} className="text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)]" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-base)] text-[10px] text-[var(--text-muted)] shrink-0">
              {["All markets ×","All instruments ×","All types ×","All sides ×","Group by ×","Current market"].map(f => (
                <button key={f} className="hover:text-[var(--text-main)] transition-colors">{f}</button>
              ))}
              <div className="flex-1" />
              <button className="hover:text-[var(--text-main)] transition-colors">Cancel all ×</button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div className="text-[var(--text-muted)] text-[11px]">No open orders</div>
            </div>
          </div>
        </div>

        {/* Order book / Recent trades */}
        <div className="w-56 flex flex-col border-r border-[var(--border-base)] shrink-0">
          <div className="flex items-center border-b border-[var(--border-base)] shrink-0">
            <button onClick={() => setMidPanel("orderbook")}
              className={`flex-1 py-2 text-[11px] transition-colors ${midPanel === "orderbook" ? "text-[var(--text-main)] border-b border-[var(--warning)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
              Order book ×
            </button>
            <button onClick={() => setMidPanel("trades")}
              className={`flex-1 py-2 text-[11px] transition-colors ${midPanel === "trades" ? "text-[var(--text-main)] border-b border-[var(--warning)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
              Recent trades
            </button>
            <button className="px-2">
              <Info size={11} className="text-[var(--text-muted)]" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {midPanel === "orderbook" ? <OrderBook mid={ticker.last} /> : <RecentTrades mid={ticker.last} />}
          </div>
        </div>

        {/* Order form */}
        <div className="w-56 flex flex-col shrink-0">
          <div className="flex items-center border-b border-[var(--border-base)] shrink-0">
            <span className="flex-1 py-2 px-3 text-[11px] text-[var(--text-main)]">Order form ×</span>
            <button className="px-2"><Maximize2 size={11} className="text-[var(--text-muted)]" /></button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <OrderForm mid={ticker.last} balanceUSDC={balanceUSDC} balanceBTC={balanceBTC} onTrade={fetchPortfolio} />
          </div>

          {/* Balance summary */}
          <div className="border-t border-[var(--border-base)] shrink-0">
            <div className="flex items-center px-3 py-1.5 border-b border-[var(--border-base)]">
              <span className="flex-1 text-[11px] text-[var(--text-main)]">Balance summary ×</span>
              <Info size={11} className="text-[var(--text-muted)] mr-1" />
              <Maximize2 size={11} className="text-[var(--text-muted)]" />
            </div>
            <div className="px-3 py-2 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">USDC</span>
                <span className="text-[var(--text-main)]">{balanceUSDC} ⓘ</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">BTC</span>
                <span className="text-[var(--text-main)]">{balanceBTC} ⓘ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Ticker Bar ── */}
      <div className="flex items-center px-3 h-7 border-t border-[var(--border-base)] shrink-0 bg-[var(--bg-subtle)] gap-3 overflow-x-auto">
        <span className="text-[10px] text-[var(--text-muted)] shrink-0">Gainers</span>
        {["BTC","ETH","SOL","BNB","APE","DOGE","MATIC","LINK","AVAX","UNI","AAVE","FTM"].map((coin, i) => {
          const pct = (Math.random() - 0.45) * 20;
          const isG = pct > 0;
          return (
            <div key={coin} className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-[var(--text-muted)]">{coin}-USD</span>
              <span className={`text-[10px] ${isG ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                {isG ? "+" : ""}{pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
        <div className="flex-1" />
        <button className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shrink-0">Share feedback</button>
        <button className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shrink-0">Help</button>
      </div>
    </div>
  );
}
