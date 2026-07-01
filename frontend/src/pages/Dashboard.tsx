// ============================================================
// pages/Dashboard.tsx  –  Premium Bento-Box Style Overhaul
// ============================================================
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  useMarket,
  useGainers,
  useLosers,
  useMarketStats,
  useTrending,
} from "../hooks/useMarket";
import { useFearAndGreed } from "../hooks/useFearAndGreed";
import { useSparklines } from "../hooks/useSparklines";
import PriceCell from "../components/ui/PriceCell";
import {
  TrendingUp, TrendingDown, Brain, Flame, Search,
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";

// ─── HELPERS ────────────────────────────────────────────────
function fmt(n: number) {
  if (!n || isNaN(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

function getFlowData(n: number) {
  if (!n || isNaN(n)) return { val: 0, suffix: "" };
  if (n >= 1e12) return { val: n / 1e12, suffix: "T" };
  if (n >= 1e9)  return { val: n / 1e9, suffix: "B" };
  if (n >= 1e6)  return { val: n / 1e6, suffix: "M" };
  return { val: n, suffix: "" };
}

// ─── SPARKLINE ───────────────────────────────────────────────
function MiniSparkline({ data, up }: { data?: any[], up: boolean }) {
  const color = up ? "#22c55e" : "#ef4444";
  
  if (!data || data.length < 2) {
    return (
      <svg className="w-full h-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points="0,50 100,50" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity={0.5}/>
      </svg>
    );
  }

  const prices = data.map((d: any) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const pts = data.map((d: any, i: number) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.price - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="w-full h-10" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,100 ${pts} 100,100`} fill={`url(#g-${up})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─── CHANGE BADGE ────────────────────────────────────────────
function ChangeBadge({ value }: { value: number }) {
  const isUp = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold font-mono ${isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
      {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {isUp ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

// ─── TH COMPONENT ────────────────────────────────────────────
function TH({
  label, align = "left", active, direction, onClick
}: {
  label: string; align?: "left" | "right"; active: boolean; direction: "asc" | "desc"; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${align === "right" ? "ml-auto" : ""} ${active ? "text-white" : "text-gray-500 hover:text-gray-300"} transition-colors`}
    >
      {label}
      {active && (
        <span className="opacity-70">
          {direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      )}
    </button>
  );
}

// ─── FADE IN ─────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 20, filter: "blur(5px)" },
        visible: { 
          opacity: 1, y: 0, filter: "blur(0px)",
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } 
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
type SortKey = "rank" | "price" | "change" | "volume" | "mcap";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: coins } = useMarket();
  const { data: gainersData } = useGainers();
  const { data: losersData } = useLosers();
  const { data: statsData } = useMarketStats();
  const { data: trendingData } = useTrending();
  const { data: fng } = useFearAndGreed();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<"all" | "gainers" | "losers" | "trending">("all");

  // Derived stats
  const calcTotalVolume = coins?.reduce((s: number, c: any) => s + (Number(c.total_volume) || 0), 0) || 0;
  const calcTotalMcap = coins?.reduce((s: number, c: any) => s + (Number(c.market_cap) || 0), 0) || 0;
  const btc = coins?.find((c: any) => c.symbol?.toUpperCase() === "BTC");
  const eth = coins?.find((c: any) => c.symbol?.toUpperCase() === "ETH");
  const calcBtcDom = btc && calcTotalMcap ? ((Number(btc.market_cap) / calcTotalMcap) * 100).toFixed(1) : "—";
  const calcEthDom = eth && calcTotalMcap ? ((Number(eth.market_cap) / calcTotalMcap) * 100).toFixed(1) : "—";

  const totalMcap = statsData?.data?.total_market_cap?.usd || statsData?.total_market_cap?.usd || calcTotalMcap;
  const totalVolume = statsData?.data?.total_volume?.usd || statsData?.total_volume?.usd || calcTotalVolume;
  const btcDom = statsData?.data?.market_cap_percentage?.btc?.toFixed(1) || calcBtcDom;
  const ethDom = statsData?.data?.market_cap_percentage?.eth?.toFixed(1) || calcEthDom;
  const fngValue = fng ? parseInt(fng.value) : null;
  
  const fngColor = fngValue == null ? "#888" : fngValue <= 25 ? "#ef4444" : fngValue <= 45 ? "#f97316" : fngValue <= 55 ? "#eab308" : fngValue <= 75 ? "#22c55e" : "#10b981";
  const fngLabel = fngValue == null ? "—" : fngValue <= 25 ? "Extreme Fear" : fngValue <= 45 ? "Fear" : fngValue <= 55 ? "Neutral" : fngValue <= 75 ? "Greed" : "Extreme Greed";

  const mcapFlow = getFlowData(totalMcap);
  const volFlow = getFlowData(totalVolume);

  // List
  const baseList: any[] = activeTab === "gainers" ? (gainersData || []) : activeTab === "losers" ? (losersData || []) : activeTab === "trending"? (trendingData || []) : (coins || []);
  const filtered = baseList
    .filter((c: any) => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.symbol?.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      let av = 0, bv = 0;
      if (sortKey === "rank")   { av = a.market_cap_rank || 9999; bv = b.market_cap_rank || 9999; }
      if (sortKey === "price")  { av = a.current_price || 0; bv = b.current_price || 0; }
      if (sortKey === "change") { av = a.price_change_percentage_24h || 0; bv = b.price_change_percentage_24h || 0; }
      if (sortKey === "volume") { av = a.total_volume || 0; bv = b.total_volume || 0; }
      if (sortKey === "mcap")   { av = a.market_cap || 0; bv = b.market_cap || 0; }
      return sortDir === "asc" ? av - bv : bv - av;
    });

  const visibleSymbols = filtered.slice(0, 15).map((c: any) => c.symbol?.toUpperCase()).filter(Boolean);
  const { data: sparklineData } = useSparklines(visibleSymbols, 24);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white selection:bg-white/20 selection:text-white font-sans overflow-x-hidden pt-24 pb-20 px-6 lg:px-12 relative">
      
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay z-10"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto">
        
        {/* HEADER */}
        <FadeIn delay={0.1} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">Market Overview</h1>
            <p className="text-gray-400 font-medium text-sm md:text-base">Real-time algorithmic data and sentiment.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold tracking-widest text-green-400 uppercase">Live Connect</span>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/analysis/ai")} className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-bold shadow-xl">
              <Brain size={16} className="text-[var(--accent)]" /> AI Signals
            </motion.button>
          </div>
        </FadeIn>

        {/* BENTO STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          
          <FadeIn delay={0.2} className="relative overflow-hidden rounded-[2rem] bg-[#19191c] border border-white/5 p-6 md:p-8 flex flex-col justify-between hover:border-white/10 transition-colors group shadow-xl">
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Global Market Cap</div>
             <div className="text-3xl md:text-4xl font-black font-mono text-white tracking-tighter">
               <NumberFlow value={mcapFlow.val} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }} suffix={mcapFlow.suffix} />
             </div>
             <div className="text-sm text-gray-400 mt-2 font-medium">{(coins || []).length > 0 ? `${(coins || []).length}+ assets tracked` : "Loading..."}</div>
          </FadeIn>

          <FadeIn delay={0.3} className="relative overflow-hidden rounded-[2rem] bg-[#19191c] border border-white/5 p-6 md:p-8 flex flex-col justify-between hover:border-white/10 transition-colors group shadow-xl">
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">24h Volume</div>
             <div className="text-3xl md:text-4xl font-black font-mono text-white tracking-tighter">
               <NumberFlow value={volFlow.val} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }} suffix={volFlow.suffix} />
             </div>
             <div className="text-sm text-gray-400 mt-2 font-medium">Across all markets</div>
          </FadeIn>

          <FadeIn delay={0.4} className="relative overflow-hidden rounded-[2rem] bg-[#19191c] border border-white/5 p-6 md:p-8 flex flex-col justify-between hover:border-white/10 transition-colors group shadow-xl">
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Dominance</div>
             <div className="flex items-end gap-2">
               <div className="text-3xl md:text-4xl font-black font-mono text-orange-400 tracking-tighter">{btcDom}%</div>
               <div className="text-sm font-bold text-gray-500 mb-1">BTC</div>
             </div>
             <div className="text-sm text-gray-400 mt-2 font-medium">ETH: <span className="text-white font-mono">{ethDom}%</span></div>
          </FadeIn>

          <FadeIn delay={0.5} className="relative overflow-hidden rounded-[2rem] bg-[#19191c] border border-white/5 p-6 md:p-8 flex flex-col justify-between hover:border-white/10 transition-colors group shadow-xl">
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Fear & Greed</div>
             {fngValue !== null ? (
               <div className="flex items-center gap-4">
                 <div className="relative w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: `conic-gradient(${fngColor} 0% ${fngValue}%, rgba(255,255,255,0.05) ${fngValue}% 100%)`, boxShadow: `0 0 20px ${fngColor}30` }}>
                   <div className="absolute inset-[3px] rounded-full bg-[#19191c] flex items-center justify-center">
                     <span className="text-lg font-black font-mono text-white">{fngValue}</span>
                   </div>
                 </div>
                 <div>
                   <div className="text-lg font-bold" style={{ color: fngColor }}>{fngLabel}</div>
                   <div className="text-xs text-gray-400 mt-1 font-medium">Market Sentiment</div>
                 </div>
               </div>
             ) : (
               <div className="text-3xl font-black text-gray-600">—</div>
             )}
          </FadeIn>
        </div>

        {/* MAIN TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          
          {/* LEFT: TABLE */}
          <FadeIn delay={0.6} className="bg-[#19191c] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 flex-wrap gap-4 bg-white/[0.01]">
              <div className="relative w-full max-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent)]/50 transition-colors" />
              </div>
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                {([ { key: "all", label: "All" }, { key: "gainers", label: "Gainers" }, { key: "losers", label: "Losers" }, { key: "trending", label: "Trending" } ] as const).map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === tab.key ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table wrapper for scroll */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header */}
                <div className="grid grid-cols-[50px_2fr_130px_110px_140px_130px_100px] gap-4 px-6 py-4 border-b border-white/5 bg-black/20">
                  <TH label="#" active={sortKey === "rank"} direction={sortDir} onClick={() => toggleSort("rank")} />
                  <TH label="Asset" active={sortKey === "rank"} direction={sortDir} onClick={() => toggleSort("rank")} />
                  <TH label="Price" align="right" active={sortKey === "price"} direction={sortDir} onClick={() => toggleSort("price")} />
                  <TH label="24h %" align="right" active={sortKey === "change"} direction={sortDir} onClick={() => toggleSort("change")} />
                  <TH label="Volume" align="right" active={sortKey === "volume"} direction={sortDir} onClick={() => toggleSort("volume")} />
                  <TH label="Mkt Cap" align="right" active={sortKey === "mcap"} direction={sortDir} onClick={() => toggleSort("mcap")} />
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right pr-2">7d Trend</div>
                </div>

                {/* Body */}
                <div className="flex flex-col">
                  {filtered.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 font-medium">No results found.</div>
                  ) : (
                    filtered.slice(0, 15).map((coin: any, i: number) => {
                      const change = Number(coin.price_change_percentage_24h) || 0;
                      const isUp = change >= 0;
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-20px" }}
                          transition={{ delay: (i % 10) * 0.05 }}
                          whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                          key={coin.symbol + i}
                          onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                          className="grid grid-cols-[50px_2fr_130px_110px_140px_130px_100px] gap-4 px-6 py-4 border-b border-white/[0.02] items-center cursor-pointer group"
                        >
                          <div className="text-gray-500 font-mono text-sm">{coin.market_cap_rank || i + 1}</div>
                          <div className="flex items-center gap-3">
                            {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full bg-white/5" /> : <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{coin.symbol?.[0]}</div>}
                            <div>
                              <div className="font-bold text-white group-hover:text-[var(--accent)] transition-colors">{coin.name}</div>
                              <div className="text-xs text-gray-500 font-mono">{coin.symbol?.toUpperCase()}</div>
                            </div>
                          </div>
                          <div className="text-right"><PriceCell price={coin.current_price} /></div>
                          <div className="text-right flex justify-end"><ChangeBadge value={change} /></div>
                          <div className="text-right font-mono text-gray-300 text-sm">{fmt(coin.total_volume)}</div>
                          <div className="text-right font-mono text-gray-300 text-sm">{fmt(coin.market_cap)}</div>
                          <div className="pr-2"><MiniSparkline data={sparklineData?.[coin.symbol?.toUpperCase()]} up={isUp} /></div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* RIGHT: SIDEBAR */}
          <div className="flex flex-col gap-6">
            
            {/* Trending Box */}
            <FadeIn delay={0.7} className="bg-[#19191c] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Flame size={16} className="text-orange-500" />
                  </div>
                  <span className="font-bold text-white tracking-tight">Trending</span>
                </div>
                <button onClick={() => navigate("/market")} className="text-xs font-bold text-gray-500 hover:text-white transition-colors">View all</button>
              </div>
              <div className="flex flex-col p-2">
                {(trendingData || []).slice(0, 5).map((coin: any, i: number) => (
                  <motion.div whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.02)" }} key={i} onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)} className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-600 font-mono w-4">{i + 1}</span>
                      {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-6 h-6 rounded-full bg-white/5" /> : <div className="w-6 h-6 rounded-full bg-white/10" />}
                      <div className="font-bold text-sm text-gray-300">{coin.symbol?.toUpperCase()}</div>
                    </div>
                    {coin.price_change_percentage_24h != null && <ChangeBadge value={Number(coin.price_change_percentage_24h)} />}
                  </motion.div>
                ))}
              </div>
            </FadeIn>

            {/* Gainers Box */}
            <FadeIn delay={0.8} className="bg-[#19191c] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
              <div className="flex items-center p-5 border-b border-white/5 gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <span className="font-bold text-white tracking-tight">Top Gainers</span>
              </div>
              <div className="flex flex-col p-2">
                {(gainersData || []).slice(0, 5).map((coin: any, i: number) => (
                  <motion.div whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.02)" }} key={i} onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)} className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full bg-white/5" /> : <div className="w-8 h-8 rounded-full bg-white/10" />}
                      <div>
                        <div className="font-bold text-sm text-gray-300">{coin.name}</div>
                        <div className="text-xs font-mono text-gray-500">{fmt(coin.current_price)}</div>
                      </div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </motion.div>
                ))}
              </div>
            </FadeIn>

            {/* Losers Box */}
            <FadeIn delay={0.9} className="bg-[#19191c] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
              <div className="flex items-center p-5 border-b border-white/5 gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <TrendingDown size={16} className="text-red-500" />
                </div>
                <span className="font-bold text-white tracking-tight">Top Losers</span>
              </div>
              <div className="flex flex-col p-2">
                {(losersData || []).slice(0, 5).map((coin: any, i: number) => (
                  <motion.div whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.02)" }} key={i} onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)} className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full bg-white/5" /> : <div className="w-8 h-8 rounded-full bg-white/10" />}
                      <div>
                        <div className="font-bold text-sm text-gray-300">{coin.name}</div>
                        <div className="text-xs font-mono text-gray-500">{fmt(coin.current_price)}</div>
                      </div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </motion.div>
                ))}
              </div>
            </FadeIn>

          </div>
        </div>

      </div>
    </div>
  );
}