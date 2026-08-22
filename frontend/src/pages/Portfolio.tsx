import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMarket } from "../hooks/useMarket";
import { useSparklines } from "../hooks/useSparklines";
import { Brain, Plus } from "lucide-react";

import AIRebalanceModal from "../components/portfolio/AIRebalanceModal";
import SwapInterface from "../components/portfolio/SwapInterface";
import DashboardCards from "../components/portfolio/DashboardCards";
import ChartAndWatchlist from "../components/portfolio/ChartAndWatchlist";
import AddSourceModal from "../components/portfolio/AddSourceModal";

import { usePortfolioData } from "../hooks/usePortfolioData";
import { apiClient } from '../api/client';
import { calcBuyingPower, calcAllocation, calcTax, parseCSV } from '../components/portfolio/PortfolioUtils';

type ChartPoint = { time: string; value: number };

/** Ranges offered above the chart. `hours` is what /analysis/history expects. */
const TIMEFRAMES: { id: string; label: string; hours: () => number }[] = [
  { id: "1D", label: "Last 24 hours", hours: () => 24 },
  { id: "1W", label: "Last 7 days", hours: () => 24 * 7 },
  { id: "1M", label: "Last 30 days", hours: () => 24 * 30 },
  { id: "6M", label: "Last 6 months", hours: () => 24 * 182 },
  {
    id: "YTD",
    label: "Year to date",
    hours: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return Math.max(24, Math.ceil((now.getTime() - start.getTime()) / 3_600_000));
    },
  },
  { id: "1Y", label: "Last 12 months", hours: () => 24 * 365 },
  { id: "All", label: "All time", hours: () => 24 * 365 * 5 },
];

