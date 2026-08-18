import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMarket } from "../hooks/useMarket";
import { useSparklines } from "../hooks/useSparklines";
import { useTranslation } from "react-i18next";
import { Brain, Plus } from "lucide-react";

import AIRebalanceModal from "../components/portfolio/AIRebalanceModal";
import SwapInterface from "../components/portfolio/SwapInterface";
import DashboardCards from "../components/portfolio/DashboardCards";
import ChartAndWatchlist from "../components/portfolio/ChartAndWatchlist";
import AddSourceModal from "../components/portfolio/AddSourceModal";

import { usePortfolioData } from "../hooks/usePortfolioData";
import { calcBuyingPower, calcAllocation } from "../components/portfolio/PortfolioUtils";
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
    wallets,
    setWallets,
    isFetchingWallet,
    holdings,
  } = usePortfolioData(user, marketData || []);

  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);

  const portfolioPerformance = useMemo(() => {
    const total = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
    const previousTotal = holdings.reduce((sum, h) => {
      const pctChange = (h.change_24h || 0) / 100;
      const prevValue = h.value / (1 + pctChange);
      return sum + prevValue;
    }, 0);
    const change = total - previousTotal;
    const pct = previousTotal > 0 ? (change / previousTotal) * 100 : 0;
    return { value: total, change, pct };
  }, [holdings]);

  const totalValue = portfolioPerformance.value;
  const change24hValue = portfolioPerformance.change;
  const change24hPct = portfolioPerformance.pct;
  
  const allocation = useMemo(() => calcAllocation(holdings), [holdings]);
  const buyingPower = useMemo(() => calcBuyingPower(holdings), [holdings]);

  const sparklines = useSparklines(holdings.slice(0, 10).map((h) => h.symbol));

  const [chartData, setChartData] = useState<any[]>([]);
  const [marketNews, setMarketNews] = useState([
    {
      id: "1",
      title: "Bitcoin Surges Past Key Resistance Level",
      source: "CoinTelegraph",
      published_on: Math.floor(Date.now() / 1000) - 3600,
      imageurl: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=024",
      url: "#"
    },
    {
      id: "2",
      title: "Ethereum Spot ETFs See Record Inflows",
      source: "CoinDesk",
      published_on: Math.floor(Date.now() / 1000) - 7200,
      imageurl: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=024",
      url: "#"
    },
    {
      id: "3",
      title: "Regulatory Clarity Brings Institutional Investors",
      source: "Bloomberg Crypto",
      published_on: Math.floor(Date.now() / 1000) - 14400,
      imageurl: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=024",
      url: "#"
    }
  ]);
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
        const qs = uniqueSymbols.map((s) => `symbols=${s}`).join("&");
        
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
          const times = Object.keys(groupedByTime).sort();
          
          // Reconstruct portfolio value over time based on CURRENT holdings
          const portfolioHistory = times.map(time => {
            let value = 0;
            holdings.forEach(h => {
              const histPrice = groupedByTime[time][h.symbol];
              if (histPrice) {
                value += h.quantity * histPrice;
              } else {
                // fallback to current price if historical missing
                value += h.quantity * h.current_price;
              }
            });
            return {
              time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              value
            };
          });
          
          setChartData(portfolioHistory);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchHistory();
  }, [holdings.length, chartTimeframe]); // Re-run if holding count changes

  return (
    <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-main)] mb-3 tracking-tight">
              {t("portfolio.title", "Portfolio")}
            </h1>
            <p className="text-[var(--text-muted)] text-sm md:text-base font-medium max-w-xl leading-relaxed">
              Real-time balance tracking for your connected Web3 wallets. DeFi, NFTs, and Cross-chain support coming soon.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsRebalanceOpen(true)}
              className="group flex items-center gap-2 h-11 px-5 rounded-[12px] bg-[var(--bg-elevated)] border border-[var(--accent-muted)] text-[var(--accent)] font-bold text-[14px] transition-all hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)]"
            >
              <Brain size={16} />
              AI Rebalance
            </button>
            <button
              onClick={() => setShowAddSource(true)}
              className="flex items-center gap-2 h-11 px-5 rounded-[12px] bg-[var(--text-main)] text-[var(--bg-base)] font-bold text-[14px] transition-all hover:opacity-90 hover:scale-[1.02]"
            >
              <Plus size={18} />
              {t("portfolio.addSource", "Connect Wallet")}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
          {[
            { id: "overview", label: "Overview" },
            { id: "swap", label: "DeFi Swap" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--text-main)] text-[var(--bg-base)] shadow-md"
                  : "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-base)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DashboardCards
                totalValue={totalValue}
                change24hValue={change24hValue}
                change24hPct={change24hPct}
                allocation={allocation}
                buyingPower={buyingPower}
                setActiveTab={handleTabChange}
              />
              <ChartAndWatchlist
                change24hPct={change24hPct}
                chartData={chartData}
                holdings={holdings}
                marketNews={marketNews}
                sparklines={sparklines.data || {}}
              />
            </div>
          )}

          {activeTab === "swap" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SwapInterface />
            </div>
          )}
        </div>
      </div>

      <AIRebalanceModal isOpen={isRebalanceOpen} onClose={() => setIsRebalanceOpen(false)} holdings={holdings} />
      <AddSourceModal
        isOpen={showAddSource}
        onClose={() => setShowAddSource(false)}
        user={user}
        wallets={wallets}
        setWallets={setWallets}
        isFetchingWallet={isFetchingWallet}
      />
    </div>
  );
}
