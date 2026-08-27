// @ts-nocheck
import { useState, useEffect, useRef, useMemo } from "react";
import { Helmet } from "react-helmet-async";
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
import { Component as CandleChart } from "../components/ui/candle-chart";
import RangeNavigator from "../components/ui/range-navigator";
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

// â”€â”€â”€ Formatters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function fmtPrice(n: any) {
  const v = Number(n);
  if (isNaN(v) || n == null) return "-";
  if (v >= 1000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (v >= 1)    return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  if (v >= 0.0001) return `$${v.toFixed(6)}`;
  return `<$0.000001`;
}

function fmtLarge(n: any, prefix = "$") {
  const v = Number(n);
  if (isNaN(v) || n == null || v === 0) return "-";
  if (v >= 1e12) return `${prefix}${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `${prefix}${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6)  return `${prefix}${(v / 1e6).toFixed(2)}M`;
  return `${prefix}${v.toFixed(2)}`;
}

function fmtPct(n: any) {
  const v = Number(n);
  if (isNaN(v) || n == null) return "-";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function fmtDate(s: any) {
  if (!s) return "-";
  try { return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return s; }
}

function fmtChartTime(iso: any, range: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (range === "1h" || range === "24h") return time;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-subtle)]/90 backdrop-blur-xl border border-[var(--border-base)] rounded-3xl px-4 py-3 shadow-2xl">
      <div className="text-xs text-[var(--text-muted)] mb-1 font-medium">
        {payload[0]?.payload?.time ? new Date(payload[0].payload.time).toLocaleString() : ""}
      </div>
      <div className="font-mono font-bold text-[var(--text-main)] text-base tracking-tight">
        {fmtPrice(payload[0]?.value)}
      </div>
    </div>
  );
}

