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
import { useGlobalHistory } from "../hooks/useGlobalHistory";
import { useSparklines } from "../hooks/useSparklines";
import PriceCell from "../components/ui/PriceCell";
import {
  TrendingUp, TrendingDown, Brain, Flame, Search,
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight, LayoutDashboard
} from "lucide-react";
import { MLAnomalyWidget } from "../components/dashboard/MLAnomalyWidget";
import { FearGreedModal } from "../components/dashboard/FearGreedModal";
import { GlobalStatsModal } from "../components/dashboard/GlobalStatsModal";
import { WhaleFeed } from "../components/dashboard/WhaleFeed";

// ─── MATTE CARD WRAPPER ────────────────────────
function MatteCard({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden w-full h-full transition-colors duration-200 shadow-sm ${onClick ? "cursor-pointer hover:border-[var(--border-base)] hover:shadow-lg" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

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
  if (n >= 1e9) return { val: n / 1e9, suffix: "B" };
  if (n >= 1e6) return { val: n / 1e6, suffix: "M" };
  return { val: n, suffix: "" };
}

// ─── SPARKLINE ───────────────────────────────────────────────
function MiniSparkline({ data, up }: { data?: any[], up: boolean }) {
  const color = up ? "#10B981" : "#EF4444"; // Soft Emerald / Red
  
  if (!data || data.length < 2) {
    return (
      <svg className="w-full h-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points="0,50 100,50" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity={0.3}/>
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
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─── CHANGE BADGE ────────────────────────────────────────────
function ChangeBadge({ value }: { value: number }) {
  const isUp = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[14px] font-medium ${isUp ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
      {isUp ? <ArrowUpRight size={16} strokeWidth={2.5} /> : <ArrowDownRight size={16} strokeWidth={2.5} />}
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
      className={`flex items-center gap-1.5 text-[13px] font-bold tracking-wider uppercase ${align === "right" ? "ml-auto" : ""} ${active ? "text-[var(--text-main)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"} transition-colors`}
    >
      {label}
      {active && (
        <span className="text-[var(--text-main)] opacity-70">
          {direction === "asc" ? <ChevronUp size={15} strokeWidth={3} /> : <ChevronDown size={15} strokeWidth={3} />}
        </span>
      )}
    </button>
  );
}

// ─── FADE IN ─────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "", onClick }: { children: React.ReactNode, delay?: number, className?: string, onClick?: () => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
      onClick={onClick}
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
  const { data: fng, history: fngHistory } = useFearAndGreed();
  const { data: globalHistory } = useGlobalHistory(30);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<"all" | "gainers" | "losers" | "trending">("all");
  const [isFngModalOpen, setIsFngModalOpen] = useState(false);
  const [statsModalType, setStatsModalType] = useState<"mcap" | "volume" | "dominance" | null>(null);

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
  
  const fngColor = fngValue == null ? "#9CA3AF" : fngValue <= 25 ? "#EF4444" : fngValue <= 45 ? "#F59E0B" : fngValue <= 55 ? "#9CA3AF" : fngValue <= 75 ? "#10B981" : "#10B981";
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
    <div className="bg-[var(--bg-base)] text-[var(--text-main)] selection:bg-[var(--accent)]/30 selection:text-[var(--accent)] font-sans overflow-x-hidden py-16 px-4 md:px-8 w-full min-h-[100dvh]">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* HEADER */}
        <FadeIn delay={0.1} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] mb-6 shadow-sm"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--positive)] opacity-70" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--positive)]" />
              </span>
              <span className="text-[10px] tracking-[0.2em] font-bold text-[var(--text-muted)] font-mono uppercase">
                Market: Live <span className="opacity-40 px-1.5">//</span> WebSockets Active
              </span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--text-main)] mb-2">Market Overview</h1>
            <p className="text-[var(--text-muted)] text-[16px] font-medium">Real-time cryptocurrency prices and metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={() => navigate("/dashboard/builder")} 
              className="px-5 py-2.5 rounded-[12px] bg-[var(--bg-subtle)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:bg-[var(--bg-overlay)] hover:border-[var(--border-base)] transition-colors flex items-center gap-2 text-[14px] font-medium shadow-sm"
            >
              <LayoutDashboard size={18} /> Edit Layout
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={() => navigate("/analysis/ai")} 
              className="px-5 py-2.5 rounded-[12px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors flex items-center gap-2 text-[14px] font-bold shadow-md shadow-[var(--accent)]/20"
            >
              <Brain size={18} /> AI Analysis
            </motion.button>
          </div>
        </FadeIn>

        {/* ML ANOMALIES TICKER */}
        <FadeIn delay={0.15} className="mb-8 w-full">
          <MatteCard className="p-0">
            <MLAnomalyWidget />
          </MatteCard>
        </FadeIn>

        {/* BENTO STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          <motion.div className="md:col-span-1 h-[170px]">
            <FadeIn delay={0.2} className="h-full">
               <MatteCard onClick={() => setStatsModalType("mcap")} className="p-6 flex flex-col justify-between group">
                 <div className="text-[14px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">Global Market Cap</div>
                 <div>
                   <div className="text-3xl font-semibold text-[var(--text-main)] tracking-tight">
                     <NumberFlow value={mcapFlow.val} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }} suffix={mcapFlow.suffix} />
                   </div>
                   <div className="text-[13px] font-medium text-[var(--text-faint)] mt-1">{(coins || []).length > 0 ? `${(coins || []).length}+ assets tracked` : "Loading..."}</div>
                 </div>
               </MatteCard>
            </FadeIn>
          </motion.div>

          <motion.div className="md:col-span-1 h-[170px]">
            <FadeIn delay={0.3} className="h-full">
               <MatteCard onClick={() => setStatsModalType("volume")} className="p-6 flex flex-col justify-between group">
                 <div className="text-[14px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">24h Volume</div>
                 <div>
                   <div className="text-3xl font-semibold text-[var(--text-main)] tracking-tight">
                     <NumberFlow value={volFlow.val} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }} suffix={volFlow.suffix} />
                   </div>
                   <div className="text-[13px] font-medium text-[var(--text-faint)] mt-1">Global network activity</div>
                 </div>
               </MatteCard>
            </FadeIn>
          </motion.div>

          <motion.div className="md:col-span-1 h-[170px]">
            <FadeIn delay={0.4} className="h-full">
               <MatteCard onClick={() => setStatsModalType("dominance")} className="p-6 flex flex-col justify-between group">
                 <div className="text-[14px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">Dominance</div>
                 <div>
                   <div className="flex items-end gap-2">
                     <div className="text-3xl font-semibold text-[#F59E0B] tracking-tight">{btcDom}%</div>
                     <div className="text-[14px] font-medium text-[var(--text-muted)] mb-1">BTC</div>
                   </div>
                   <div className="text-[13px] font-medium text-[var(--text-muted)] mt-1">ETH: <span className="text-[var(--text-main)]">{ethDom}%</span></div>
                 </div>
               </MatteCard>
            </FadeIn>
          </motion.div>

          <motion.div className="md:col-span-1 h-[170px]">
            <FadeIn delay={0.5} className="h-full">
               <MatteCard onClick={() => setIsFngModalOpen(true)} className="p-6 flex flex-col justify-between group">
                 <div className="flex items-center justify-between">
                   <div className="text-[14px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">Fear & Greed</div>
                   <div className="text-[11px] bg-[var(--bg-overlay)] border border-[var(--border-subtle)] px-2 py-1 rounded-md font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">VIEW</div>
                 </div>
                 {fngValue !== null ? (
                   <div className="flex items-center gap-4">
                     <div className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: `conic-gradient(${fngColor} 0% ${fngValue}%, rgba(128,128,128,0.1) ${fngValue}% 100%)` }}>
                       <div className="absolute inset-[3px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                         <span className="text-[14px] font-medium text-[var(--text-main)]">{fngValue}</span>
                       </div>
                     </div>
                     <div>
                       <div className="text-[15px] font-medium" style={{ color: fngColor }}>{fngLabel}</div>
                     </div>
                   </div>
                 ) : (
                   <div className="text-3xl font-semibold text-[var(--text-faint)]">—</div>
                 )}
               </MatteCard>
            </FadeIn>
          </motion.div>
        </div>

        {/* MAIN 12-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT: TABLE (8 cols) */}
          <div className="xl:col-span-8">
            <FadeIn delay={0.6} className="h-full">
              <MatteCard className="flex flex-col h-full">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-[var(--border-subtle)] gap-4">
                  <div className="relative w-full max-w-[280px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." className="w-full bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-[10px] py-2 pl-10 pr-4 text-[14px] font-medium text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all" />
                  </div>
                  <div className="flex items-center gap-1 bg-[var(--bg-overlay)] p-1 rounded-[10px] border border-[var(--border-subtle)]">
                    {([ { key: "all", label: "All" }, { key: "gainers", label: "Gainers" }, { key: "losers", label: "Losers" }, { key: "trending", label: "Trending" } ] as const).map(tab => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${activeTab === tab.key ? "bg-[var(--bg-elevated)] text-[var(--text-main)] shadow-sm border border-[var(--border-subtle)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] border border-transparent"}`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table wrapper for scroll */}
                <div className="overflow-x-auto flex-1">
                  <div className="min-w-max w-full">
                    {/* Header */}
                    <div className="grid grid-cols-[50px_2fr_130px_110px_140px_130px_100px] gap-4 px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                      <TH label="#" active={sortKey === "rank"} direction={sortDir} onClick={() => toggleSort("rank")} />
                      <TH label="Asset" active={sortKey === "rank"} direction={sortDir} onClick={() => toggleSort("rank")} />
                      <TH label="Price" align="right" active={sortKey === "price"} direction={sortDir} onClick={() => toggleSort("price")} />
                      <TH label="24h %" align="right" active={sortKey === "change"} direction={sortDir} onClick={() => toggleSort("change")} />
                      <TH label="Volume" align="right" active={sortKey === "volume"} direction={sortDir} onClick={() => toggleSort("volume")} />
                      <TH label="Market Cap" align="right" active={sortKey === "mcap"} direction={sortDir} onClick={() => toggleSort("mcap")} />
                      <div className="text-[13px] font-medium tracking-wide text-zinc-500 text-right pr-2">7d Trend</div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-col pb-4">
                      {filtered.length === 0 ? (
                        <div className="p-16 text-center text-[var(--text-faint)] font-medium text-[14px]">No assets found.</div>
                      ) : (
                        filtered.slice(0, 15).map((coin: any, i: number) => {
                          const change = Number(coin.price_change_percentage_24h) || 0;
                          const isUp = change >= 0;
                          return (
                            <motion.div
                              key={coin.symbol + i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
                              onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                              className="grid grid-cols-[50px_2fr_130px_110px_140px_130px_100px] gap-4 px-6 py-4 border-b border-[var(--border-subtle)] last:border-0 items-center cursor-pointer hover:bg-[var(--bg-overlay)] transition-colors group"
                            >
                              <div className="text-[var(--text-faint)] font-medium text-[14px]">{coin.market_cap_rank || i + 1}</div>
                              <div className="flex items-center gap-3">
                                {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium bg-[var(--bg-overlay)] text-[var(--text-muted)]">{coin.symbol?.[0]}</div>}
                                <div>
                                  <div className="font-medium text-[var(--text-main)] text-[15px]">{coin.name}</div>
                                  <div className="text-[13px] text-[var(--text-faint)] font-medium">{coin.symbol?.toUpperCase()}</div>
                                </div>
                              </div>
                              <div className="text-right text-[var(--text-main)] font-medium text-[15px] font-mono tabular-nums"><PriceCell price={coin.current_price} /></div>
                              <div className="text-right flex justify-end"><ChangeBadge value={change} /></div>
                              <div className="text-right font-medium text-[var(--text-muted)] text-[14px] font-mono">{fmt(coin.total_volume)}</div>
                              <div className="text-right font-medium text-[var(--text-muted)] text-[14px] font-mono">{fmt(coin.market_cap)}</div>
                              <div className="pr-2"><MiniSparkline data={sparklineData?.[coin.symbol?.toUpperCase()]} up={isUp} /></div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </MatteCard>
            </FadeIn>
          </div>

          {/* RIGHT: SIDEBAR (4 cols) */}
          <div className="xl:col-span-4 flex flex-col gap-6">

            <FadeIn delay={0.8} className="w-full flex-1">
              <MatteCard className="p-0 h-full min-h-[600px]">
                 <WhaleFeed />
              </MatteCard>
            </FadeIn>

          </div>
        </div>

      </div>
      <FearGreedModal 
        isOpen={isFngModalOpen} 
        onClose={() => setIsFngModalOpen(false)} 
        history={fngHistory || []} 
      />
      <GlobalStatsModal 
        isOpen={statsModalType !== null}
        onClose={() => setStatsModalType(null)}
        type={statsModalType || "mcap"}
        data={globalHistory}
      />
    </div>
  );
}
