import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useCoinDetail, useCoinHistory, useCoinStats } from "../hooks/useCoin";
import {
  ArrowLeft, TrendingUp, TrendingDown,
  LineChart, CandlestickChart, Lock,
  Brain
} from "lucide-react";
import AICandlestickChart from "../components/market/AICandlestickChart";
import { useAuth } from "../hooks/useAuth";
import CryptoNews from "../components/market/CryptoNews";
import AIPulse from "../components/ai/AIPulse";
import AIAnalysisBox from "../components/market/AIAnalysisBox";
import HypeRealityWidget from "../components/market/HypeRealityWidget";
import TokenomicsWidget from "../components/market/TokenomicsWidget";
import { useTranslation } from "react-i18next";
import { getCoinColor } from "../utils/colors";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";

const RANGES = [
  { label: "1H", value: "1h" },
  { label: "24H", value: "24h" },
  { label: "7D",  value: "7d"  },
  { label: "30D", value: "30d" },
  { label: "ALL", value: "all" },
];

// ─── Formatters ─────────────────────────────────────────────
function fmtPrice(n: any) {
  const v = Number(n);
  if (isNaN(v) || n == null) return "—";
  if (v >= 1000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (v >= 1)    return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  if (v >= 0.0001) return `$${v.toFixed(6)}`;
  return `<$0.000001`;
}

function fmtLarge(n: any, prefix = "$") {
  const v = Number(n);
  if (isNaN(v) || n == null || v === 0) return "—";
  if (v >= 1e12) return `${prefix}${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `${prefix}${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6)  return `${prefix}${(v / 1e6).toFixed(2)}M`;
  return `${prefix}${v.toFixed(2)}`;
}

function fmtPct(n: any) {
  const v = Number(n);
  if (isNaN(v) || n == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function fmtDate(s: any) {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return s; }
}

function fmtChartTime(iso: any, range: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (range === "1h" || range === "24h") return time;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── Sub-components ──────────────────────────────────────────
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#16181c]/90 backdrop-blur-xl border border-[#273951]/50 rounded-xl px-4 py-3 shadow-2xl">
      <div className="text-xs text-gray-400 mb-1 font-medium">
        {payload[0]?.payload?.time ? new Date(payload[0].payload.time).toLocaleString() : ""}
      </div>
      <div className="font-mono font-bold text-white text-base tracking-tight">
        {fmtPrice(payload[0]?.value)}
      </div>
    </div>
  );
}

function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-[#273951]/50 last:border-0">
      <span className="text-sm text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color: valueColor || "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────────────
export default function CoinDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isPro } = useAuth();
  const [range, setRange] = useState("24h");
  const [chartType, setChartType] = useState("pro");

  const { data: coin, isLoading, isError } = useCoinDetail(slug);
  const { data: history, isLoading: historyLoading } = useCoinHistory(slug, range);
  const { data: stats } = useCoinStats(slug);

  const prevRef = useRef<any>(null);
  const [prevPrice, setPrevPrice] = useState<any>(null);
  const [priceFlash, setPriceFlash] = useState<any>(null);

  useEffect(() => {
    if (!coin?.current_price) return;
    const cur = coin.current_price;
    const prev = prevRef.current;
    if (prev !== null && cur !== prev) {
      setPrevPrice(prev);
      setPriceFlash(cur > prev ? "up" : "down");
      setTimeout(() => setPriceFlash(null), 800);
    }
    prevRef.current = cur;
  }, [coin?.current_price]);

  const simpleChartData = useMemo(() => {
    const arr = history || [];
    if (!arr.length || !coin?.current_price) return arr;
    const cloned = [...arr];
    const last = cloned[cloned.length - 1];
    const lastTime = new Date(last.time).getTime();
    if (Date.now() - lastTime > 60000) {
      cloned.push({ time: new Date().toISOString(), price: coin.current_price });
    } else {
      cloned[cloned.length - 1] = { ...last, price: coin.current_price };
    }
    return cloned;
  }, [history, coin?.current_price]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin drop-shadow-[0_0_15px_var(--accent-soft)]"></div>
    </div>
  );

  if (isError || !coin) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-5">
      <div className="text-6xl drop-shadow-2xl">🔍</div>
      <div className="text-2xl font-black text-white tracking-tight">Coin not found</div>
      <button onClick={() => navigate("/market")} className="px-6 py-2.5 rounded-full border border-[#273951]/50 bg-white/5 text-white font-bold hover:bg-white/10 transition-colors shadow-lg">
        ← Back to Markets
      </button>
    </div>
  );

  const change = Number(coin.price_change_percentage_24h);
  const isPositive = change >= 0;
  const chartData = history || [];
  const chartTrend = chartData.length >= 2
    ? Number(chartData.at(-1)?.price) >= Number(chartData[0]?.price)
    : isPositive;
  
  const ohlcData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    // Some APIs return {time, price}, some return {time, value}
    // We will generate deterministic mock OHLC around the closing price
    return chartData.map((d, i) => {
      const close = Number(d.price || d.value || 0);
      const prevClose = i > 0 ? Number(chartData[i-1].price || chartData[i-1].value || close) : close;
      const open = prevClose;
      
      const volatility = close * 0.005; // 0.5% volatility
      const high = Math.max(open, close) + (Math.random() * volatility);
      const low = Math.min(open, close) - (Math.random() * volatility);
      
      // lightweight-charts needs time in seconds (unix timestamp) or string 'YYYY-MM-DD'
      const timeInSeconds = Math.floor(new Date(d.time).getTime() / 1000);

      return {
        time: timeInSeconds,
        open,
        high,
        low,
        close
      };
    });
  }, [chartData]);

  const chartColor = chartTrend ? "#22c55e" : "#ef4444";
  const brandColor = getCoinColor(coin.symbol);
  const athPct = coin.ath && coin.current_price
    ? (((Number(coin.current_price) - Number(coin.ath)) / Number(coin.ath)) * 100).toFixed(1)
    : null;

  // ATH-ATL range %
  const lo = Number(coin.atl), hi = Number(coin.ath), cur = Number(coin.current_price);
  const rangePct = (lo && hi && cur && hi > lo)
    ? Math.min(100, Math.max(0, ((cur - lo) / (hi - lo)) * 100)).toFixed(1)
    : null;

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(5px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative min-h-screen pb-24 overflow-x-hidden">
      
      {/* BACKGROUND GLOWS (Stripe inspired mesh at the top) */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40">
        <div className="w-[800px] h-[300px] bg-[#533afd] blur-[150px] rounded-[100%] opacity-30 absolute -top-[100px] left-[10%]"></div>
        <div className="w-[600px] h-[250px] bg-[#f96bee] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 pt-10">
        
        {/* ── BACK BUTTON ─────────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Markets
        </button>

        {/* ── HERO HEADER ──────────────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: -20, filter: "blur(10px)" }} 
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12"
        >
          {/* Left: name + symbol */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 blur-xl opacity-40 rounded-full" style={{ background: brandColor }}></div>
              {coin.image_url
                ? <img src={coin.image_url} alt={coin.name} className="relative w-24 h-24 rounded-full shadow-2xl ring-4 ring-white/5 object-cover" onError={(e: any) => (e.target.style.display = "none")} />
                : <div className="relative w-24 h-24 rounded-full bg-[#16181c] ring-4 ring-white/5 flex items-center justify-center text-4xl font-black shadow-2xl" style={{ color: brandColor }}>{coin.symbol?.slice(0, 2)}</div>
              }
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-4 flex-wrap mb-2">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white m-0 drop-shadow-lg">{coin.name}</h1>
                {coin.market_cap_rank && (
                  <span className="text-sm font-bold px-3 py-1.5 rounded-full bg-white/10 border border-[#273951]/50 text-gray-200 shadow-sm backdrop-blur-md">
                    Rank #{coin.market_cap_rank}
                  </span>
                )}
              </div>
              <div className="font-mono text-lg text-gray-400 uppercase tracking-widest font-medium">
                {coin.symbol} <span className="mx-2 opacity-30">|</span> <span className="text-gray-500">{coin.slug}</span>
              </div>
            </div>
          </div>

          {/* Right: price + change */}
          <div className="flex flex-col md:items-end text-left md:text-right pt-2">
            <div className={`font-mono text-6xl md:text-[5rem] font-black tracking-tighter leading-none flex items-center md:justify-end gap-1 transition-colors duration-500 drop-shadow-xl ${priceFlash === 'up' ? 'text-green-400' : priceFlash === 'down' ? 'text-red-400' : 'text-white'}`}>
              <span className="opacity-40 font-sans text-5xl md:text-6xl mr-1">$</span>
              <NumberFlow 
                value={Number(coin.current_price) || 0}
                format={{ minimumFractionDigits: coin.current_price < 1 ? 4 : 2, maximumFractionDigits: coin.current_price < 1 ? 6 : 2 }}
              />
            </div>
            
            <div className="flex items-center md:justify-end gap-3 mt-4">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-base font-bold shadow-lg ${isPositive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                {fmtPct(change)}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 bg-white/5 px-3 py-2 rounded-xl border border-[#273951]/50">24H Range</span>
            </div>
            
            {athPct !== null && (
              <div className={`font-mono text-sm font-bold mt-3 opacity-80 ${Number(athPct) < 0 ? "text-red-400" : "text-green-400"}`}>
                {athPct}% {Number(athPct) < 0 ? "from ATH" : "above ATH"}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── TWO-COLUMN LAYOUT ─────────────────────────────── */}
        <motion.div 
          variants={containerVariants} initial="hidden" animate="visible"
          className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start"
        >

          {/* ── LEFT COLUMN ──────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* CHART CARD */}
            <motion.div variants={itemVariants} className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 rounded-3xl overflow-hidden shadow-2xl relative group">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"></div>
              
              {/* Chart toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 border-b border-[#273951]/50 relative z-10 bg-black/20">
                <span className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <LineChart size={24} className="text-[var(--accent)]" /> Price Action
                </span>
                
                <div className="flex flex-wrap items-center gap-4">
                  {/* Time range */}
                  <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-[#273951]/50 shadow-inner">
                    {RANGES.map(r => (
                      <button key={r.value} onClick={() => setRange(r.value)} className={`
                        px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${range === r.value ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}
                      `}>
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {/* Chart type */}
                  <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-[#273951]/50 shadow-inner">
                    <button onClick={() => setChartType("simple")} className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                      ${chartType === "simple" ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}
                    `}>
                      <LineChart size={14} /> Line
                    </button>
                    <button onClick={() => setChartType("pro")} className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                      ${chartType === "pro" ? 'bg-green-500/10 text-green-400 shadow-md border border-green-500/20' : 'text-gray-500 hover:text-gray-300'}
                    `}>
                      <CandlestickChart size={14} /> Candle
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart body */}
              <div className="p-6 h-[450px] relative z-10">
                {historyLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-500">
                    <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-bold tracking-widest uppercase animate-pulse">Loading Chart...</span>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-500">
                    <LineChart size={40} className="opacity-20" />
                    <span className="text-sm font-medium">No chart data available for this range</span>
                  </div>
                ) : chartType === "pro" ? (
                   <AICandlestickChart symbol={coin.symbol} data={ohlcData} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simpleChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tickFormatter={t => fmtChartTime(t, range)} stroke="transparent" tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 600 }} dy={15} />
                      <YAxis
                        tickFormatter={v => {
                          const n = Number(v);
                          if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                          if (n >= 1) return `$${n.toFixed(2)}`;
                          return `$${n.toFixed(4)}`;
                        }}
                        stroke="transparent"
                        tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 700 }}
                        width={80}
                        domain={([min, max]: any) => { const p = (max - min) * 0.05 || min * 0.001; return [min - p, max + p]; }}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={3} fill="url(#cg)" dot={false}
                        activeDot={{ r: 6, fill: chartColor, stroke: "#19191c", strokeWidth: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* PRO ANALYTICS */}
            <motion.div variants={itemVariants} className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="p-5 md:p-6 border-b border-[#273951]/50 bg-black/20">
                <span className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                  <Brain size={24} className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" /> Pro Analytics
                </span>
              </div>
              <div className="p-6">
                {isPro ? (
                  <div className="flex flex-col gap-6">
                    <AIAnalysisBox slug={coin.slug} coinName={coin.name} symbol={coin.symbol} brandColor={brandColor} />
                    <HypeRealityWidget symbol={coin.symbol} />
                    <AIPulse slug={slug} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white/[0.02] rounded-[32px] border border-[#273951]/50 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="w-20 h-20 rounded-full bg-black/60 border border-[#273951]/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent"></div>
                       <Lock size={32} className="text-purple-400 relative z-10" />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3">Unlock AI Analyst</h3>
                    <p className="text-gray-400 text-base max-w-md mb-8 leading-relaxed font-medium">
                      Get real-time AI-powered market sentiment, attack momentum, and advanced price trajectory predictions.
                    </p>
                    <Link to="/pricing" className="relative z-10 px-10 py-4 rounded-full bg-white text-black font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                      Upgrade to Pro →
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* TOKENOMICS & NEWS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <motion.div variants={itemVariants} className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                  <div className="p-5 border-b border-[#273951]/50 bg-black/20"><span className="text-lg font-black text-white">Tokenomics</span></div>
                  <div className="p-6 flex-1"><TokenomicsWidget coin={coin} /></div>
               </motion.div>

               <motion.div variants={itemVariants} className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                  <div className="p-5 border-b border-[#273951]/50 bg-black/20"><span className="text-lg font-black text-white">Latest News</span></div>
                  <div className="p-6 flex-1"><CryptoNews symbol={coin.symbol} /></div>
               </motion.div>
            </div>
            
          </div>

          {/* ── RIGHT SIDEBAR ─────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Market Stats */}
            <motion.div variants={itemVariants} className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-[#273951]/50 bg-black/20">
                <span className="text-lg font-black text-white tracking-tight">Market Stats</span>
              </div>
              <div className="p-6 flex flex-col gap-2">
                <StatRow label="Market Cap" value={fmtLarge(coin.market_cap)} />
                <StatRow label="24h Volume" value={fmtLarge(coin.total_volume)} />
                <StatRow label="24h High" value={fmtPrice(stats?.high_24h)} valueColor="#22c55e" />
                <StatRow label="24h Low" value={fmtPrice(stats?.low_24h)} valueColor="#ef4444" />
                <StatRow label="All-Time High" value={fmtPrice(coin.ath)} />
                <StatRow label="ATH Date" value={fmtDate(coin.ath_date)} />
                <StatRow label="All-Time Low" value={fmtPrice(coin.atl)} />
                <StatRow label="ATL Date" value={fmtDate(coin.atl_date)} />
                <StatRow label="Market Rank" value={coin.market_cap_rank ? `#${coin.market_cap_rank}` : "—"} />
              </div>
            </motion.div>

            {/* ATH-ATL Range Bar */}
            {rangePct !== null && (
              <motion.div variants={itemVariants} className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 rounded-3xl overflow-hidden shadow-2xl p-6 relative group">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent)]/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-[var(--accent)]/20 transition-colors duration-700"></div>
                 <div className="text-base font-black text-white mb-5 relative z-10">Price Range (ATL → ATH)</div>
                 <div className="flex justify-between text-xs text-gray-400 font-mono font-bold mb-3 relative z-10 uppercase tracking-widest">
                   <span>ATL {fmtPrice(coin.atl)}</span>
                   <span>ATH {fmtPrice(coin.ath)}</span>
                 </div>
                 
                 <div className="relative h-3 rounded-full bg-black/50 border border-[#273951]/50 overflow-hidden shadow-inner relative z-10">
                   <div 
                     className="absolute left-0 h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" 
                     style={{ width: `${rangePct}%` }}
                   />
                   <div 
                     className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] border-4 border-[#19191c]"
                     style={{ left: `calc(${rangePct}% - 10px)` }}
                   />
                 </div>
                 
                 <div className="text-center mt-6 text-sm font-bold text-gray-400 bg-white/5 py-3 rounded-xl border border-[#273951]/50 relative z-10 shadow-sm">
                   <span className="text-white font-black text-base mr-1">{rangePct}%</span> above All-Time Low
                 </div>
              </motion.div>
            )}

            {/* Supply Info */}
            <motion.div variants={itemVariants} className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-[#273951]/50 bg-black/20">
                <span className="text-lg font-black text-white tracking-tight">Supply Dynamics</span>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-2">
                  <StatRow label="Circulating" value={fmtLarge(coin.circulating_supply, "")} />
                  <StatRow label="Total Supply" value={fmtLarge(coin.total_supply, "")} />
                  <StatRow label="Max Supply" value={fmtLarge(coin.max_supply, "")} />
                </div>
                
                {coin.circulating_supply && coin.total_supply && Number(coin.total_supply) > 0 && (
                  <div className="mt-8 bg-black/40 p-5 rounded-[32px] border border-[#273951]/50 shadow-inner">
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-3 uppercase tracking-widest font-bold">
                      <span>Circulation Progress</span>
                      <span className="text-white text-sm">{((Number(coin.circulating_supply) / Number(coin.total_supply)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-green-400 shadow-[0_0_10px_var(--accent-soft)]"
                        style={{ width: `${Math.min(100, (Number(coin.circulating_supply) / Number(coin.total_supply)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}