function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-[var(--border-base)] last:border-0">
      <span className="text-sm text-[var(--text-muted)] font-medium">{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color: valueColor || "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

// â”€â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    const arr = Array.isArray(history) ? history : [];
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

  const chartData = Array.isArray(history) ? history : [];

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin drop-shadow-[0_0_15px_var(--accent-soft)]"></div>
    </div>
  );

  if (isError || !coin) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-5">
      <div className="text-6xl drop-shadow-2xl">💀</div>
      <div className="text-2xl font-black text-[var(--text-main)] tracking-tight">Coin not found</div>
      <button onClick={() => navigate("/market")} className="px-6 py-2.5 rounded-full border border-[var(--border-base)] bg-white/5 text-[var(--text-main)] font-bold hover:bg-[var(--border-base)] transition-colors shadow-lg">
        ← Back to Markets
      </button>
    </div>
  );

  const change = Number(coin.price_change_percentage_24h);
  const isPositive = change >= 0;
  const chartTrend = chartData.length >= 2
    ? Number(chartData.at(-1)?.price) >= Number(chartData[0]?.price)
    : isPositive;

  const chartColor = chartTrend ? "var(--positive)" : "var(--negative)";
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
    hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const metaTitle = `${coin.name} (${coin.symbol.toUpperCase()}) Price: ${fmtPrice(coin.current_price)}`;
  const metaDescription = `Live ${coin.name} price, charts, and market data. 24h change: ${fmtPct(change)}. View real-time CryptoNeko analytics.`;

  return (
    <div className="relative min-h-[100dvh] pb-24 overflow-x-hidden">
      
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={coin.image} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={coin.image} />
      </Helmet>

      {/* BACKGROUND GLOWS (Stripe inspired mesh at the top) */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-30">
        <div className="w-[800px] h-[300px] bg-[var(--accent)] blur-[150px] rounded-[100%] opacity-30 absolute -top-[100px] left-[10%]"></div>
        <div className="w-[600px] h-[250px] bg-[var(--accent-hover)] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 pt-10">
        
        {/* â”€â”€ BACK BUTTON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mb-10"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Markets
        </button>

        {/* â”€â”€ HERO HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <motion.div 
          initial={{ opacity: 0, y: -20, filter: "blur(10px)" }} 
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12 bg-[var(--bg-subtle)]/80 backdrop-blur-xl border border-[var(--border-base)] rounded-[32px] p-6 md:p-10 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-1000 group-hover:opacity-20" style={{ background: `linear-gradient(135deg, ${brandColor}40 0%, transparent 100%)` }}></div>
          
          <div className="relative z-10 w-full flex flex-col md:flex-row md:items-start justify-between gap-8">
          {/* Left: name + symbol */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 blur-xl opacity-40 rounded-full" style={{ background: brandColor }}></div>
              {coin.image_url
                ? <img src={coin.image_url} alt={coin.name} className="relative w-24 h-24 rounded-full shadow-2xl ring-4 ring-[var(--border-subtle)] object-cover" onError={(e: any) => (e.target.style.display = "none")} />
                : <div className="relative w-24 h-24 rounded-full bg-[var(--bg-subtle)] ring-4 ring-[var(--border-subtle)] flex items-center justify-center text-4xl font-black shadow-2xl" style={{ color: brandColor }}>{coin.symbol?.slice(0, 2)}</div>
              }
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-4 flex-wrap mb-2">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[var(--text-main)] m-0 drop-shadow-lg">{coin.name}</h1>
                {coin.market_cap_rank && (
                  <span className="text-sm font-bold px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-main)] shadow-sm backdrop-blur-md">
                    Rank #{coin.market_cap_rank}
                  </span>
                )}
              </div>
              <div className="font-mono text-lg text-[var(--text-muted)] uppercase tracking-widest font-medium">
                {coin.symbol} <span className="mx-2 opacity-30">|</span> <span className="text-[var(--text-muted)]">{coin.slug}</span>
              </div>
            </div>
          </div>

          {/* Right: price + change */}
          <div className="flex flex-col md:items-end text-left md:text-right pt-2">
            <div className={`font-mono text-6xl md:text-[5rem] font-black tracking-tighter leading-none flex items-center md:justify-end gap-1 transition-colors duration-500 drop-shadow-xl ${priceFlash === 'up' ? 'text-[var(--positive)]' : priceFlash === 'down' ? 'text-[var(--negative)]' : 'text-[var(--text-main)]'}`}>
              <span className="opacity-40 font-sans text-5xl md:text-6xl mr-1">$</span>
              <NumberFlow 
                value={Number(coin.current_price) || 0}
                format={{ minimumFractionDigits: coin.current_price < 1 ? 4 : 2, maximumFractionDigits: coin.current_price < 1 ? 6 : 2 }}
              />
            </div>
            
            <div className="flex items-center md:justify-end gap-3 mt-4">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-3xl font-mono text-base font-bold shadow-lg ${isPositive ? 'bg-[var(--positive)]/10 text-[var(--positive)] border border-[var(--positive)]/20' : 'bg-[var(--negative)]/10 text-[var(--negative)] border border-[var(--negative)]/20'}`}>
                {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                {fmtPct(change)}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-elevated)] px-3 py-2 rounded-3xl border border-[var(--border-base)]">24H Range</span>
            </div>
            
            {athPct !== null && (
              <div className={`font-mono text-sm font-bold mt-3 opacity-80 ${Number(athPct) < 0 ? "text-[var(--negative)]" : "text-[var(--positive)]"}`}>
                {athPct}% {Number(athPct) < 0 ? "from ATH" : "above ATH"}
              </div>
            )}
          </div>
          </div>
        </motion.div>

        {/* â”€â”€ TWO-COLUMN LAYOUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <motion.div 
          variants={containerVariants} initial="hidden" animate="visible"
          className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start"
        >

          {/* â”€â”€ LEFT COLUMN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-col gap-6">

            {/* CHART CARD */}
            <motion.div variants={itemVariants} className="bg-[var(--bg-subtle)]/80 backdrop-blur-xl border border-[var(--border-base)] rounded-3xl overflow-hidden shadow-2xl relative group">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[var(--bg-overlay)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"></div>
              
              {/* Chart toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 border-b border-[var(--border-base)] relative z-10 bg-[var(--bg-overlay)]">
                <span className="text-xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-2">
                  <LineChart size={24} className="text-[var(--accent)]" /> Price Action
                </span>
                
                <div className="flex flex-wrap items-center gap-4">
                  {/* Time range */}
                  <div className="flex gap-1 bg-[var(--bg-base)] p-1.5 rounded-3xl border border-[var(--border-subtle)] shadow-inner">
                    {RANGES.map(r => (
                      <button key={r.value} onClick={() => setRange(r.value)} className={`
                        px-4 py-1.5 rounded-2xl text-xs font-bold transition-all
                        ${range === r.value ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] shadow-md border border-[var(--border-base)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}
                      `}>
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {/* Chart type */}
                  <div className="flex gap-1 bg-[var(--bg-base)] p-1.5 rounded-3xl border border-[var(--border-subtle)] shadow-inner">
                    <button onClick={() => setChartType("simple")} className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all
                      ${chartType === "simple" ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] shadow-md border border-[var(--border-base)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}
                    `}>
                      <LineChart size={14} /> Line
                    </button>
                    <button onClick={() => setChartType("pro")} className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all
                      ${chartType === "pro" ? 'bg-[var(--positive)]/10 text-[var(--positive)] shadow-md border border-[var(--positive)]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}
                    `}>
                      <CandlestickChart size={14} /> Candle
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart body */}
              <div className="p-6 h-[450px] relative z-10">
                {historyLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]">
                    <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-bold tracking-widest uppercase animate-pulse">Loading Chart...</span>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
                    <LineChart size={40} className="opacity-20" />
                    <span className="text-sm font-medium">No chart data available for this range</span>
                  </div>
                ) : chartType === "pro" ? (
                   <CandleChart symbol={coin.symbol} mid={Number(coin.current_price)} data={simpleChartData} fill={true} chrome={false} />
                ) : (
                  <div className="w-full h-[400px]">
                    <RangeNavigator 
                      values={simpleChartData.map((d: any) => d.price)}
                      endDate={new Date(simpleChartData[simpleChartData.length - 1]?.time || Date.now())}
                      color={chartColor}
                      className="w-full h-full"
                    />
                  </div>
                )}
              </div>
            </motion.div>

            {/* PRO ANALYTICS */}
            <motion.div variants={itemVariants} className="bg-[var(--bg-subtle)]/80 backdrop-blur-xl border border-[var(--border-base)] rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="p-5 md:p-6 border-b border-[var(--border-base)] bg-[var(--bg-overlay)]">
                <span className="text-xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-3">
                  <Brain size={24} className="text-[var(--accent)] drop-shadow-[0_0_10px_var(--accent-soft)]" /> Pro Analytics
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
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--bg-overlay)] rounded-[32px] border border-[var(--border-subtle)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-center mb-6 shadow-[0_0_30px_var(--accent-soft)] relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 to-transparent"></div>
                       <Lock size={32} className="text-[var(--accent)] relative z-10" />
                    </div>
                    <h3 className="text-3xl font-black text-[var(--text-main)] mb-3">Unlock AI Analyst</h3>
                    <p className="text-[var(--text-muted)] text-base max-w-md mb-8 leading-relaxed font-medium">
                      Get real-time AI-powered market sentiment, attack momentum, and advanced price trajectory predictions.
                    </p>
                    <Link to="/pricing" className="relative z-10 px-10 py-4 rounded-full bg-[var(--text-main)] text-[var(--bg-base)] font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_var(--border-base)]">
                      Upgrade to Pro →
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* NEWS GRID */}
            <motion.div variants={itemVariants} className="bg-[var(--bg-subtle)]/80 backdrop-blur-xl border border-[var(--border-base)] rounded-3xl overflow-hidden shadow-2xl flex flex-col mb-6">
              <div className="p-5 border-b border-[var(--border-base)] bg-[var(--bg-overlay)]">
                <span className="text-lg font-black text-[var(--text-main)] tracking-tight">Latest News</span>
              </div>
              <div className="p-6 flex-1">
                <CryptoNews symbol={coin.symbol} />
              </div>
            </motion.div>
            
          </div>

          {/* â”€â”€ RIGHT SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex flex-col gap-6">

            {/* Market Stats */}
            <motion.div variants={itemVariants} className="bg-[var(--bg-subtle)]/80 backdrop-blur-xl border border-[var(--border-base)] rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-[var(--border-base)] bg-[var(--bg-overlay)]">
                <span className="text-lg font-black text-[var(--text-main)] tracking-tight">Market Stats</span>
              </div>
              <div className="p-6 flex flex-col gap-2">
                <StatRow label="Market Cap" value={fmtLarge(coin.market_cap)} />
                <StatRow label="24h Volume" value={fmtLarge(coin.total_volume)} />
                <StatRow label="24h High" value={fmtPrice(stats?.high_24h)} valueColor="var(--positive)" />
                <StatRow label="24h Low" value={fmtPrice(stats?.low_24h)} valueColor="var(--negative)" />
                <StatRow label="All-Time High" value={fmtPrice(coin.ath)} />
                <StatRow label="ATH Date" value={fmtDate(coin.ath_date)} />
                <StatRow label="All-Time Low" value={fmtPrice(coin.atl)} />
                <StatRow label="ATL Date" value={fmtDate(coin.atl_date)} />
                <StatRow label="Market Rank" value={coin.market_cap_rank ? `#${coin.market_cap_rank}` : "â€”"} />
              </div>
            </motion.div>

            {/* Tokenomics */}
            <motion.div variants={itemVariants} className="bg-[var(--bg-subtle)]/80 backdrop-blur-xl border border-[var(--border-base)] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-5 border-b border-[var(--border-base)] bg-[var(--bg-overlay)]">
                <span className="text-lg font-black text-[var(--text-main)] tracking-tight">Tokenomics</span>
              </div>
              <div className="p-6 flex-1">
                <TokenomicsWidget coin={coin} />
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );}

