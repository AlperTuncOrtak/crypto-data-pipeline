// ============================================================
// pages/Portfolio.jsx
// ============================================================
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getCoinColor } from "../utils/colors";
import { supabase } from "../lib/supabase";
import { useMarket } from "../hooks/useMarket";
import { apiClient } from "../api/client";
import { useTranslation } from "react-i18next";
import AIRebalanceModal from "../components/portfolio/AIRebalanceModal";
import SwapInterface from "../components/portfolio/SwapInterface";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { TOKENS, ERC20_ABI } from "../constants/web3";
import { formatUnits } from "viem";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Upload,
  Brain,
  FileDown,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  X,
  RefreshCw,
  Wallet,
  BarChart2,
  Info,
  Lock,
} from "lucide-react";


import {
  fmtUSD, fmtPct, fmtNum, COIN_COLORS, CHART_COLORS, EXCHANGE_GUIDES,
  parseCSV, calcHoldings, calcTax, exportTaxCSV, GuideModal, GlassCard, SoftCard
} from "../components/portfolio/PortfolioUtils";

// ─────────────────────────────────────────────────────────────────
// MAIN PORTFOLIO PAGE
// ─────────────────────────────────────────────────────────────────

export default function Portfolio() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: marketData } = useMarket(500);
  const fileRef = useRef(null);

  // Default tab handling via URL parameters
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "swap" ? "swap" : "overview");
  
  // Update URL when tab changes without full reload
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "swap") {
      setSearchParams({ tab: "swap" });
    } else {
      setSearchParams({});
    }
  };


  
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [trades, setTrades] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crypto_neko_trades") || "[]"); }
    catch { return []; }
  });
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [connectingExchange, setConnectingExchange] = useState(null);
  const [oauthStep, setOauthStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [apiPassphrase, setApiPassphrase] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallets, setWallets] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crypto_neko_wallets") || "[]"); }
    catch { return []; }
  });
    const [walletHoldings, setWalletHoldings] = useState([]);
    const [web3Holdings, setWeb3Holdings] = useState([]);

    // --- LIVE WALLET BALANCES (WAGMI) ---
    const { address, isConnected } = useAccount();
    const { data: ethBalance } = useBalance({ address });
    
    const erc20Tokens = useMemo(() => TOKENS.filter(t => t.symbol !== "ETH"), []);
    const erc20Contracts = useMemo(() => erc20Tokens.map(token => ({
      address: token.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    })), [erc20Tokens, address]);

    const { data: tokenBalances } = useReadContracts({
      contracts: erc20Contracts,
      query: { enabled: isConnected && !!address }
    });

    useEffect(() => {
      if (!isConnected || !address) {
        setWeb3Holdings([]);
        return;
      }

      const newHoldings = [];

      // Add ETH
      if (ethBalance) {
        let amount = Number(ethBalance.formatted);
        if (amount === 0) { // DEMO MODE: Fill with fake assets if wallet is empty
          newHoldings.push({
            source: "Wallet",
            symbol: "ETH",
            quantity: 4.25,
            cost_basis: 4.25 * (marketData?.find(m => m.symbol === "ETH")?.current_price || 3000),
          });
          newHoldings.push({
            source: "Wallet",
            symbol: "USDC",
            quantity: 12500,
            cost_basis: 12500,
          });
        } else if (amount > 0) {
          newHoldings.push({
            source: "Wallet",
            symbol: "ETH",
            quantity: amount,
            cost_basis: amount * (marketData?.find(m => m.symbol === "ETH")?.current_price || TOKENS[0].price),
          });
        }
      }

      // Add ERC20s
      if (tokenBalances) {
        tokenBalances.forEach((result, index) => {
          if (result.status === 'success') {
            const token = erc20Tokens[index];
            const amount = Number(formatUnits(result.result as bigint, token.decimals));
            if (amount > 0 && Number(ethBalance?.formatted) !== 0) {
              newHoldings.push({
                source: "Wallet",
                symbol: token.symbol,
                quantity: amount,
                cost_basis: amount * (marketData?.find(m => m.symbol === token.symbol)?.current_price || token.price),
              });
            }
          }
        });
      }

      setWeb3Holdings(newHoldings);
    }, [isConnected, address, ethBalance, tokenBalances, marketData, erc20Tokens]);
    // ------------------------------------
  const [isFetchingWallet, setIsFetchingWallet] = useState(false);
  const [walletInput, setWalletInput] = useState("");
  const [binanceKeys, setBinanceKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crypto_neko_binance_keys") || '{"key":"","secret":""}'); }
    catch { return { key: "", secret: "" }; }
  });
  const [isSyncingBinance, setIsSyncingBinance] = useState(false);
  const [binanceHoldings, setBinanceHoldings] = useState([]);


  const [showAddSource, setShowAddSource] = useState(false);
  const [guide, setGuide] = useState(null);

  const [aiInsights, setAiInsights] = useState(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiError, setAiError] = useState(null);

  const syncBinance = useCallback(async (key, secret) => {
    if (!key || !secret) return;
    setIsSyncingBinance(true);
    try {
      const resp = await apiClient.post("/portfolio/binance-sync", { api_key: key, api_secret: secret });
      if (resp.data.ok && resp.data.balances) {
        setBinanceHoldings(resp.data.balances.map(b => ({ symbol: b.symbol, quantity: b.quantity, source: "binance" })));
        setBinanceKeys({ key, secret });
        localStorage.setItem("crypto_neko_binance_keys", JSON.stringify({ key, secret }));
      }
    } catch (e) { console.error(e); }
    finally { setIsSyncingBinance(false); }
  }, []);

  useEffect(() => {
    if (binanceKeys.key && binanceKeys.secret) syncBinance(binanceKeys.key, binanceKeys.secret);
  }, []);

  useEffect(() => {
    localStorage.setItem("crypto_neko_wallets", JSON.stringify(wallets));
    if (wallets.length === 0) { setWalletHoldings([]); return; }
    const go = async () => {
      setIsFetchingWallet(true);
      let all = [];
      for (const w of wallets) {
        try {
          const res = await fetch("https://api.ethplorer.io/getAddressInfo/" + w + "?apiKey=freekey");
          const data = await res.json();
          if (data.ETH?.balance > 0) all.push({ symbol: "ETH", quantity: data.ETH.balance });
          for (const t of data.tokens || []) {
            if (!t.tokenInfo?.symbol) continue;
            const bal = t.balance / Math.pow(10, parseInt(t.tokenInfo.decimals) || 18);
            if (bal > 0) all.push({ symbol: t.tokenInfo.symbol, quantity: bal });
          }
        } catch {}
      }
      setWalletHoldings(all);
      setIsFetchingWallet(false);
    };
    go();
  }, [wallets]);

  useEffect(() => {
    if (!user) return;
    supabase.from("trades").select("*").eq("user_id", user.id)
      .order("traded_at", { ascending: true })
      .then(({ data }) => { if (data?.length > 0) setTrades(data); });
  }, [user]);

  // --- Portfolio Performance Chart Logic ---
  const [chartRange, setChartRange] = useState(24);
  const [chartData, setChartData] = useState([]);
  const [isChartLoading, setIsChartLoading] = useState(false);

  const holdings = useMemo(
    () => calcHoldings(trades, marketData, [...walletHoldings, ...web3Holdings, ...binanceHoldings]),
    [trades, marketData, walletHoldings, web3Holdings, binanceHoldings]
  );
  
  const taxData = useMemo(() => calcTax(trades), [trades]);
  const totalValue = useMemo(() => holdings.reduce((s, h) => s + h.value, 0), [holdings]);
  const totalCost  = useMemo(() => holdings.reduce((s, h) => s + h.cost_basis, 0), [holdings]);
  const totalPnl   = useMemo(() => totalValue - totalCost, [totalValue, totalCost]);

  useEffect(() => {
    if (holdings.length === 0) {
      setChartData([]);
      return;
    }

    const fetchHistory = async () => {
      setIsChartLoading(true);
      try {
        const uniqueSymbols = [...new Set(holdings.map(h => h.symbol))];
        const searchParams = new URLSearchParams();
        uniqueSymbols.forEach(sym => searchParams.append("symbols", sym));
        searchParams.append("hours", chartRange.toString());

        const res = await apiClient.get(`/analysis/history?${searchParams.toString()}`);
        const historyData = res.data;

        const masterSymbol = uniqueSymbols.find(sym => historyData[sym] && historyData[sym].length > 0);
        if (!masterSymbol) {
          setChartData([]);
          return;
        }

        const masterTimeline = historyData[masterSymbol];
        
        const newChartData = masterTimeline.map((point, idx) => {
          let totalValAtT = 0;
          uniqueSymbols.forEach(sym => {
            const h = holdings.find(x => x.symbol === sym);
            const amt = h ? h.amount : 0;
            const symHistory = historyData[sym];
            let price = h ? h.current_price : 0;
            if (symHistory && symHistory[idx]) {
              price = symHistory[idx].price;
            }
            totalValAtT += amt * price;
          });
          
          return {
            time: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullTime: point.time,
            value: totalValAtT
          };
        });

        // Live injection for the final point
        const totalValueNow = holdings.reduce((s, h) => s + h.value, 0);
        if (newChartData.length > 0 && Math.abs(newChartData[newChartData.length - 1].value - totalValueNow) > 0.1) {
          newChartData.push({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullTime: new Date().toISOString(),
            value: totalValueNow
          });
        }

        setChartData(newChartData);
      } catch (err) {
        console.error("Failed to fetch chart history", err);
      } finally {
        setIsChartLoading(false);
      }
    };
    fetchHistory();
  }, [holdings, chartRange]);

  useEffect(() => {
    try { localStorage.setItem("crypto_neko_trades", JSON.stringify(trades)); } catch {}
  }, [trades]);



  const handleGetAIInsights = async () => {
    if (holdings.length === 0) return;
    setIsAnalyzingAI(true);
    setAiError(null);
    try {
      const payload = {
        holdings: holdings.map(h => ({
          symbol: h.symbol,
          value: h.value,
          pnl_pct: h.cost_basis > 0 ? (h.pnl / h.cost_basis) * 100 : 0,
          quantity: h.amount,
          avg_cost: h.avg_buy_price
        })),
        total_value: totalValue,
        total_pnl: totalPnl
      };
      const res = await apiClient.post("/ai/portfolio", payload);
      setAiInsights(res.data);
    } catch (err) {
      console.error("AI Analysis error:", err);
      setAiError(err.response?.data?.detail || "Failed to analyze portfolio. Please try again.");
    } finally {
      setIsAnalyzingAI(false);
    }
  };
  const pnlPct     = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const isPos      = totalPnl >= 0;

  const pieData = useMemo(() =>
    holdings.slice(0, 8).map((h, i) => ({ name: h.symbol, value: h.value, color: COIN_COLORS[h.symbol?.toUpperCase()] || CHART_COLORS[i % CHART_COLORS.length] })),
    [holdings]
  );

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setImporting(true); setImportMsg(null);
    try {
      const text = await file.text();
      const { trades: parsed, exchange, count } = parseCSV(text);
      setTrades(prev => [...prev, ...parsed]);
      setImportMsg({ ok: true, text: count + " trades imported from " + exchange });
      setShowAddSource(false);
      if (user) {
        await supabase.from("trades").insert(parsed.map(t => ({
          user_id: user.id, exchange: t.exchange, symbol: t.symbol, side: t.side,
          quantity: t.quantity, price: t.price, fee: t.fee || 0,
          traded_at: t.traded_at || new Date().toISOString(),
        })));
      }
    } catch (e) { setImportMsg({ ok: false, text: e.message }); }
    finally { setImporting(false); }
  }, [user]);

  const handleClearTrades = useCallback(async () => {
    if (!window.confirm("Are you sure you want to clear all imported CSV trades?")) return;
    setTrades([]);
    try { localStorage.removeItem("crypto_neko_trades"); } catch {}
    if (user) {
      try {
        await supabase.from("trades").delete().eq("user_id", user.id);
        setImportMsg({ ok: true, text: "All imported trades have been cleared." });
      } catch (e) {
        setImportMsg({ ok: false, text: "Failed to clear trades from database." });
      }
    }
  }, [user]);


  const topPerformer = holdings.length > 0 ? [...holdings].sort((a, b) => b.pnl_pct - a.pnl_pct)[0] : null;
  const worstPerformer = holdings.length > 0 ? [...holdings].sort((a, b) => a.pnl_pct - b.pnl_pct)[0] : null;

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white">
      <div className="max-w-[1200px] mx-auto pb-16 px-4 sm:px-6 relative z-10">

      {/* HEADER (Vesta Style) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-10 pb-6 border-b border-white/5 mb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Investment</h1>
          <div className="hidden sm:flex items-center gap-1 bg-[#121212] rounded-lg p-1 border border-white/5">
            <button onClick={() => handleTabChange("overview")} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === "overview" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>Overview</button>
            <button onClick={() => handleTabChange("swap")} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === "swap" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>Trade & Swap</button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#121212] border border-white/5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
            <span className="text-sm font-medium text-gray-300">This Year</span>
            <ChevronDown size={14} className="text-gray-500" />
          </div>
          <button 
            onClick={() => setShowAddSource(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#1a1d21] text-white border border-white/10 font-bold rounded-lg hover:bg-[#222529] transition-colors"
          >
            <Wallet size={14} /> Connect
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-[#14F195] text-black font-bold rounded-lg hover:bg-[#14F195]/90 transition-colors shadow-[0_0_15px_rgba(20,241,149,0.3)]">
            <Brain size={14} /> Ask AI
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "swap" && (
          <motion.div
            key="swap-view"
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
            key="overview-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* TOP METRICS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-5 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Total Portfolio Value</div>
                <div className="text-2xl font-black text-white"><NumberFlow value={totalValue || 0} format={{ style: "currency", currency: "USD" }} /></div>
                <div className={`text-[11px] font-bold mt-2 flex items-center gap-1 ${isPos ? "text-[#14F195]" : "text-red-400"}`}>
                  {isPos ? "↑" : "↓"} +<NumberFlow value={Math.abs(pnlPct) || 0} format={{ maximumFractionDigits: 2 }} />% This Year
                </div>
              </div>
              <div className="p-5 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Daily P/L</div>
                <div className="text-2xl font-black text-white">{isPos ? "+" : "-"}$<NumberFlow value={Math.abs(totalPnl) || 0} format={{ maximumFractionDigits: 0 }} /></div>
                <div className={`text-[11px] font-bold mt-2 flex items-center gap-1 ${isPos ? "text-[#14F195]" : "text-red-400"}`}>
                  {isPos ? "↑" : "↓"} +0.43% Last Year
                </div>
              </div>
              <div className="p-5 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly Return</div>
                <div className="text-2xl font-black text-white">+8.2%</div>
                <div className="text-[11px] font-bold mt-2 flex items-center gap-1 text-red-400">
                  ↓ -1.4% Vs BTC
                </div>
              </div>
              <div className="p-5 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Total Profit</div>
                <div className="text-2xl font-black text-white">${totalPnl > 0 ? (totalPnl).toLocaleString(undefined, {maximumFractionDigits:0}) : "0"}</div>
                <div className="text-[11px] font-bold mt-2 text-gray-500 uppercase">YTD</div>
              </div>
              <div className="p-5 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Risk Score</div>
                <div className="text-2xl font-black text-white">0.87</div>
                <div className="text-[11px] font-bold mt-2 text-gray-500">Moderate Beta</div>
              </div>
            </div>

            {/* MIDDLE ROW (Chart + Holdings) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* PERFORMANCE CHART */}
              <div className="lg:col-span-8 p-6 rounded-[24px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-bold text-white">Performance Vs Benchmarks</h3>
                  <div className="flex items-center gap-4 text-[11px] font-semibold">
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#14F195]"></div> Portfolio +4.25%</span>
                    <span className="flex items-center gap-1.5 text-gray-500"><div className="w-2 h-2 rounded-full bg-red-400"></div> BTC -1.39%</span>
                    <span className="flex items-center gap-1.5 text-gray-500"><div className="w-2 h-2 rounded-full bg-gray-600"></div> ETH -1.1%</span>
                  </div>
                </div>
                
                <div className="flex-1 w-full min-h-[300px]">
                  {isChartLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-[#14F195] border-t-transparent rounded-full opacity-50" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} hide />
                        <RechartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#111214] border border-[#2a2d31] px-4 py-3 rounded-[12px] shadow-xl">
                                  <p className="text-white font-bold text-[16px]">
                                    <NumberFlow value={Number(data.value) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} />
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#14F195" strokeWidth={3} fillOpacity={0.1} fill="#14F195" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* HOLDINGS */}
              <div className="lg:col-span-4 p-6 rounded-[24px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-bold text-white">Holdings</h3>
                  <button className="text-[11px] font-semibold text-gray-500 hover:text-white transition-colors">View All →</button>
                </div>
                
                <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[320px]">
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-white/5">
                    <div>Asset</div>
                    <div className="text-right">Price</div>
                    <div className="text-center">Weight</div>
                    <div className="text-right">P/L</div>
                  </div>
                  
                  {holdings.length === 0 ? (
                    <div className="text-center text-xs text-gray-500 py-8">No assets found</div>
                  ) : (
                    holdings.slice(0, 6).map((h, i) => {
                      const w = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
                      const p = h.pnl >= 0;
                      return (
                        <div key={h.symbol} className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center group cursor-pointer hover:bg-white/5 p-1 -mx-1 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            {h.image_url ? (
                              <img src={h.image_url} alt={h.symbol} className="w-8 h-8 rounded-full shadow-sm" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">{h.symbol[0]}</div>
                            )}
                            <div>
                              <div className="text-[13px] font-bold text-white">{h.symbol}</div>
                              <div className="text-[10px] text-gray-500">{h.name}</div>
                            </div>
                          </div>
                          
                          <div className="text-right text-[13px] font-semibold text-white">
                            ${h.current_price < 1 ? h.current_price.toFixed(4) : h.current_price.toLocaleString(undefined, {maximumFractionDigits: 2})}
                          </div>
                          
                          <div className="flex items-center gap-2 justify-center">
                            <span className="text-[10px] text-gray-400 font-mono w-8 text-right">{w.toFixed(0)}%</span>
                            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${w}%` }}></div>
                            </div>
                          </div>
                          
                          <div className={`text-right text-[12px] font-bold ${p ? "text-[#14F195]" : "text-red-400"}`}>
                            {p ? "+" : ""}{h.pnl_pct.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* BOTTOM ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* ALLOCATION */}
              <div className="lg:col-span-4 p-6 rounded-[24px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-bold text-white">Allocation</h3>
                  <span className="text-[11px] text-gray-500 font-semibold">This Week</span>
                </div>
                <div className="text-3xl font-black text-white mb-6">
                  <NumberFlow value={totalValue || 0} format={{ style: "currency", currency: "USD" }} />
                </div>
                
                <div className="h-[120px] w-full mb-6 relative">
                  {/* Fake area chart for allocation */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14F195]/10 to-transparent rounded-xl"></div>
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M0,100 L0,60 Q25,70 50,40 T100,20 L100,100 Z" fill="#14F195" fillOpacity="0.1"/>
                    <path d="M0,60 Q25,70 50,40 T100,20" fill="none" stroke="#14F195" strokeWidth="2" strokeDasharray="4 4"/>
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#14F195] text-black text-[11px] font-bold px-2.5 py-1 rounded-md shadow-lg">
                    12.45%
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 mt-auto">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Volatility</div>
                    <div className="text-[13px] font-bold text-white mt-1">14.2%</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Market Cap</div>
                    <div className="text-[13px] font-bold text-white mt-1">$1.2B</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Sortino</div>
                    <div className="text-[13px] font-bold text-white mt-1">1.87</div>
                  </div>
                </div>
              </div>

              {/* TOP MOVERS & WATCHLIST */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Movers */}
                <div className="p-6 rounded-[24px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-2xl flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[15px] font-bold text-white">Top Movers</h3>
                    <span className="text-[11px] text-gray-500 font-semibold">Today</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-[11px] font-bold text-[#14F195] uppercase mb-4">Gainers</div>
                      {topPerformer ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[13px] font-bold text-white">{topPerformer.symbol}</div>
                            <div className="text-[10px] text-gray-500">{topPerformer.name}</div>
                          </div>
                          <div className="text-[12px] font-bold text-[#14F195]">+{topPerformer.pnl_pct.toFixed(1)}%</div>
                        </div>
                      ) : (
                         <div className="text-xs text-gray-600">No data</div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-[11px] font-bold text-red-400 uppercase mb-4">Losers</div>
                      {worstPerformer ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[13px] font-bold text-white">{worstPerformer.symbol}</div>
                            <div className="text-[10px] text-gray-500">{worstPerformer.name}</div>
                          </div>
                          <div className="text-[12px] font-bold text-red-400">{worstPerformer.pnl_pct.toFixed(1)}%</div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">No data</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Watchlist Mini */}
                <div className="p-6 rounded-[24px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-2xl">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">Watchlist</div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shadow-sm group-hover:bg-white/20 transition-colors">🍎</div>
                        <span className="text-[13px] font-bold text-white">Apple Inc.</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-bold text-white">$174.55</div>
                        <div className="text-[10px] font-bold text-[#14F195]">+1.8%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-sm text-green-500 shadow-sm group-hover:bg-green-500/20 transition-colors">N</div>
                        <span className="text-[13px] font-bold text-white">Nvidia</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-bold text-white">$203.34</div>
                        <div className="text-[10px] font-bold text-[#14F195]">+2.3%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MARKET INTELLIGENCE */}
              <div className="lg:col-span-4 p-6 rounded-[24px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-bold text-white">Market Intelligence</h3>
                  <span className="text-[11px] text-gray-500 font-semibold">2h Ago</span>
                </div>
                
                <div className="space-y-6 flex-1">
                  <div className="group cursor-pointer">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">DeFi - Global</div>
                    <p className="text-[13px] text-gray-300 font-medium leading-relaxed group-hover:text-white transition-colors">
                      Total Value Locked in DeFi Protocols Surpasses $100B, Boosting Yield Farming Confidence.
                    </p>
                  </div>
                  <div className="group cursor-pointer">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">CryptoNeko - Network</div>
                    <p className="text-[13px] text-gray-300 font-medium leading-relaxed group-hover:text-white transition-colors">
                      Ethereum Gas Fees Drop to Yearly Lows Amid Rising Layer-2 Adoption.
                    </p>
                  </div>
                  <div className="group cursor-pointer">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Regulation - Asia</div>
                    <p className="text-[13px] text-gray-300 font-medium leading-relaxed group-hover:text-white transition-colors">
                      New Frameworks Proposed for Stablecoin Audits, Sparking Discussions on Compliance.
                    </p>
                  </div>
                </div>
              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Sources Modal */}
      <AnimatePresence>
        {showAddSource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-[#0a0b0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <h3 className="text-xl font-black text-white">Connect Portfolio</h3>
                  <p className="text-sm text-gray-500 mt-1">Link your wallets and exchanges securely.</p>
                </div>
                <button onClick={() => setShowAddSource(false)} className="text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-4">Web3 & Exchanges</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  <ConnectButton.Custom>
                    {({ account, chain, openAccountModal, openConnectModal, authenticationStatus, mounted }) => {
                      const connected = mounted && authenticationStatus !== 'loading' && account && chain;
                      return (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (connected && openAccountModal) openAccountModal();
                            else if (openConnectModal) openConnectModal();
                          }}
                          className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] border transition-all duration-300 group ${
                            connected ? "bg-purple-500/10 border-purple-500/30" : "bg-[#1a1d21] border-[#2a2d31] hover:bg-[#222529]"
                          }`}
                        >
                          <span className="text-2xl">🦊</span>
                          <span className={`text-[11px] font-semibold ${connected ? "text-purple-400" : "text-gray-400 group-hover:text-white"}`}>
                            {connected ? "Connected" : "Web3 Wallet"}
                          </span>
                        </button>
                      );
                    }}
                  </ConnectButton.Custom>
                  
                  {Object.entries(EXCHANGE_GUIDES).map(([key, ex]) => {
                    const isConnected = trades.some(t => t.exchange === ex.name);
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (!isConnected) {
                            setShowAddSource(false);
                            setConnectingExchange(ex);
                            setOauthStep(4);
                          }
                        }}
                        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] border transition-all duration-300 group ${
                          isConnected ? "bg-[#14F195]/5 border-[#14F195]/20" : "bg-[#1a1d21] border-[#2a2d31] hover:bg-[#222529]"
                        }`}
                      >
                        <span className="text-2xl">{ex.logo}</span>
                        <span className={`text-[11px] font-semibold ${isConnected ? "text-[#14F195]" : "text-gray-400 group-hover:text-white"}`}>
                          {isConnected ? "Synced" : ex.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-3">ETH Address</p>
                    <div className="flex flex-col gap-2">
                      <input 
                        value={walletInput} 
                        onChange={e => setWalletInput(e.target.value)} 
                        placeholder="0x..."
                        className="w-full bg-[#111214] border border-[#2a2d31] rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#14F195]/50 transition-all" 
                      />
                      <button 
                        onClick={() => { if (walletInput.trim()) { setWallets(prev => [...new Set([...prev, walletInput.trim()])]); setWalletInput(""); } }}
                        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[13px] font-semibold transition-all text-white"
                      >
                        {isFetchingWallet ? "Fetching..." : "Add Public Wallet"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-3">CSV Import</p>
                    <input type="file" ref={fileRef} accept=".csv" className="hidden" onChange={(e) => { handleFile(e.target.files[0]); setShowAddSource(false); }} />
                    <button 
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#2a2d31] rounded-xl p-4 hover:border-[#14F195]/50 hover:bg-[#14F195]/5 transition-all text-gray-400 hover:text-white cursor-pointer"
                    >
                      <Upload size={20} />
                      <span className="text-[12px] font-semibold">Upload CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Exchange Modal */}
      <AnimatePresence>
        {connectingExchange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
            >
              {oauthStep === 4 && (
                <>
                  <div className="h-2 w-full" style={{ background: connectingExchange.color }} />
                  <button
                    onClick={() => {
                      setOauthStep(0);
                      setConnectingExchange(null);
                      setApiKey("");
                      setApiSecret("");
                      setApiPassphrase("");
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>

                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl">{connectingExchange.logo}</div>
                      <div>
                        <h3 className="text-xl font-black text-white">API Connection</h3>
                        <p className="text-xs text-gray-400">Read-Only access for {connectingExchange.name}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">API Key</label>
                        <input
                          type="text"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
                          placeholder="Enter your API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">API Secret</label>
                        <input
                          type="password"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
                          placeholder="Enter your API Secret"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Passphrase <span className="text-gray-600 normal-case">(Optional - Required for OKX/KuCoin)</span></label>
                        <input
                          type="password"
                          value={apiPassphrase}
                          onChange={(e) => setApiPassphrase(e.target.value)}
                          className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
                          placeholder="Passphrase (if applicable)"
                        />
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setIsConnecting(true);
                        setOauthStep(5);
                        try {
                          const res = await apiClient.post("/exchanges/sync", {
                            exchange_id: connectingExchange.id || connectingExchange.name.toLowerCase(),
                            api_key: apiKey,
                            secret: apiSecret,
                            password: apiPassphrase || undefined
                          });
                          
                          const fetchedHoldings = res.data;
                          
                          if (fetchedHoldings && fetchedHoldings.length > 0) {
                            const newTrades = fetchedHoldings.map((h: any) => ({
                              symbol: h.symbol,
                              side: "buy",
                              quantity: h.quantity,
                              price: 0,
                              total: 0,
                              traded_at: new Date().toISOString(),
                              exchange: connectingExchange.name
                            }));

                            if (user) {
                              const tradesToInsert = newTrades.map((t: any) => ({ ...t, user_id: user.id }));
                              await supabase.from("trades").insert(tradesToInsert);
                              const { data } = await supabase.from("trades").select("*").eq("user_id", user.id).order("traded_at", { ascending: true });
                              if (data) setTrades(data);
                            } else {
                              const updated = [...trades, ...newTrades];
                              setTrades(updated);
                              localStorage.setItem("crypto_neko_trades", JSON.stringify(updated));
                            }
                            setImportMsg({ ok: true, text: `Successfully synced ${fetchedHoldings.length} assets from ${connectingExchange.name}!` });
                          } else {
                            setImportMsg({ ok: true, text: `Connected successfully, but no assets found in ${connectingExchange.name}.` });
                          }
                          setOauthStep(0);
                          setConnectingExchange(null);
                        } catch (err: any) {
                          alert(err.response?.data?.detail || "Failed to connect to exchange.");
                          setOauthStep(4);
                        } finally {
                          setIsConnecting(false);
                          setApiKey("");
                          setApiSecret("");
                          setApiPassphrase("");
                        }
                      }}
                      disabled={isConnecting || !apiKey || !apiSecret}
                      className="w-full bg-[var(--accent)] text-white font-bold py-3.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isConnecting ? "Connecting..." : "Sync Real Portfolio"}
                    </button>
                  </div>
                </>
              )}
              {oauthStep === 5 && (
                <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">Connecting API...</h3>
                  <p className="text-gray-500 text-sm">Authenticating and fetching real balances from {connectingExchange?.name}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AIRebalanceModal isOpen={isRebalanceOpen} onClose={() => setIsRebalanceOpen(false)} holdings={holdings} />
    </div>
    </div>
  );
}


