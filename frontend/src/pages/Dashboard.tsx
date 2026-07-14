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
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight, LayoutDashboard
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
  const color = up ? "#05b169" : "#cf202f"; // Coinbase semantic colors
  
  if (!data || data.length < 2) {
    return (
      <svg className="w-full h-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points="0,50 100,50" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" opacity={0.3}/>
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
          <stop offset="0%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,100 ${pts} 100,100`} fill={`url(#g-${up})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─── CHANGE BADGE ────────────────────────────────────────────
function ChangeBadge({ value }: { value: number }) {
  const isUp = value >= 0;
  // Coinbase style: semantic color text, no background
  return (
    <span className={`inline-flex items-center gap-0.5 text-[14px] font-medium font-mono ${isUp ? 'text-[#05b169]' : 'text-[#cf202f]'}`}>
      {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(value).toFixed(2)}%
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
      className={`flex items-center gap-1 text-[13px] font-semibold tracking-wide ${align === "right" ? "ml-auto" : ""} ${active ? "text-white" : "text-gray-400 hover:text-white"} transition-colors`}
    >
      {label}
      {active && (
        <span className="opacity-70 text-[#0052ff]">
          {direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      )}
    </button>
  );
}

// ─── FADE IN ─────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
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
  const safeCoins = Array.isArray(coins) ? coins : [];
  const calcTotalVolume = safeCoins.reduce((s: number, c: any) => s + (Number(c.total_volume) || 0), 0) || 0;
  const calcTotalMcap = safeCoins.reduce((s: number, c: any) => s + (Number(c.market_cap) || 0), 0) || 0;
  const btc = safeCoins.find((c: any) => c.symbol?.toUpperCase() === "BTC");
  const eth = safeCoins.find((c: any) => c.symbol?.toUpperCase() === "ETH");
  const calcBtcDom = btc && calcTotalMcap ? ((Number(btc.market_cap) / calcTotalMcap) * 100).toFixed(1) : "—";
  const calcEthDom = eth && calcTotalMcap ? ((Number(eth.market_cap) / calcTotalMcap) * 100).toFixed(1) : "—";

  const totalMcap = statsData?.data?.total_market_cap?.usd || statsData?.total_market_cap?.usd || calcTotalMcap;
  const totalVolume = statsData?.data?.total_volume?.usd || statsData?.total_volume?.usd || calcTotalVolume;
  const btcDom = statsData?.data?.market_cap_percentage?.btc?.toFixed(1) || calcBtcDom;
  const ethDom = statsData?.data?.market_cap_percentage?.eth?.toFixed(1) || calcEthDom;
  const fngValue = fng ? parseInt(fng.value) : null;
  
  const fngColor = fngValue == null ? "#a8acb3" : fngValue <= 25 ? "#cf202f" : fngValue <= 45 ? "#f4b000" : fngValue <= 55 ? "#a8acb3" : fngValue <= 75 ? "#05b169" : "#05b169";
  const fngLabel = fngValue == null ? "—" : fngValue <= 25 ? "Extreme Fear" : fngValue <= 45 ? "Fear" : fngValue <= 55 ? "Neutral" : fngValue <= 75 ? "Greed" : "Extreme Greed";

  const mcapFlow = getFlowData(totalMcap);
  const volFlow = getFlowData(totalVolume);

  // List
  const safeGainers = Array.isArray(gainersData) ? gainersData : [];
  const safeLosers = Array.isArray(losersData) ? losersData : [];
  const safeTrending = Array.isArray(trendingData) ? trendingData : [];
  const baseList: any[] = activeTab === "gainers" ? safeGainers : activeTab === "losers" ? safeLosers : activeTab === "trending"? safeTrending : safeCoins;
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
    <div className="bg-transparent text-white selection:bg-[#0052ff] selection:text-white font-sans overflow-x-hidden pt-8 pb-20 px-6 lg:px-12 w-full">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* HEADER */}
        <FadeIn delay={0.1} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-normal tracking-[-1px] text-white mb-2">Market Overview</h1>
            <p className="text-gray-400 text-base">Real-time algorithmic data and sentiment.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
              <span className="w-2 h-2 rounded-full bg-[#05b169] animate-pulse"></span>
              <span className="text-xs font-semibold tracking-wide text-[#05b169] uppercase">Live</span>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={() => navigate("/dashboard/builder")} 
              className="px-4 py-2.5 rounded-full bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 transition-colors flex items-center gap-2 text-[14px] font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            >
              <LayoutDashboard size={16} /> Personalize (PRO)
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={() => navigate("/analysis/ai")} 
              className="px-5 py-2.5 rounded-full bg-[#0052ff] hover:bg-[#003ecc] text-white transition-colors flex items-center gap-2 text-[16px] font-semibold"
            >
              <Brain size={18} /> AI Signals
            </motion.button>
          </div>
        </FadeIn>

        {/* BENTO STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          <motion.div whileHover={{ y: -4 }} className="md:col-span-1">
            <FadeIn delay={0.2} className="h-full rounded-[24px] bg-[#111214] border border-white/10 p-8 flex flex-col justify-between shadow-none hover:shadow-none transition-all">
               <div>
                 <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Global Market Cap</div>
                 <div className="text-3xl md:text-4xl font-medium font-mono text-white tracking-tight">
                   <NumberFlow value={mcapFlow.val} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }} suffix={mcapFlow.suffix} />
                 </div>
                 <div className="text-[14px] text-gray-500 mt-2">{(coins || []).length > 0 ? `${(coins || []).length}+ assets tracked` : "Loading..."}</div>
               </div>
            </FadeIn>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="md:col-span-1">
            <FadeIn delay={0.3} className="h-full rounded-[24px] bg-[#111214] border border-white/10 p-8 flex flex-col justify-between shadow-none hover:shadow-none transition-all">
               <div>
                 <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">24h Volume</div>
                 <div className="text-3xl md:text-4xl font-medium font-mono text-white tracking-tight">
                   <NumberFlow value={volFlow.val} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }} suffix={volFlow.suffix} />
                 </div>
                 <div className="text-[14px] text-gray-500 mt-2">Across all markets</div>
               </div>
            </FadeIn>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="md:col-span-1">
            <FadeIn delay={0.4} className="h-full rounded-[24px] bg-[#111214] border border-white/10 p-8 flex flex-col justify-between shadow-none hover:shadow-none transition-all">
               <div>
                 <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Dominance</div>
                 <div className="flex items-end gap-2">
                   <div className="text-3xl md:text-4xl font-medium font-mono text-[#f4b000] tracking-tight">{btcDom}%</div>
                   <div className="text-[14px] font-semibold text-gray-400 mb-1">BTC</div>
                 </div>
                 <div className="text-[14px] text-gray-500 mt-2">ETH: <span className="text-white font-mono font-medium">{ethDom}%</span></div>
               </div>
            </FadeIn>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="md:col-span-1">
            <FadeIn delay={0.5} className="h-full rounded-[24px] bg-[#111214] border border-white/10 p-8 flex flex-col justify-between shadow-none hover:shadow-none transition-all">
               <div>
                 <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Fear & Greed</div>
                 {fngValue !== null ? (
                   <div className="flex items-center gap-4">
                     <div className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `conic-gradient(${fngColor} 0% ${fngValue}%, #eef0f3 ${fngValue}% 100%)` }}>
                       <div className="absolute inset-[4px] rounded-full bg-[#111214] flex items-center justify-center">
                         <span className="text-[16px] font-medium font-mono text-white">{fngValue}</span>
                       </div>
                     </div>
                     <div>
                       <div className="text-[18px] font-semibold" style={{ color: fngColor }}>{fngLabel}</div>
                       <div className="text-[14px] text-gray-500 mt-0.5">Market Sentiment</div>
                     </div>
                   </div>
                 ) : (
                   <div className="text-3xl md:text-4xl font-medium text-gray-600">—</div>
                 )}
               </div>
            </FadeIn>
          </motion.div>
        </div>

        {/* MAIN 12-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* LEFT: TABLE (8 cols) */}
          <div className="xl:col-span-8">
            <FadeIn delay={0.6} className="bg-[#111214] border border-white/10 rounded-[24px] overflow-hidden shadow-sm flex flex-col h-full">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-white/10 gap-4">
                <div className="relative w-full max-w-[280px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." className="w-full bg-white/5 border-none rounded-full py-3 pl-11 pr-4 text-[16px] text-white placeholder-[#7c828a] focus:outline-none focus:ring-2 focus:ring-[#0052ff] transition-shadow" />
                </div>
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
                  {([ { key: "all", label: "All" }, { key: "gainers", label: "Gainers" }, { key: "losers", label: "Losers" }, { key: "trending", label: "Trending" } ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-colors ${activeTab === tab.key ? "bg-[#0052ff] text-white shadow-sm" : "text-gray-400 hover:text-white"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table wrapper for scroll */}
              <div className="overflow-x-auto">
                <div className="min-w-max w-full">
                  {/* Header */}
                  <div className="grid grid-cols-[50px_2fr_130px_110px_140px_130px_100px] gap-4 px-6 py-4 border-b border-white/10 bg-white/5">
                    <TH label="#" active={sortKey === "rank"} direction={sortDir} onClick={() => toggleSort("rank")} />
                    <TH label="Asset" active={sortKey === "rank"} direction={sortDir} onClick={() => toggleSort("rank")} />
                    <TH label="Price" align="right" active={sortKey === "price"} direction={sortDir} onClick={() => toggleSort("price")} />
                    <TH label="24h %" align="right" active={sortKey === "change"} direction={sortDir} onClick={() => toggleSort("change")} />
                    <TH label="Volume" align="right" active={sortKey === "volume"} direction={sortDir} onClick={() => toggleSort("volume")} />
                    <TH label="Mkt Cap" align="right" active={sortKey === "mcap"} direction={sortDir} onClick={() => toggleSort("mcap")} />
                    <div className="text-[13px] font-semibold text-gray-400 text-right pr-2">7d Trend</div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col bg-[#111214]">
                    {filtered.length === 0 ? (
                      <div className="p-16 text-center text-gray-500 font-medium text-[16px]">No assets found.</div>
                    ) : (
                      filtered.slice(0, 15).map((coin: any, i: number) => {
                        const change = Number(coin.price_change_percentage_24h) || 0;
                        const isUp = change >= 0;
                        return (
                          <div
                            key={coin.symbol + i}
                            onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                            className="grid grid-cols-[50px_2fr_130px_110px_140px_130px_100px] gap-4 px-6 py-4 border-b border-white/5 last:border-0 items-center cursor-pointer hover:bg-white/5 transition-colors group"
                          >
                            <div className="text-gray-600 font-mono text-[14px]">{coin.market_cap_rank || i + 1}</div>
                            <div className="flex items-center gap-3">
                              {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full bg-white/5" /> : <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[12px] font-semibold text-gray-400">{coin.symbol?.[0]}</div>}
                              <div>
                                <div className="font-semibold text-white group-hover:text-[#0052ff] transition-colors text-[16px]">{coin.name}</div>
                                <div className="text-[14px] text-gray-400 font-mono">{coin.symbol?.toUpperCase()}</div>
                              </div>
                            </div>
                            <div className="text-right text-white font-mono font-medium text-[16px]"><PriceCell price={coin.current_price} /></div>
                            <div className="text-right flex justify-end"><ChangeBadge value={change} /></div>
                            <div className="text-right font-mono text-gray-400 text-[15px]">{fmt(coin.total_volume)}</div>
                            <div className="text-right font-mono text-gray-400 text-[15px]">{fmt(coin.market_cap)}</div>
                            <div className="pr-2"><MiniSparkline data={sparklineData?.[coin.symbol?.toUpperCase()]} up={isUp} /></div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* RIGHT: SIDEBAR (4 cols) */}
          <div className="xl:col-span-4 flex flex-col gap-8">
            
            {/* Trending Box */}
            <FadeIn delay={0.7} className="bg-[#111214] border border-white/10 rounded-[24px] overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f4b000]/10 flex items-center justify-center">
                    <Flame size={20} className="text-[#f4b000]" />
                  </div>
                  <span className="text-[18px] font-semibold text-white">Trending</span>
                </div>
                <button onClick={() => navigate("/market")} className="text-[14px] font-semibold text-[#0052ff] hover:text-[#003ecc] transition-colors">View all</button>
              </div>
              <div className="flex flex-col p-3">
                {(safeTrending).slice(0, 5).map((coin: any, i: number) => (
                  <div key={i} onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)} className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold text-gray-600 font-mono w-4">{i + 1}</span>
                      {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full bg-white/5" /> : <div className="w-8 h-8 rounded-full bg-white/5" />}
                      <div className="font-semibold text-[16px] text-white">{coin.symbol?.toUpperCase()}</div>
                    </div>
                    {coin.price_change_percentage_24h != null && <ChangeBadge value={Number(coin.price_change_percentage_24h)} />}
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Gainers Box */}
            <FadeIn delay={0.8} className="bg-[#111214] border border-white/10 rounded-[24px] overflow-hidden shadow-sm">
              <div className="flex items-center p-6 border-b border-white/10 gap-3">
                <div className="w-10 h-10 rounded-full bg-[#05b169]/10 flex items-center justify-center">
                  <TrendingUp size={20} className="text-[#05b169]" />
                </div>
                <span className="text-[18px] font-semibold text-white">Top Gainers</span>
              </div>
              <div className="flex flex-col p-3">
                {(safeGainers).slice(0, 5).map((coin: any, i: number) => (
                  <div key={i} onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)} className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full bg-white/5" /> : <div className="w-8 h-8 rounded-full bg-white/5" />}
                      <div>
                        <div className="font-semibold text-[16px] text-white">{coin.name}</div>
                        <div className="text-[14px] font-mono text-gray-400">{fmt(coin.current_price)}</div>
                      </div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Losers Box */}
            <FadeIn delay={0.9} className="bg-[#111214] border border-white/10 rounded-[24px] overflow-hidden shadow-sm">
              <div className="flex items-center p-6 border-b border-white/10 gap-3">
                <div className="w-10 h-10 rounded-full bg-[#cf202f]/10 flex items-center justify-center">
                  <TrendingDown size={20} className="text-[#cf202f]" />
                </div>
                <span className="text-[18px] font-semibold text-white">Top Losers</span>
              </div>
              <div className="flex flex-col p-3">
                {(safeLosers).slice(0, 5).map((coin: any, i: number) => (
                  <div key={i} onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)} className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full bg-white/5" /> : <div className="w-8 h-8 rounded-full bg-white/5" />}
                      <div>
                        <div className="font-semibold text-[16px] text-white">{coin.name}</div>
                        <div className="text-[14px] font-mono text-gray-400">{fmt(coin.current_price)}</div>
                      </div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </div>
                ))}
              </div>
            </FadeIn>

          </div>
        </div>

      </div>
    </div>
  );
}
