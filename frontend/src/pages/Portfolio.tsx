import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useMarket } from "../hooks/useMarket";
import { useSparklines } from "../hooks/useSparklines";
import { Brain, Plus } from "lucide-react";

import AIRebalanceModal from "../components/portfolio/AIRebalanceModal";
import SwapInterface from "../components/portfolio/SwapInterface";
import DashboardCards from "../components/portfolio/DashboardCards";
import ChartAndWatchlist from "../components/portfolio/ChartAndWatchlist";
import AddSourceModal from "../components/portfolio/AddSourceModal";
import HoldingsTable from "../components/portfolio/HoldingsTable";
import TransactionHistory from "../components/portfolio/TransactionHistory";
import TaxReport from "../components/portfolio/TaxReport";

import { usePortfolioData } from "../hooks/usePortfolioData";
import { useHaptics } from "../hooks/useHaptics";
import { apiClient } from '../api/client';
import { calcBuyingPower, calcAllocation, calcTax, parseCSV } from '../components/portfolio/PortfolioUtils';

type ChartPoint = { time: string; value: number };

const TABS = ["overview", "holdings", "transactions", "tax", "swap"] as const;

type TabId = (typeof TABS)[number];

/** Ranges offered above the chart. `hours` is what /analysis/history expects. */
const TIMEFRAMES: { id: string; hours: () => number }[] = [
  { id: "1D", hours: () => 24 },
  { id: "1W", hours: () => 24 * 7 },
  { id: "1M", hours: () => 24 * 30 },
  { id: "6M", hours: () => 24 * 182 },
  {
    id: "YTD",
    hours: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return Math.max(24, Math.ceil((now.getTime() - start.getTime()) / 3_600_000));
    },
  },
  { id: "1Y", hours: () => 24 * 365 },
  { id: "All", hours: () => 24 * 365 * 5 },
];

