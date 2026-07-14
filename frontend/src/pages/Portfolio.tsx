import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMarket } from "../hooks/useMarket";
import { useSparklines } from "../hooks/useSparklines";
import { useTranslation } from "react-i18next";
import {
  Brain,
  Plus,
} from "lucide-react";

import AIRebalanceModal from "../components/portfolio/AIRebalanceModal";
import SwapInterface from "../components/portfolio/SwapInterface";
import DashboardCards from "../components/portfolio/DashboardCards";
import ChartAndWatchlist from "../components/portfolio/ChartAndWatchlist";
import AddSourceModal from "../components/portfolio/AddSourceModal";
import HistoryTab from "../components/portfolio/HistoryTab";
import AnalyticsTab from "../components/portfolio/AnalyticsTab";
import TaxesTab from "../components/portfolio/TaxesTab";

import { usePortfolioData } from "../hooks/usePortfolioData";
import {
  calcTax,
  GuideModal,
  calcBuyingPower,
  calcAllocation,
  parseCSV,
} from "../components/portfolio/PortfolioUtils";
import { apiClient } from "../api/client";

export default function Portfolio() {
  const { t } = useTranslation();
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
  const [showGuide, setShowGuide] = useState(false);
  const [importMsg, setImportMsg] = useState<any>(null);

  // Parse CSV function
  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const { trades: newTrades, count } = parseCSV(text);
      if (user) {
        const tradesToInsert = newTrades.map((t: any) => ({ ...t, user_id: user.id }));
        const { supabase } = await import("../lib/supabase");
        await supabase.from("trades").insert(tradesToInsert);
        const { data } = await supabase.from("trades").select("*").eq("user_id", user.id).order("traded_at", { ascending: true });
        if (data) setTrades(data);
      } else {
        const updated = [...trades, ...newTrades];
        setTrades(updated);
        localStorage.setItem("crypto_neko_trades", JSON.stringify(updated));
      }
      setImportMsg({ ok: true, text: `Imported ${count} transactions successfully.` });
    } catch (e: any) {
      setImportMsg({ ok: false, text: e.message || "File error" });
    }
  };

  const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.cost_basis || 0), 0);
  const totalPnl = totalValue - totalCost;
  
  const taxData = useMemo(() => calcTax(trades), [trades]);
  const allocation = useMemo(() => calcAllocation(holdings), [holdings]);
  const buyingPower = useMemo(() => calcBuyingPower(holdings), [holdings]);

  const sparklines = useSparklines(holdings.slice(0, 10).map((h) => h.symbol));

  const [chartData, setChartData] = useState([]);
  const [marketNews, setMarketNews] = useState([]);
  const [chartTimeframe, setChartTimeframe] = useState('24h');

  // Fetch historical portfolio balance
  useEffect(() => {
    if (holdings.length === 0) {
      setChartData([]);
      return;
    }
    
    const fetchHistory = async () => {
      try {
        const uniqueSymbols = Array.from(new Set(holdings.map(h => h.symbol)));
        if (uniqueSymbols.length === 0) return;
        const qs = uniqueSymbols.map(s => `symbols=${s}`).join('&');
        
        // 24 hours historical data
        const res = await apiClient.get(`/analysis/history?${qs}&hours=24`);
        if (res.data && Array.isArray(res.data)) {
          // Group by time
          const groupedByTime: Record<string, any> = {};
          res.data.forEach((row: any) => {
            if (!groupedByTime[row.time]) {
              groupedByTime[row.time] = {};
            }
            groupedByTime[row.time][row.symbol] = row.current_price;
          });

          // Sort times chronologically
          const sortedTimes = Object.keys(groupedByTime).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
          
          const lastKnownPrice: Record<string, number> = {};
          
          const aggregated = sortedTimes.map(timeStr => {
            const prices = groupedByTime[timeStr];
            let totalVal = 0;
            
            holdings.forEach(h => {
              const price = prices[h.symbol] || lastKnownPrice[h.symbol] || 0;
              if (price) {
                lastKnownPrice[h.symbol] = price;
              }
              totalVal += price * h.quantity;
            });
            
            const date = new Date(timeStr);
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return {
              time: formattedTime,
              fullDate: timeStr,
              value: totalVal
            };
          });

          setChartData(aggregated as any);
        }
      } catch (err) {
        console.error("Failed to fetch history for chart:", err);
      }
    };

    fetchHistory();
  }, [holdings]);

  return (
    <div className="min-h-screen bg-[#0a0b0d] pt-24 pb-32 overflow-x-hidden selection:bg-[#14F195]/30 relative font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#14F195]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3 flex items-center gap-3">
              Portfolio
              {totalValue > 100000 && <span className="text-2xl">🐳</span>}
            </h1>
            <p className="text-gray-400 text-[15px] font-medium max-w-xl">
              Track your crypto wealth across exchanges and wallets in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {importMsg && (
              <div className={`px-4 py-2 rounded-xl text-[12px] font-bold animate-fade-in ${importMsg.ok ? "bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {importMsg.text}
              </div>
            )}
            
            <button
              onClick={() => setIsRebalanceOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-purple-800/20 hover:from-purple-600/40 hover:to-purple-800/40 text-purple-400 border border-purple-500/30 font-bold py-2.5 px-5 rounded-xl text-[13px] transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] group"
            >
              <Brain size={16} className="group-hover:scale-110 transition-transform" />
              AI Rebalance
            </button>
            <button
              onClick={() => setShowAddSource(true)}
              className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[#11d885] text-[#0a0b0d] font-black py-2.5 px-5 rounded-xl text-[13px] transition-all shadow-[0_0_20px_rgba(20,241,149,0.2)] hover:shadow-[0_0_30px_rgba(20,241,149,0.4)] hover:-translate-y-0.5"
            >
              <Plus size={16} strokeWidth={3} />
              Add Source
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-8 p-1 bg-[#121212]/50 border border-white/5 rounded-2xl w-fit backdrop-blur-md">
          {["overview", "swap", "history", "analytics", "taxes"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-2.5 rounded-xl text-[13px] font-bold capitalize transition-all duration-300 ${activeTab === tab ? "bg-white/10 text-white shadow-lg border border-white/5" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
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
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Overview</h2>
                  <p className="text-[13px] text-gray-400">High level real-time data from your portfolio</p>
                </div>
                <div className="flex bg-[#1a1d21] rounded-lg p-1 border border-white/5 mt-4 md:mt-0">
                  {['1D', '1W', '1M', '6M', 'YTD', '1Y', 'All'].map(t => (
                    <button key={t} className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${t === 'All' ? 'bg-[#2a2d31] text-white shadow' : 'text-gray-500 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <DashboardCards 
                totalValue={totalValue}
                totalPnl={totalPnl}
                totalCost={totalCost}
                taxData={taxData}
                allocation={allocation}
                buyingPower={buyingPower}
                setActiveTab={setActiveTab}
              />

              <ChartAndWatchlist 
                totalPnl={totalPnl}
                totalCost={totalCost}
                chartData={chartData}
                holdings={holdings}
                sparklines={sparklines}
                marketNews={marketNews}
              />
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HistoryTab trades={trades} />
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AnalyticsTab holdings={holdings} />
            </motion.div>
          )}

          {activeTab === "taxes" && (
            <motion.div
              key="taxes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TaxesTab taxData={taxData} />
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

        <GuideModal 
          isOpen={showGuide} 
          onClose={() => setShowGuide(false)}
        />
        
        <AIRebalanceModal 
          isOpen={isRebalanceOpen} 
          onClose={() => setIsRebalanceOpen(false)} 
          holdings={holdings} 
        />
      </div>
    </div>
  );
}
