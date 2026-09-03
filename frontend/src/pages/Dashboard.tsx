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
import { useMarketStream } from "../hooks/useMarketStream";
import { useFearAndGreed } from "../hooks/useFearAndGreed";
import { useGlobalHistory } from "../hooks/useGlobalHistory";
import { useSparklines } from "../hooks/useSparklines";
import PriceCell from "../components/ui/PriceCell";
import {
  TrendingUp, TrendingDown, Brain, Flame, Search,
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight, LayoutDashboard
} from "lucide-react";

import { FearGreedModal } from "../components/dashboard/FearGreedModal";
import { GlobalStatsModal } from "../components/dashboard/GlobalStatsModal";
import { WhaleFeed } from "../components/dashboard/WhaleFeed";
import { BaseGlassCard } from "../components/ui/EthenaDesign";
import { OfferCarousel, type Offer } from "../components/ui/offer-carousel";
import CryptoDashboard from "../components/ui/crypto-dashboard";

const AI_ALPHA_SIGNALS: Offer[] = [
  {
    id: 1,
    imageSrc: "https://images.unsplash.com/photo-1621504450181-5d356f61d307?q=80&w=1974&auto=format&fit=crop",
    imageAlt: "Bitcoin Abstract",
    tag: "Strong Buy",
    tagColor: "var(--positive)",
    title: "BTC Breakout Impending",
    description: "On-chain metrics show massive whale accumulation in the last 48 hours. Expecting a +12% move.",
    brandLogoSrc: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    brandName: "Bitcoin",
    promoCode: "Trade BTC",
    href: "/coin/bitcoin",
  },
  {
    id: 2,
    imageSrc: "https://images.unsplash.com/photo-1622630998477-20b41cd5e114?q=80&w=2074&auto=format&fit=crop",
    imageAlt: "Solana Network",
    tag: "Momentum",
    tagColor: "var(--accent)",
    title: "SOL Network Activity Spike",
    description: "DEX volumes on Solana are up 300%. AI predicts short-term volatility. Good for scalp trading.",
    brandLogoSrc: "https://cryptologos.cc/logos/solana-sol-logo.png",
    brandName: "Solana",
    promoCode: "Trade SOL",
    href: "/coin/solana",
  },
  {
    id: 3,
    imageSrc: "https://images.unsplash.com/photo-1639762681485-074b7f4ec672?q=80&w=2070&auto=format&fit=crop",
    imageAlt: "Ethereum Merge",
    tag: "Whale Alert",
    tagColor: "var(--warning, #f59e0b)",
    title: "ETH Smart Money Exit",
    description: "Three major wallets just moved 50k ETH to Binance. Short-term downside expected.",
    brandLogoSrc: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    brandName: "Ethereum",
    promoCode: "Hedge ETH",
    href: "/coin/ethereum",
  },
  {
    id: 4,
    imageSrc: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=2070&auto=format&fit=crop",
    imageAlt: "Chainlink",
    tag: "Accumulation",
    tagColor: "var(--positive)",
    title: "LINK Accumulation Zone",
    description: "Retail is selling but institutional wallets are adding. Classic Wyckoff accumulation pattern.",
    brandLogoSrc: "https://cryptologos.cc/logos/chainlink-link-logo.png",
    brandName: "Chainlink",
    promoCode: "Swap LINK",
    href: "/coin/chainlink",
  },
  {
    id: 5,
    imageSrc: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=1969&auto=format&fit=crop",
    imageAlt: "Arbitrum",
    tag: "Airdrop Alpha",
    tagColor: "#a855f7",
    title: "Arbitrum Ecosystem",
    description: "TVL is skyrocketing. AI detects capital rotation into ARB ecosystem tokens.",
    brandLogoSrc: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
    brandName: "Arbitrum",
    promoCode: "Explore ARB",
    href: "/coin/arbitrum",
  }
];

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
    <span className={`inline-flex items-center gap-0.5 text-[13px] font-semibold font-mono ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
      {isUp ? <ArrowUpRight size={14} strokeWidth={2.5} /> : <ArrowDownRight size={14} strokeWidth={2.5} />}
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
      className={`flex items-center gap-1 text-[10px] font-semibold tracking-[0.18em] uppercase ${align === "right" ? "ml-auto" : ""} ${active ? "text-white" : "text-white/30 hover:text-white/60"} transition-colors`}
    >
      {label}
      {active && (
        <span className="text-white opacity-70">
          {direction === "asc" ? <ChevronUp size={12} strokeWidth={3} /> : <ChevronDown size={12} strokeWidth={3} />}
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

  const { data: coins, isLoading: coinsLoading } = useMarket();
  // SSE stream — her 3 saniyede Redis'ten cache'i günceller (WUL-46)
  useMarketStream();

  const { data: gainersData, isLoading: gainersLoading } = useGainers();
  const { data: losersData, isLoading: losersLoading } = useLosers();
  const { data: trendingData, isLoading: trendingLoading } = useTrending();
  const { data: statsData } = useMarketStats();
  
  const isAnyLoading = coinsLoading || gainersLoading || losersLoading || trendingLoading;
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

        {/* AI ALPHA SIGNALS CAROUSEL */}
        <div className="w-full max-w-[1360px] mx-auto mt-12 px-4 relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight text-white">AI Alpha Signals</h2>
          </div>
          <OfferCarousel offers={AI_ALPHA_SIGNALS} />
        </div>

        {/* METRIC STRIP */}
        <div className="w-full max-w-[1360px] mx-auto mt-12 relative z-10 border border-white/[0.06] rounded-[20px] bg-[#09090b]/60 backdrop-blur-xl mb-10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col lg:flex-row items-stretch divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
            
            {/* Market Cap */}
            <div onClick={() => setStatsModalType("mcap")} className="flex-1 p-6 md:p-8 flex flex-col justify-center cursor-pointer hover:bg-white/[0.02] transition-colors group">
              <div className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium mb-3 flex items-center gap-2 group-hover:text-white/60 transition-colors">
                 Global Market Cap
              </div>
              <div className="text-[28px] md:text-[32px] font-semibold text-white tracking-tight tabular-nums mb-1">
                <NumberFlow value={mcapFlow.val} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }} suffix={mcapFlow.suffix} />
              </div>
              <div className="text-[12px] text-white/30">{(coins || []).length > 0 ? `${(coins || []).length}+ assets tracked` : "Loading..."}</div>
            </div>

            {/* Volume */}
            <div onClick={() => setStatsModalType("volume")} className="flex-1 p-6 md:p-8 flex flex-col justify-center cursor-pointer hover:bg-white/[0.02] transition-colors group">
              <div className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium mb-3 flex items-center gap-2 group-hover:text-white/60 transition-colors">
                24h Volume
              </div>
              <div className="text-[28px] md:text-[32px] font-semibold text-white tracking-tight tabular-nums mb-1">
                <NumberFlow value={volFlow.val} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 2 }} suffix={volFlow.suffix} />
              </div>
              <div className="text-[12px] text-white/30">Global network activity</div>
            </div>

            {/* Dominance */}
            <div onClick={() => setStatsModalType("dominance")} className="flex-1 p-6 md:p-8 flex flex-col justify-center cursor-pointer hover:bg-white/[0.02] transition-colors group">
              <div className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium mb-3 flex items-center gap-2 group-hover:text-white/60 transition-colors">
                Dominance
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-[28px] md:text-[32px] font-semibold text-white tracking-tight tabular-nums">{btcDom}%</div>
                <div className="text-[14px] font-medium text-[var(--accent)] mb-1">BTC</div>
              </div>
              <div className="text-[12px] text-white/30">ETH: <span className="text-white/60">{ethDom}%</span></div>
            </div>

            {/* Fear & Greed */}
            <div onClick={() => setIsFngModalOpen(true)} className="flex-1 p-6 md:p-8 flex flex-col justify-center cursor-pointer hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium flex items-center gap-2 group-hover:text-white/60 transition-colors">
                  Fear & Greed
                </div>
                <div className="text-[10px] bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-md font-medium text-white/40 group-hover:text-white/80 transition-colors">VIEW</div>
              </div>
              {fngValue !== null ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `conic-gradient(${fngColor} 0% ${fngValue}%, rgba(255,255,255,0.05) ${fngValue}% 100%)` }}>
                    <div className="absolute inset-[3px] rounded-full bg-[#09090b] flex items-center justify-center">
                      <span className="text-[15px] font-medium text-white">{fngValue}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[16px] font-medium" style={{ color: fngColor }}>{fngLabel}</div>
                  </div>
                </div>
              ) : (
                <div className="text-[28px] md:text-[32px] font-semibold text-white/20">—</div>
              )}
            </div>

          </div>
        </div>

        {/* INTEGRATED CRYPTO DASHBOARD */}
        <div className="w-full max-w-[1360px] mx-auto mt-4 mb-8">
          <CryptoDashboard />
        </div>

        {/* MAIN STACKED LAYOUT */}
        <div className="flex flex-col gap-6">
          
          {/* TOP: TABLE (Full width) */}
          <div className="w-full">
            <FadeIn delay={0.6} className="h-full">
              <BaseGlassCard className="flex flex-col h-full">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-white/[0.04] gap-4">
                  <div className="relative w-full max-w-[280px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." className="w-full bg-white/[0.02] border border-white/[0.06] rounded-[10px] py-2 pl-10 pr-4 text-[13px] font-medium text-white placeholder-white/20 focus:outline-none focus:border-white/[0.12] transition-all" />
                  </div>
                  <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-[10px] border border-white/[0.06]">
                    {([ { key: "all", label: "All" }, { key: "gainers", label: "Gainers" }, { key: "losers", label: "Losers" }, { key: "trending", label: "Trending" } ] as const).map(tab => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${activeTab === tab.key ? "bg-white/[0.06] text-white shadow-sm border border-white/[0.08]" : "text-white/40 hover:text-white hover:bg-white/[0.01] border border-transparent"}`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table wrapper for scroll */}
                <div className="overflow-x-auto flex-1">
                  <div className="min-w-max w-full">
                    {/* Header */}
                    <div className="grid grid-cols-[50px_2fr_130px_110px_140px_130px_100px] gap-4 px-6 py-4 border-b border-white/[0.04] bg-transparent">
                      <TH label="#" active={sortKey === "rank"} direction={sortDir} onClick={() => toggleSort("rank")} />
                      <TH label="Asset" active={sortKey === "rank"} direction={sortDir} onClick={() => toggleSort("rank")} />
                      <TH label="Price" align="right" active={sortKey === "price"} direction={sortDir} onClick={() => toggleSort("price")} />
                      <TH label="24h %" align="right" active={sortKey === "change"} direction={sortDir} onClick={() => toggleSort("change")} />
                      <TH label="Volume" align="right" active={sortKey === "volume"} direction={sortDir} onClick={() => toggleSort("volume")} />
                      <TH label="Market Cap" align="right" active={sortKey === "mcap"} direction={sortDir} onClick={() => toggleSort("mcap")} />
                      <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/30 text-right pr-2">7d Trend</div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-col pb-4">
                      {isAnyLoading ? (
                        <div className="p-16 flex flex-col items-center justify-center gap-4 text-white/30 font-medium text-[13px]">
                          <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading market data...</span>
                        </div>
                      ) : filtered.length === 0 ? (
                        <div className="p-16 text-center text-white/30 font-medium text-[13px]">No assets found.</div>
                      ) : (
                        filtered.slice(0, 15).map((coin: any, i: number) => {
                          const change = Number(coin.price_change_percentage_24h) || 0;
                          const isUp = change >= 0;
                          return (
                            <motion.div
                              layout
                              key={coin.symbol}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                              onClick={() => coin.slug && navigate(`/coin/${coin.slug}`)}
                              className="grid grid-cols-[50px_2fr_130px_110px_140px_130px_100px] gap-4 px-6 py-4 border-b border-white/[0.04] last:border-0 items-center cursor-pointer hover:bg-white/[0.015] transition-colors group"
                            >
                              <div className="text-white/30 font-medium text-[13px] font-mono">{coin.market_cap_rank || i + 1}</div>
                              <div className="flex items-center gap-3">
                                {coin.image_url ? <img src={coin.image_url} alt={coin.symbol} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold bg-white/[0.04] text-white/40">{coin.symbol?.[0]}</div>}
                                <div>
                                  <div className="font-semibold text-white text-[14px]">{coin.name}</div>
                                  <div className="text-[11px] text-white/40 font-mono tracking-wider">{coin.symbol?.toUpperCase()}</div>
                                </div>
                              </div>
                              <div className="text-right text-white font-medium text-[14px] font-mono tabular-nums"><PriceCell price={coin.current_price} /></div>
                              <div className="text-right flex justify-end"><ChangeBadge value={change} /></div>
                              <div className="text-right font-medium text-white/60 text-[13px] font-mono">{fmt(coin.total_volume)}</div>
                              <div className="text-right font-medium text-white/60 text-[13px] font-mono">{fmt(coin.market_cap)}</div>
                              <div className="pr-2"><MiniSparkline data={sparklineData?.[coin.symbol?.toUpperCase()]} up={isUp} /></div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </BaseGlassCard>
            </FadeIn>
          </div>

          {/* RIGHT: SIDEBAR (4 cols) */}
          <div className="xl:col-span-4 flex flex-col gap-6">

            <FadeIn delay={0.8} className="w-full flex-1">
              <BaseGlassCard className="p-0 h-full min-h-[600px]">
                 <WhaleFeed />
              </BaseGlassCard>
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