export default function Portfolio() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: marketData } = useMarket(500);

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "swap" ? "swap" : "overview");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "swap") {
      setSearchParams({ tab: "swap" });
    } else {
      setSearchParams({});
    }
  };

  const {
    trades,
    setTrades,
    wallets,
    setWallets,
    isFetchingWallet,
    holdings,
  } = usePortfolioData(user, marketData || []);

  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Import feedback shouldn't sit on screen forever.
  useEffect(() => {
    if (!importMsg) return;
    const timer = setTimeout(() => setImportMsg(null), 8000);
    return () => clearTimeout(timer);
  }, [importMsg]);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const { trades: newTrades, count, skipped } = parseCSV(text);

      if (user) {
        const tradesToInsert = newTrades.map((t) => ({ ...t, user_id: user.id }));
        const { supabase } = await import("../lib/supabase");
        const { error } = await supabase.from("trades").insert(tradesToInsert);
        if (error) throw new Error(error.message);
        const { data } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .order("traded_at", { ascending: true });
        if (data) setTrades(data);
      } else {
        const updated = [...trades, ...newTrades];
        setTrades(updated);
        localStorage.setItem("crypto_neko_trades", JSON.stringify(updated));
      }

      setImportMsg({
        ok: true,
        text: `Imported ${count} transaction${count === 1 ? "" : "s"}${skipped > 0 ? ` (${skipped} row${skipped === 1 ? "" : "s"} skipped)` : ""}.`,
      });
    } catch (e: any) {
      setImportMsg({ ok: false, text: e?.message || "Could not read the file." });
    }
  };

  const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.cost_basis || 0), 0);
  const totalPnl = totalValue - totalCost;
  const change24hValue = holdings.reduce((sum, h) => sum + (((h.value || 0) * (h.change_24h || 0)) / 100), 0);
  const valueYesterday = totalValue - change24hValue;
  const change24hPct = valueYesterday > 0 ? (change24hValue / valueYesterday) * 100 : 0;

  const taxData = useMemo(() => calcTax(trades), [trades]);
  const allocation = useMemo(() => calcAllocation(holdings), [holdings]);
  const buyingPower = useMemo(() => calcBuyingPower(holdings), [holdings]);

  const sparklineSymbols = useMemo(
    () => holdings.slice(0, 10).map((h) => h.symbol),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [holdings.map((h) => h.symbol).join(",")]
  );
  const { data: sparklines } = useSparklines(sparklineSymbols);

  const [timeframe, setTimeframe] = useState("1D");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);

  const activeTimeframe = TIMEFRAMES.find((t) => t.id === timeframe) || TIMEFRAMES[0];

  // The holdings array is rebuilt on every market refresh (every few seconds),
  // so keying the fetch on it directly re-ran this constantly. Key on the
  // positions themselves, which only change when a balance actually moves.
  const positionsKey = useMemo(
    () => holdings.map((h) => `${h.symbol}:${h.quantity}`).sort().join("|"),
    [holdings]
  );
  const holdingsRef = useRef(holdings);
  holdingsRef.current = holdings;

  useEffect(() => {
    const positions = holdingsRef.current;
    if (positions.length === 0) {
      setChartData([]);
      return;
    }

    let cancelled = false;
    const hours = activeTimeframe.hours();

    const fetchHistory = async () => {
      setIsChartLoading(true);
      try {
        const uniqueSymbols = Array.from(new Set(positions.map((h) => h.symbol)));
        const qs = uniqueSymbols.map((s) => `symbols=${encodeURIComponent(s)}`).join("&");

        const res = await apiClient.get(`/analysis/history?${qs}&hours=${hours}`);
        if (cancelled) return;

        if (!Array.isArray(res.data)) {
          setChartData([]);
          return;
        }

        const groupedByTime: Record<string, Record<string, number>> = {};
        res.data.forEach((row: any) => {
          (groupedByTime[row.time] ||= {})[row.symbol] = row.current_price;
        });

        const sortedTimes = Object.keys(groupedByTime).sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );

        // Longer ranges need a date on the axis, not a clock time.
        const showDate = hours > 48;
        const lastKnownPrice: Record<string, number> = {};

        const aggregated: ChartPoint[] = sortedTimes.map((timeStr) => {
          const prices = groupedByTime[timeStr];
          let totalVal = 0;

          positions.forEach((h) => {
            const price = prices[h.symbol] ?? lastKnownPrice[h.symbol] ?? 0;
            if (price) lastKnownPrice[h.symbol] = price;
            totalVal += price * h.quantity;
          });

          const date = new Date(timeStr);
          return {
            time: showDate
              ? date.toLocaleDateString([], { month: "short", day: "numeric" })
              : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            value: totalVal,
          };
        });

        setChartData(aggregated);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch portfolio history:", err);
          setChartData([]);
        }
      } finally {
        if (!cancelled) setIsChartLoading(false);
      }
    };

    fetchHistory();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionsKey, timeframe]);

  return (
    <div className="min-h-screen bg-[#09090b] pt-24 pb-32 overflow-x-hidden selection:bg-[var(--accent)]/30 relative font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3 flex items-center gap-3">
              Portfolio
              {totalValue > 100000 && <span className="text-2xl">🐳</span>}
            </h1>
            <p className="text-white/40 text-[15px] font-medium max-w-xl">
              Track your crypto wealth across exchanges and wallets in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {importMsg && (
              <div className={`px-4 py-2 rounded-3xl text-[12px] font-bold animate-fade-in max-w-md ${importMsg.ok ? "bg-[var(--positive)]/10 text-[var(--positive)] border border-[var(--positive)]/20" : "bg-[var(--negative)]/10 text-[var(--negative)] border border-[var(--negative)]/20"}`}>
                {importMsg.text}
              </div>
            )}

            <button
              onClick={() => setIsRebalanceOpen(true)}
              className="flex items-center gap-2 bg-[#09090b]/40 hover:bg-white/[0.02] text-white border border-white/[0.04] hover:border-white/[0.08] font-bold py-2.5 px-5 rounded-3xl text-[13px] transition-all shadow-sm group"
            >
              <Brain size={16} className="group-hover:scale-110 transition-transform text-[var(--accent)]" />
              AI Rebalance
            </button>
            <button
              onClick={() => setShowAddSource(true)}
              className="flex items-center gap-2 bg-white hover:bg-white/90 text-black font-bold py-2.5 px-5 rounded-3xl text-[13px] transition-all shadow-sm hover:-translate-y-0.5"
            >
              <Plus size={16} strokeWidth={3} />
              Add Source
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-8 p-1 bg-[#09090b]/40 border border-white/[0.04] rounded-2xl w-fit backdrop-blur-xl">
          {["overview", "swap"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2.5 rounded-3xl text-[13px] font-bold capitalize transition-all duration-300 ${activeTab === tab ? "bg-white/[0.04] text-white shadow-sm border border-white/[0.04]" : "text-white/40 hover:text-white hover:bg-white/[0.02] border border-transparent"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "swap" && (
            <motion.div
              key="swap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <SwapInterface />
            </motion.div>
          )}

          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-white/[0.04]">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Overview</h2>
                  <p className="text-[13px] text-white/40">High level real-time data from your portfolio</p>
                </div>
                <div className="flex bg-[#09090b]/60 rounded-2xl p-1 border border-white/[0.04] mt-4 md:mt-0 backdrop-blur-xl">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setTimeframe(tf.id)}
                      title={tf.label}
                      className={`px-4 py-1.5 rounded-2xl text-[11px] font-bold transition-all ${tf.id === timeframe ? 'bg-white/[0.04] text-white shadow' : 'text-white/40 hover:text-white'}`}
                    >
                      {tf.id}
                    </button>
                  ))}
                </div>
              </div>

              <DashboardCards
                totalValue={totalValue}
                change24hValue={change24hValue}
                change24hPct={change24hPct}
                totalPnl={totalPnl}
                totalCost={totalCost}
                taxData={taxData}
                allocation={allocation}
                buyingPower={buyingPower}
                chartData={chartData}
                holdings={holdings}
              />

              <ChartAndWatchlist
                change24hPct={change24hPct}
                chartData={chartData}
                isChartLoading={isChartLoading}
                timeframeLabel={activeTimeframe.label}
                holdings={holdings}
                marketData={marketData || []}
                sparklines={sparklines || {}}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AddSourceModal
          isOpen={showAddSource}
          onClose={() => setShowAddSource(false)}
          user={user}
          trades={trades}
          setTrades={setTrades}
          wallets={wallets}
          setWallets={setWallets}
          isFetchingWallet={isFetchingWallet}
          handleFile={handleFile}
          setImportMsg={setImportMsg}
        />

        <AIRebalanceModal
          isOpen={isRebalanceOpen}
          onClose={() => setIsRebalanceOpen(false)}
          holdings={holdings}
          totalValue={totalValue}
          totalPnl={totalPnl}
          hasCostBasis={totalCost > 0 && Math.abs(totalPnl) > 0}
        />
      </div>
    </div>
  );
}
