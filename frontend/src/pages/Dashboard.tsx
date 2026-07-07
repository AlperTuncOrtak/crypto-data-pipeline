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
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight
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
      <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points="0,50 100,50" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity={0.3}/>
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
    <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
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
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono ${isUp ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
      {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
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
      className={`flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider ${align === "right" ? "ml-auto" : ""} ${active ? "text-[#f7f8f8]" : "text-[#8a8f98] hover:text-[#d0d6e0]"} transition-colors`}
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
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
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
  
  const fngLabel = fngValue == null ? "—" : fngValue <= 25 ? "Extreme Fear" : fngValue <= 45 ? "Fear" : fngValue <= 55 ? "Neutral" : fngValue <= 75 ? "Greed" : "Extreme Greed";
  const fngColorClass = fngValue == null ? "text-gray-500" : fngValue <= 45 ? "text-rose-500" : fngValue <= 55 ? "text-amber-500" : "text-emerald-500";

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
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans overflow-x-hidden pt-24 pb-20 px-6 lg:px-12 relative">
      <div className="max-w-[1280px] mx-auto">
        
        {/* HEADER */}
        <FadeIn delay={0.1} className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#f7f8f8]">Market Overview</h1>
            <p className="text-[#8a8f98] text-sm mt-1">Real-time market data & sentiment.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#27a644]/10 border border-[#27a644]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#27a644] animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-widest text-[#27a644] uppercase">Live</span>
            </div>
            <button onClick={() => navigate("/analysis/ai")} className="px-3 py-1.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-soft)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-mid)] transition-colors flex items-center gap-2 text-xs font-medium text-[#f7f8f8]">
              <Brain size={14} className="text-[#5e6ad2]" /> AI Signals
            </button>
          </div>
        </FadeIn>

        {/* BENTO STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <FadeIn delay={0.2}>
            <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)] p-5 flex flex-col h-full hover:border-[var(--border-mid)] transition-colors">
              <div className="text-[11px] font-medium text-[#8a8f98] uppercase tracking-wider mb-2">Global Market Cap</div>
              <div className="text-2xl font-mono text-[#f7f8f8] tracking-tight">
                <NumberFlow value={mcapFlow.val} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }} suffix={mcapFlow.suffix} />
              </div>
              <div className="text-[11px] text-[#62666d] mt-auto pt-4">{(coins || []).length > 0 ? `${(coins || []).length}+ assets tracked` : "Loading..."}</div>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)] p-5 flex flex-col h-full hover:border-[var(--border-mid)] transition-colors">
              <div className="text-[11px] font-medium text-[#8a8f98] uppercase tracking-wider mb-2">24h Volume</div>
              <div className="text-2xl font-mono text-[#f7f8f8] tracking-tight">
                <NumberFlow value={volFlow.val} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }} suffix={volFlow.suffix} />
              </div>
              <div className="text-[11px] text-[#62666d] mt-auto pt-4">Across all markets</div>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)] p-5 flex flex-col h-full hover:border-[var(--border-mid)] transition-colors">
              <div className="text-[11px] font-medium text-[#8a8f98] uppercase tracking-wider mb-2">BTC Dominance</div>
              <div className="text-2xl font-mono text-[#f7f8f8] tracking-tight">{btcDom}%</div>
              <div className="text-[11px] text-[#62666d] mt-auto pt-4">ETH: {ethDom}%</div>
            </div>
          </FadeIn>

          <FadeIn delay={0.5}>
            <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-soft)] p-5 flex flex-col h-full hover:border-[var(--border-mid)] transition-colors">
              <div className="text-[11px] font-medium text-[#8a8f98] uppercase tracking-wider mb-2">Fear & Greed</div>
              <div className={`text-2xl font-mono tracking-tight ${fngColorClass}`}>
                {fngValue !== null ? fngValue : "—"}
              </div>
              <div className="text-[11px] text-[#62666d] mt-auto pt-4">{fngLabel}</div>
            </div>
          </FadeIn>
        </div>

        {/* MAIN TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          
          {/* LEFT: TABLE */}
          <FadeIn delay={0.6} className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-xl overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-soft)] flex-wrap gap-4">
              <div className="relative w-full max-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8f98]" size={14} />
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Filter assets..." 
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-soft)] rounded-md py-1.5 pl-8 pr-3 text-[13px] text-[#f7f8f8] placeholder-[#62666d] focus:outline-none focus:border-[#5e6ad2] transition-colors" 
                />
              </div>
              <div className="flex items-center gap-1 bg-[var(--bg-base)] p-1 rounded-md border border-[var(--border-soft)]">
                {([ { key: "all", label: "All" }, { key: "gainers", label: "Gainers" }, { key: "losers", label: "Losers" }, { key: "trending", label: "Trending" } ] as const).map(tab => (
                  <button 
                    key={tab.key} 
                    onClick={() => setActiveTab(tab.key)} 
                    className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${activeTab === tab.key ? "bg-[var(--bg-surface)] text-[#f7f8f8] shadow-sm border border-[var(--border-soft)]" : "text-[#8a8f98] hover:text-[#d0d6e0] border border-transparent"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table wrapper for scroll */}
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Header */}
                <div className="grid grid-cols-[40px_2.5fr_100px_100px_120px_120px_80px] gap-4 px-4 py-3 border-b border-[var(--border-soft)] bg-[var(--bg-base)]">
                  <TH label="#" active={sortKey === "rank"} direction={sortDir} onClick={() => toggleSort("rank")} />
                  <TH label="Asset" active={sortKey === "rank"} direction={sortDir} onClick={() => toggleSort("rank")} />
                  <TH label="Price" align="right" active={sortKey === "price"} direction={sortDir} onClick={() => toggleSort("price")} />
                  <TH label="24h" align="right" active={sortKey === "change"} direction={sortDir} onClick={() => toggleSort("change")} />
                  <TH label="Volume" align="right" active={sortKey === "volume"} direction={sortDir} onClick={() => toggleSort("volume")} />
                  <TH label="Market Cap" align="right" active={sortKey === "mcap"} direction={sortDir} onClick={() => toggleSort("mcap")} />
                  <div className="text-[11px] font-medium text-[#8a8f98] uppercase tracking-wider text-right pr-2">Trend</div>
                </div>

                {/* Body */}
                <div className="flex flex-col">
                  {filtered.length === 0 ? (
                    <div className="p-8 text-center text-[#8a8f98] text-[13px]">No matching assets found.</div>
                  ) : (
                    filtered.slice(0, 15).map((coin: any, i: number) => {
                      const change = Number(coin.price_change_percentage_24h) || 0;
                      const isUp = change >= 0;
                      return (
                        <div
                          key={coin.symbol + i}
                          onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                          className="grid grid-cols-[40px_2.5fr_100px_100px_120px_120px_80px] gap-4 px-4 py-3 border-b border-[var(--border-soft)] last:border-0 items-center cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                        >
                          <div className="text-[#62666d] font-mono text-[13px]">{coin.market_cap_rank || i + 1}</div>
                          <div className="flex items-center gap-3">
                            {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-5 h-5 rounded-sm" /> : <div className="w-5 h-5 rounded-sm bg-[var(--border-soft)] flex items-center justify-center text-[10px] font-bold">{coin.symbol?.[0]}</div>}
                            <div className="flex items-baseline gap-2">
                              <div className="font-medium text-[#f7f8f8] text-[13px] group-hover:text-[#5e6ad2] transition-colors">{coin.name}</div>
                              <div className="text-[11px] text-[#8a8f98] font-mono">{coin.symbol?.toUpperCase()}</div>
                            </div>
                          </div>
                          <div className="text-right text-[13px] text-[#f7f8f8] font-mono"><PriceCell price={coin.current_price} /></div>
                          <div className="text-right flex justify-end"><ChangeBadge value={change} /></div>
                          <div className="text-right font-mono text-[#d0d6e0] text-[13px]">{fmt(coin.total_volume)}</div>
                          <div className="text-right font-mono text-[#d0d6e0] text-[13px]">{fmt(coin.market_cap)}</div>
                          <div className="pr-2"><MiniSparkline data={sparklineData?.[coin.symbol?.toUpperCase()]} up={isUp} /></div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* RIGHT: SIDEBAR */}
          <div className="flex flex-col gap-4">
            
            {/* Trending Box */}
            <FadeIn delay={0.7} className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-[var(--border-soft)]">
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-orange-500" />
                  <span className="text-[13px] font-medium text-[#f7f8f8]">Trending</span>
                </div>
                <button onClick={() => navigate("/market")} className="text-[11px] font-medium text-[#8a8f98] hover:text-[#d0d6e0] transition-colors">View all</button>
              </div>
              <div className="flex flex-col">
                {(safeTrending).slice(0, 5).map((coin: any, i: number) => (
                  <div key={i} onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)} className="flex items-center justify-between p-3 border-b border-[var(--border-soft)] last:border-0 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] text-[#62666d] font-mono w-3">{i + 1}</span>
                      {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-4 h-4 rounded-sm" /> : <div className="w-4 h-4 rounded-sm bg-[var(--border-soft)]" />}
                      <div className="font-medium text-[13px] text-[#d0d6e0]">{coin.symbol?.toUpperCase()}</div>
                    </div>
                    {coin.price_change_percentage_24h != null && <ChangeBadge value={Number(coin.price_change_percentage_24h)} />}
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Gainers Box */}
            <FadeIn delay={0.8} className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-xl overflow-hidden">
              <div className="flex items-center p-3 border-b border-[var(--border-soft)] gap-2">
                <TrendingUp size={14} className="text-green-500" />
                <span className="text-[13px] font-medium text-[#f7f8f8]">Top Gainers</span>
              </div>
              <div className="flex flex-col">
                {(safeGainers).slice(0, 5).map((coin: any, i: number) => (
                  <div key={i} onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)} className="flex items-center justify-between p-3 border-b border-[var(--border-soft)] last:border-0 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center gap-2.5">
                      {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-4 h-4 rounded-sm" /> : <div className="w-4 h-4 rounded-sm bg-[var(--border-soft)]" />}
                      <div className="flex flex-col">
                        <div className="font-medium text-[13px] text-[#d0d6e0]">{coin.symbol?.toUpperCase()}</div>
                      </div>
                    </div>
                    <ChangeBadge value={Number(coin.price_change_percentage_24h)} />
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Losers Box */}
            <FadeIn delay={0.9} className="bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-xl overflow-hidden">
              <div className="flex items-center p-3 border-b border-[var(--border-soft)] gap-2">
                <TrendingDown size={14} className="text-red-500" />
                <span className="text-[13px] font-medium text-[#f7f8f8]">Top Losers</span>
              </div>
              <div className="flex flex-col">
                {(safeLosers).slice(0, 5).map((coin: any, i: number) => (
                  <div key={i} onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)} className="flex items-center justify-between p-3 border-b border-[var(--border-soft)] last:border-0 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center gap-2.5">
                      {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-4 h-4 rounded-sm" /> : <div className="w-4 h-4 rounded-sm bg-[var(--border-soft)]" />}
                      <div className="flex flex-col">
                        <div className="font-medium text-[13px] text-[#d0d6e0]">{coin.symbol?.toUpperCase()}</div>
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