export default function Portfolio() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: marketData } = useMarket(500);
  const haptics = useHaptics();

  const initialTab = (searchParams.get("tab") || "overview") as TabId;
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.includes(initialTab as any) ? initialTab : "overview"
  );

  const handleTabChange = (tab: TabId) => {
    haptics.impactLight();
    setActiveTab(tab);
    setSearchParams(tab === "overview" ? {} : { tab });
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
        text: skipped > 0
          ? t("portfolio.import.success_skipped", { count, skipped })
          : t("portfolio.import.success", { count }),
      });
    } catch (e: any) {
      setImportMsg({ ok: false, text: e?.message || t("portfolio.import.error") });
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
  // "snapshots" = what the portfolio was actually worth, recorded over time.
  // "reconstructed" = today's quantities priced at past prices, which is only
  // an approximation and must be labelled as one.
  const [chartSource, setChartSource] = useState<"snapshots" | "reconstructed">("reconstructed");

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

  // Record what the portfolio is worth right now so the chart can eventually
  // be drawn from real history instead of an approximation. The backend keeps
  // at most one row per hour, so posting on load is cheap.
  const snapshotPosted = useRef(false);
  useEffect(() => {
    if (!user || snapshotPosted.current) return;
    const positions = holdingsRef.current;
    if (positions.length === 0 || totalValue <= 0) return;

    snapshotPosted.current = true;
    apiClient
      .post("/portfolio/snapshot", {
        total_value: totalValue,
        holdings: positions.map((h) => ({
          symbol: h.symbol,
          quantity: h.quantity,
          value: h.value,
        })),
      })
      .catch(() => {
        // A missed snapshot costs one data point; never surface it.
        snapshotPosted.current = false;
      });
  }, [user, totalValue]);

  useEffect(() => {
    const positions = holdingsRef.current;
    if (positions.length === 0) {
      setChartData([]);
      return;
    }

    let cancelled = false;
    const hours = activeTimeframe.hours();

    const showDateAxis = hours > 48;
    const axisLabel = (iso: string) => {
      const d = new Date(iso);
      return showDateAxis
        ? d.toLocaleDateString(i18n.language, { month: "short", day: "numeric" })
        : d.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });
    };

    const fetchHistory = async () => {
      setIsChartLoading(true);
      try {
        // Real recorded history wins whenever there is enough of it.
        if (user) {
          try {
            const days = Math.max(1, Math.ceil(hours / 24));
            const snapRes = await apiClient.get(`/portfolio/snapshots?days=${days}`);
            const snaps = snapRes.data?.snapshots || [];
            if (!cancelled && snaps.length >= 2) {
              setChartData(
                snaps.map((s: any) => ({ time: axisLabel(s.time), value: Number(s.value) }))
              );
              setChartSource("snapshots");
              return;
            }
          } catch {
            // Fall through to the approximation below.
          }
        }
        if (cancelled) return;
        setChartSource("reconstructed");

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

        const lastKnownPrice: Record<string, number> = {};

        const aggregated: ChartPoint[] = sortedTimes.map((timeStr) => {
          const prices = groupedByTime[timeStr];
          let totalVal = 0;

          positions.forEach((h) => {
            const price = prices[h.symbol] ?? lastKnownPrice[h.symbol] ?? 0;
            if (price) lastKnownPrice[h.symbol] = price;
            totalVal += price * h.quantity;
          });

          return { time: axisLabel(timeStr), value: totalVal };
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
  }, [positionsKey, timeframe, user]);

  const tabCount: Partial<Record<TabId, number>> = {
    holdings: holdings.length,
    transactions: trades.length,
    tax: taxData.disposalCount,
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] pt-24 pb-32 overflow-x-hidden selection:bg-[var(--accent)]/30 relative font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/[0.04] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-main)] tracking-tight mb-3 flex items-center gap-3">
              {t("portfolio.title")}
              {totalValue > 100000 && <span className="text-2xl">🐳</span>}
            </h1>
            <p className="text-[var(--text-muted)] text-[15px] font-medium max-w-xl">
              {t("portfolio.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {importMsg && (
              <div className={`px-4 py-2 rounded-3xl text-[12px] font-bold animate-fade-in max-w-md ${importMsg.ok ? "bg-[var(--positive-muted)] text-[var(--positive)] border border-[var(--positive)]/20" : "bg-[var(--negative-muted)] text-[var(--negative)] border border-[var(--negative)]/20"}`}>
                {importMsg.text}
              </div>
            )}

            <button
              onClick={() => setIsRebalanceOpen(true)}
              className="flex items-center gap-2 bg-[var(--bg-subtle)] hover:bg-[var(--bg-overlay)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-[var(--border-base)] font-bold py-2.5 px-5 rounded-3xl text-[13px] transition-all shadow-sm group"
            >
              <Brain size={16} className="group-hover:scale-110 transition-transform text-[var(--accent)]" />
              {t("portfolio.ai_button")}
            </button>
            <button
              onClick={() => setShowAddSource(true)}
              className="flex items-center gap-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-base)] font-bold py-2.5 px-5 rounded-3xl text-[13px] transition-all shadow-sm hover:-translate-y-0.5"
            >
              <Plus size={16} strokeWidth={3} />
              {t("portfolio.add_source")}
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar gap-1 mb-8 p-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-2xl w-fit backdrop-blur-xl">
          {TABS.map((tab) => {
            const count = tabCount[tab];
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-3xl text-[13px] font-bold whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-[var(--bg-overlay)] text-[var(--text-main)] shadow-sm border border-[var(--border-subtle)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-overlay)]/50 border border-transparent"
                }`}
              >
                {t(`portfolio.tabs.${tab}`)}
                {count !== undefined && count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                    activeTab === tab ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "bg-[var(--bg-base)] text-[var(--text-faint)]"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "swap" && (
            <motion.div key="swap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <SwapInterface />
            </motion.div>
          )}

          {activeTab === "holdings" && (
            <motion.div key="holdings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <HoldingsTable holdings={holdings} totalValue={totalValue} />
            </motion.div>
          )}

          {activeTab === "transactions" && (
            <motion.div key="transactions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <TransactionHistory trades={trades} setTrades={setTrades} user={user} />
            </motion.div>
          )}

          {activeTab === "tax" && (
            <motion.div key="tax" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <TaxReport taxData={taxData} />
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
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-main)] mb-1">{t("portfolio.overview.title")}</h2>
                  <p className="text-[13px] text-[var(--text-muted)]">{t("portfolio.overview.subtitle")}</p>
                </div>
                <div className="flex bg-[var(--bg-subtle)] rounded-2xl p-1 border border-[var(--border-subtle)] mt-4 md:mt-0 backdrop-blur-xl">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setTimeframe(tf.id)}
                      title={t(`portfolio.timeframes.${tf.id}`)}
                      className={`px-4 py-1.5 rounded-2xl text-[11px] font-bold transition-all ${tf.id === timeframe ? 'bg-[var(--bg-overlay)] text-[var(--text-main)] shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
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
                timeframeLabel={t(`portfolio.timeframes.${activeTimeframe.id}`)}
                chartSource={chartSource}
                holdings={holdings}
                marketData={marketData || []}
                sparklines={sparklines || {}}
              />

              <HoldingsTable holdings={holdings} totalValue={totalValue} />
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
          taxData={taxData}
        />
      </div>
    </div>
  );
}
