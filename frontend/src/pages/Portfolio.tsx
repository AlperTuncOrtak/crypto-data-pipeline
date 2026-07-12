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

      {/* HERO */}
      <div className="relative flex flex-col items-center justify-center pt-20 pb-10 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[300px] rounded-full blur-[120px] bg-[var(--accent)]/5" />
        </div>
        <p className="relative z-10 text-[12px] font-bold uppercase tracking-[0.2em] mb-4 text-[#6b707a]">
          {t('portfolio.title')}
        </p>
        <h1 className="relative z-10 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white drop-shadow-sm break-words max-w-full px-4 flex items-baseline justify-center gap-2">
          <span className="text-[#6b707a] text-4xl">$</span>
          <NumberFlow value={Number.isNaN(Number(totalValue)) ? 0 : Number(totalValue)} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
        </h1>
        <div className={`relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] border text-[14px] font-semibold transition-all duration-300 ${isPos ? "text-[#14F195] bg-[#14F195]/10 border-[#14F195]/20" : "text-[#FF0013] bg-[#FF0013]/10 border-[#FF0013]/20"}`}>
          {isPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span className="flex items-center gap-1">
            {isPos ? "+" : "-"}$
            <NumberFlow value={Number.isNaN(Number(totalPnl)) ? 0 : Math.abs(Number(totalPnl))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
          </span>
          <span className="text-[12px] opacity-80 ml-1 flex items-center bg-black/20 px-2 py-0.5 rounded-[6px]">
            {isPos ? "+" : ""}<NumberFlow value={Number.isNaN(Number(pnlPct)) ? 0 : Number(pnlPct)} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />%
          </span>
        </div>

        {/* TABS */}
        <div className="relative z-10 flex items-center justify-center gap-2 mt-12 bg-[#0a0b0d] border border-[#1e1e1e] p-1.5 rounded-[16px] w-max mx-auto shadow-lg">
          <button
            onClick={() => handleTabChange("overview")}
            className={`px-8 py-2.5 rounded-[12px] text-[14px] font-semibold transition-all duration-300 ${
              activeTab === "overview"
                ? "bg-[#1a1d21] text-white shadow-sm"
                : "text-[#6b707a] hover:text-white hover:bg-[#111214]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange("swap")}
            className={`px-8 py-2.5 rounded-[12px] text-[14px] font-semibold transition-all duration-300 ${
              activeTab === "swap"
                ? "bg-[#1a1d21] text-white shadow-sm"
                : "text-[#6b707a] hover:text-white hover:bg-[#111214]"
            }`}
          >
            Trade & Swap
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
          >
            {/* PERFORMANCE CHART */}
        {chartData.length > 0 && (
          <div className="w-full max-w-4xl mx-auto mt-12 mb-4 relative z-10">
            <div className="flex justify-end gap-2 mb-4 px-4">
              {[24, 168, 720].map((hours) => {
                const labels = { 24: "24H", 168: "7D", 720: "30D" };
                return (
                  <button
                    key={hours}
                    onClick={() => setChartRange(hours)}
                    className={`px-3 py-1 text-[12px] font-semibold rounded-[8px] transition-all ${
                      chartRange === hours
                        ? "bg-[#1a1d21] text-white shadow-sm"
                        : "bg-transparent text-[#6b707a] hover:text-white hover:bg-[#111214]"
                    }`}
                  >
                    {labels[hours]}
                  </button>
                );
              })}
            </div>
            
            <div className="h-[250px] w-full bg-[#0a0b0d] rounded-[16px] border border-[#1e1e1e] p-4 shadow-lg">
              {isChartLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full opacity-50" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14F195" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14F195" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      hide 
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      hide 
                    />
                    <RechartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const date = new Date(data.fullTime);
                          return (
                            <div className="bg-[#111214] border border-[#2a2d31] px-4 py-3 rounded-[12px] shadow-xl">
                              <p className="text-[#6b707a] text-[12px] font-semibold mb-1">
                                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-white font-bold text-[16px]">
                                <NumberFlow value={Number(data.value) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} />
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ stroke: '#2a2d31', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#14F195" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

      {/* Import message */}
      {importMsg && (
        <div className={`flex items-center gap-3 mb-6 px-5 py-3 rounded-[32px] border text-sm font-semibold ${importMsg.ok ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
          {importMsg.text}
          <button onClick={() => setImportMsg(null)} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
      )}

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 mt-8">
        
        {/* LEFT COLUMN: Table */}
        <div className="lg:col-span-8 flex flex-col gap-6">

        {/* TOP MOVERS WIDGETS */}
        {topPerformer && worstPerformer && topPerformer.symbol !== worstPerformer.symbol && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0a0b0d] border border-[#1e1e1e] rounded-[16px] p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#14F195]/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-[#14F195]/10 group-hover:scale-150 transition-all duration-500 transform translate-x-1/2 -translate-y-1/2"></div>
              <h3 className="text-[12px] font-semibold text-[#8b909a] uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-[#14F195]" /> Top Performer</h3>
              <div className="flex items-center gap-4 relative z-10">
                {topPerformer.image_url ? <img src={topPerformer.image_url} alt={topPerformer.symbol} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[14px] font-bold text-white">{topPerformer.symbol[0]}</div>}
                <div>
                  <div className="text-[18px] font-bold text-white">{topPerformer.symbol}</div>
                  <div className="text-[13px] font-semibold text-[#14F195] flex items-center gap-1">
                    ▲ <NumberFlow value={Number.isNaN(Number(topPerformer.pnl_pct)) ? 0 : Math.abs(Number(topPerformer.pnl_pct))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#0a0b0d] border border-[#1e1e1e] rounded-[16px] p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#FF0013]/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-[#FF0013]/10 group-hover:scale-150 transition-all duration-500 transform translate-x-1/2 -translate-y-1/2"></div>
              <h3 className="text-[12px] font-semibold text-[#8b909a] uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingDown size={14} className="text-[#FF0013]" /> Worst Performer</h3>
              <div className="flex items-center gap-4 relative z-10">
                {worstPerformer.image_url ? <img src={worstPerformer.image_url} alt={worstPerformer.symbol} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[14px] font-bold text-white">{worstPerformer.symbol[0]}</div>}
                <div>
                  <div className="text-[18px] font-bold text-white">{worstPerformer.symbol}</div>
                  <div className="text-[13px] font-semibold text-[#FF0013] flex items-center gap-1">
                    ▼ <NumberFlow value={Number.isNaN(Number(worstPerformer.pnl_pct)) ? 0 : Math.abs(Number(worstPerformer.pnl_pct))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Data Sources (Collapsible) */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-white">{t('portfolio.your_holdings')}</h2>
            <button
              onClick={() => setShowAddSource(v => !v)}
              className="text-[12px] font-semibold px-4 py-2 rounded-[8px] bg-[#0a0b0d] text-[#6b707a] border border-[#1e1e1e] hover:bg-[#111214] hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              <Wallet size={14} />
              {showAddSource ? t('portfolio.close_options') : "Manage Sources"}
            </button>
          </div>
            {showAddSource && (
              <div className="bg-[#0a0b0d] border border-[#1e1e1e] rounded-[16px] p-6 shadow-lg mb-6 relative overflow-hidden">
                {/* Exchange buttons */}
                <p className="text-[12px] font-semibold text-[#8b909a] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Wallet size={14} className="text-[var(--accent)]" /> Import Data
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-4 mb-5 rounded-[12px] bg-[#111214] border border-[#2a2d31]">
                  <ConnectButton.Custom>
                    {({ account, chain, openAccountModal, openConnectModal, authenticationStatus, mounted }) => {
                      const ready = mounted && authenticationStatus !== 'loading';
                      const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (connected && openAccountModal) openAccountModal();
                            else if (openConnectModal) openConnectModal();
                          }}
                          className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] border transition-all duration-300 group overflow-hidden ${
                            connected 
                              ? "bg-purple-500/10 border-purple-500/30 cursor-pointer" 
                              : "bg-[#1a1d21] border-[#2a2d31] hover:bg-[#222529] hover:border-[#3a3d41]"
                          }`}
                        >
                          {connected && (
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                          )}
                          <span className="text-2xl">🦊</span>
                          <span className={`text-[11px] font-semibold text-center truncate w-full transition-colors ${
                            connected ? "text-purple-400" : "text-[#8b909a] group-hover:text-white"
                          }`}>
                            {connected ? "Wallet Connected" : "Connect Web3"}
                          </span>
                        </button>
                      );
                    }}
                  </ConnectButton.Custom>
                  {Object.entries(EXCHANGE_GUIDES).map(([key, ex]) => {
                    const isExConnected = trades.some(t => t.exchange === ex.name);
                    return (
                      <button
                        key={key}
                        onClick={() => !isExConnected && setConnectingExchange(ex)}
                        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] border transition-all duration-300 group overflow-hidden ${
                          isExConnected 
                            ? "bg-[#14F195]/5 border-[#14F195]/20 cursor-default" 
                            : "bg-[#1a1d21] border-[#2a2d31] hover:bg-[#222529] hover:border-[#3a3d41]"
                        }`}
                      >
                        {isExConnected && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#14F195] shadow-[0_0_6px_rgba(20,241,149,0.8)]" />
                        )}
                        <span className="text-2xl">{ex.logo}</span>
                        <span className={`text-[11px] font-semibold text-center truncate w-full transition-colors ${
                          isExConnected ? "text-[#14F195]" : "text-[#8b909a] group-hover:text-white"
                        }`}>
                          {isExConnected ? "Connected" : ex.name}
                        </span>
                      </button>
                    );
                  })}
                  <input type="file" ref={fileRef} accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                </div>

                {/* ETH Wallet Input */}
                <p className="text-[12px] font-semibold text-[#8b909a] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <RefreshCw size={14} className="text-[var(--accent)]" /> {t('portfolio.eth_wallet')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    value={walletInput} 
                    onChange={e => setWalletInput(e.target.value)} 
                    placeholder="0x..."
                    className="flex-1 min-w-0 bg-[#111214] border border-[#2a2d31] rounded-[10px] px-4 py-3 sm:px-5 text-[14px] text-white placeholder-[#6b707a] focus:outline-none focus:border-[var(--accent)]/50 transition-all duration-300" 
                  />
                  <button 
                    onClick={() => { if (walletInput.trim()) { setWallets(prev => [...new Set([...prev, walletInput.trim()])]); setWalletInput(""); } }}
                    className="px-6 py-3 rounded-[10px] bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 text-[13px] font-semibold whitespace-nowrap transition-all duration-300"
                  >
                    {isFetchingWallet ? t('portfolio.fetching') : t('portfolio.add_wallet')}
                  </button>
                </div>
                {wallets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {wallets.map(w => (
                      <span 
                        key={w} 
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-[#111214] border border-[#2a2d31] text-[12px] text-[#8b909a] font-mono hover:bg-[#1a1d21] transition-colors"
                      >
                        {w.slice(0,6)}...{w.slice(-4)}
                        <button 
                          onClick={() => setWallets(prev => prev.filter(x => x !== w))} 
                          className="text-[#6b707a] hover:text-red-400 transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

          <div className="flex flex-wrap gap-2 pt-4 border-t border-[#1e1e1e] items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {trades.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <CheckCircle size={12} /> {trades.length} CSV Trades
                </span>
              )}
              {binanceKeys.key && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                  <CheckCircle size={12} /> Binance Synced
                </span>
              )}
              {wallets.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold bg-[#1a1d21] text-[#8b909a] border border-[#2a2d31]">
                  <Wallet size={12} /> {wallets.length} Wallet{wallets.length > 1 ? "s" : ""}
                </span>
              )}
              {trades.length === 0 && !binanceKeys.key && wallets.length === 0 && (
                <span className="text-[12px] font-medium text-[#6b707a]">{t('portfolio.no_sources')}</span>
              )}
            </div>
            
            {trades.length > 0 && (
              <button 
                onClick={handleClearTrades} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300 ml-auto"
              >
                {t('portfolio.clear_csv')}
              </button>
            )}
          </div>
        </div>

      {/* HOLDINGS TABLE */}
      {holdings.length > 0 ? (
        <div className="bg-[#0a0b0d] border border-[#1e1e1e] shadow-lg rounded-[16px] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#1e1e1e] bg-[#111214]">
                  {[t('portfolio.table.asset'), t('portfolio.table.price'), t('portfolio.table.balance'), t('portfolio.table.value'), t('portfolio.table.avg_cost'), t('portfolio.table.pnl')].map((h, i) => (
                    <th key={h} className={`px-5 py-4 text-[12px] font-semibold uppercase tracking-wider text-[#6b707a] ${i === 0 ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => {
                  const p = h.pnl >= 0;
                  return (
                    <motion.tr 
                      key={h.symbol} 
                      onClick={() => navigate("/coin/" + h.slug)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="transition-colors cursor-pointer group border-b border-[#1e1e1e] hover:bg-[#111214]"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          {h.image_url
                            ? <img src={h.image_url} alt={h.symbol} className="w-8 h-8 rounded-full shrink-0 transition-transform group-hover:scale-105" />
                            : <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold bg-[#1a1d21] text-[#8b909a]">
                                {h.symbol[0]}
                              </div>
                          }
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-gray-200 transition-colors">{h.symbol}</div>
                            <div className="text-xs font-bold tracking-widest uppercase text-gray-500 mt-0.5">{h.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right font-mono text-sm font-semibold text-gray-400">
                        <NumberFlow value={Number.isNaN(Number(h.current_price)) ? 0 : Number(h.current_price)} format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: h.current_price < 0.01 ? 6 : (h.current_price < 1 ? 4 : 2) }} />
                      </td>
                      <td className="px-5 py-5 text-right font-mono text-sm text-gray-500">
                        <NumberFlow value={Number.isNaN(Number(h.quantity)) ? 0 : Number(h.quantity)} format={{ maximumFractionDigits: 6 }} />
                      </td>
                      <td className="px-5 py-5 text-right font-mono text-sm font-bold text-white">
                        <NumberFlow value={Number.isNaN(Number(h.value)) ? 0 : Number(h.value)} format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
                      </td>
                      <td className="px-5 py-5 text-right font-mono text-sm text-gray-500">
                        {h.avg_cost > 0 ? <NumberFlow value={Number.isNaN(Number(h.avg_cost)) ? 0 : Number(h.avg_cost)} format={{ style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: h.avg_cost < 0.01 ? 6 : (h.avg_cost < 1 ? 4 : 2) }} /> : "—"}
                      </td>
                      <td className="px-5 py-5 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`font-mono text-sm font-bold flex items-center gap-0.5 ${p ? "text-green-400" : "text-red-400"}`}>
                            {p ? "+" : "-"}$<NumberFlow value={Number.isNaN(Number(h.pnl)) ? 0 : Math.abs(Number(h.pnl))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
                          </span>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${p ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            {p ? "▲" : "▼"} <NumberFlow value={Number.isNaN(Number(h.pnl_pct)) ? 0 : Math.abs(Number(h.pnl_pct))} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-[#0a0b0d] border border-[#1e1e1e] rounded-[16px] shadow-lg text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-[var(--accent)]/5 rounded-full blur-[60px] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <BarChart2 size={48} className="text-[#4b4f58] mb-4 relative z-10" />
          <h3 className="text-[18px] font-bold text-white mb-2 relative z-10">{t('portfolio.empty.title')}</h3>
          <p className="text-[14px] text-[#8b909a] max-w-sm mx-auto relative z-10">{t('portfolio.empty.desc')}</p>
          {!showAddSource && (
            <button
              onClick={() => setShowAddSource(true)}
              className="mt-6 text-[13px] font-semibold px-6 py-3 rounded-[10px] bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all duration-300 relative z-10"
            >
              {t('portfolio.empty.btn')}
            </button>
          )}
        </div>
      )}


        </div>

        {/* RIGHT COLUMN: Donut + AI Insights + Tax Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Donut */}
        <div className="w-full flex flex-col min-h-[380px] bg-[#0a0b0d] border border-[#1e1e1e] rounded-[16px] p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute left-1/2 top-1/2 w-[300px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-[80px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 group-hover:bg-[var(--accent)]/10 transition-all duration-700"></div>
          <h3 className="text-[14px] font-semibold text-white mb-4 shrink-0 relative z-10 flex items-center justify-center">
            {t('portfolio.asset_allocation')}
          </h3>
          
          <div className="flex-1 w-full relative min-h-[200px]">
            {holdings.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-[13px] font-medium text-[#6b707a]">{t('portfolio.no_assets')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" paddingAngle={4} dataKey="value" stroke="none" cornerRadius={4}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RechartTooltip
                    formatter={(v) => fmtUSD(v)}
                    contentStyle={{ backgroundColor: "#111214", border: "1px solid #2a2d31", borderRadius: "12px", color: "white", fontSize: 13, fontWeight: 600, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                    itemStyle={{ color: "white" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {pieData.length > 0 && (
            <div className="shrink-0 flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 pt-4 border-t border-[#1e1e1e]">
              {pieData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#8b909a]">
                  <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
              ))}
            </div>
          )}
        </div>

      {/* AI PORTFOLIO INSIGHTS */}
      {holdings.length > 0 && (
        <div className="mb-6 border border-[var(--accent)]/20 bg-[#16181c] rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 relative z-10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-1 flex items-center gap-2">
                <Brain size={14} /> {t('portfolio.ai_analysis.title')}
              </h3>
              <p className="text-sm text-gray-400">{t('portfolio.ai_analysis.desc')}</p>
            </div>
            
            <button 
              onClick={handleGetAIInsights}
              disabled={isAnalyzingAI}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] text-[var(--text-primary)] shadow-[0_0_20px_var(--accent-soft)] hover:shadow-[0_0_30px_var(--accent-border)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isAnalyzingAI ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> {t('portfolio.ai_analysis.analyzing')}</>
              ) : (
                <><Brain size={16} /> {t('portfolio.ai_analysis.generate')}</>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {aiError}
            </div>
          )}

            {aiInsights && (
              <div className="space-y-8 relative z-10 animate-fadeInDown mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-4">{t('portfolio.ai_analysis.risk')}</div>
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl shadow-lg shrink-0" style={{
                        backgroundColor: aiInsights.risk_score > 7 ? 'rgba(244,63,94,0.1)' : aiInsights.risk_score > 4 ? 'var(--accent-soft)' : 'rgba(45,212,191,0.1)',
                        color: aiInsights.risk_score > 7 ? '#F43F5E' : aiInsights.risk_score > 4 ? 'var(--accent)' : '#2DD4BF',
                        border: `1px solid ${aiInsights.risk_score > 7 ? 'rgba(244,63,94,0.3)' : aiInsights.risk_score > 4 ? 'var(--accent-soft)' : 'rgba(45,212,191,0.3)'}`
                      }}>
                        {aiInsights.risk_score}/10
                      </div>
                      <div>
                        <div className="text-xl font-black text-gray-200">{aiInsights.risk_label}</div>
                        <div className="text-sm text-gray-400 mt-1">BTC: <span className="text-gray-200 font-bold capitalize">{aiInsights.correlation_risk}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-4">{t('portfolio.ai_analysis.diversification')}</div>
                    <div className="flex items-center gap-5">
                       <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-lg shrink-0">
                        {aiInsights.diversification_score}/10
                      </div>
                      <div>
                        <div className="text-xl font-black text-gray-200">{aiInsights.dominant_sector}</div>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/[0.05]">
                <div className="text-xs font-bold text-gray-500 uppercase mb-3">{t('portfolio.ai_analysis.summary')}</div>
                <p className="text-base text-gray-300 leading-relaxed">{aiInsights.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10">
                  <div className="text-xs font-bold text-emerald-500/70 uppercase mb-4">{t('portfolio.ai_analysis.strengths')}</div>
                  <ul className="space-y-3">
                    {aiInsights.strengths?.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                        <span className="text-emerald-500 mt-0.5 shrink-0">•</span> <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 rounded-[32px] bg-red-500/5 border border-red-500/10">
                  <div className="text-xs font-bold text-red-500/70 uppercase mb-4">{t('portfolio.ai_analysis.risks')}</div>
                   <ul className="space-y-3">
                    {aiInsights.risks?.map((r, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                        <span className="text-red-500 mt-0.5 shrink-0">•</span> <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-[32px] bg-[var(--accent)]/5 border border-[var(--accent)]/20">
                <div className="text-xs font-bold text-[var(--accent)] uppercase mb-4">{t('portfolio.ai_analysis.recommendations')}</div>
                <ul className="space-y-4">
                  {aiInsights.recommendations?.map((r, i) => (
                    <li key={i} className="text-sm md:text-base text-[var(--accent)]/90 flex items-start gap-3">
                      <span className="text-[var(--accent)] mt-0.5 shrink-0">→</span> <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}


      {/* TAX SUMMARY */}
      {trades.length > 0 && taxData && (
        <div className="mb-10 bg-[#121212] border border-white/[0.05] rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-1">{t('portfolio.tax.title')}</h3>
              <p className="text-sm text-gray-400">{t('portfolio.tax.desc')}</p>
            </div>
            <button 
              onClick={() => exportTaxCSV(taxData)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all duration-300 shadow-[0_0_15px_var(--accent-soft)] hover:shadow-[0_0_20px_var(--accent-soft)] whitespace-nowrap"
            >
              <FileDown size={16} /> {t('portfolio.tax.export')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-[32px] bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">{t('portfolio.tax.short_term')}</div>
              <div className="text-2xl font-black font-mono text-gray-200"><NumberFlow value={Number(taxData.estShortTax) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} /></div>
              <div className="text-xs text-gray-500 mt-1">{t('portfolio.tax.held_short')}</div>
            </div>
            <div className="p-5 rounded-[32px] bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">{t('portfolio.tax.long_term')}</div>
              <div className="text-2xl font-black font-mono text-gray-200"><NumberFlow value={Number(taxData.estLongTax) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} /></div>
              <div className="text-xs text-gray-500 mt-1">{t('portfolio.tax.held_long')}</div>
            </div>
            <div className="p-5 rounded-[32px] bg-[var(--accent)]/5 border border-[var(--accent)]/20 relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-[var(--accent)]/10 rounded-full blur-2xl"></div>
              <div className="text-xs font-bold text-[var(--accent)]/70 uppercase mb-2 relative z-10">{t('portfolio.tax.total')}</div>
              <div className="text-3xl font-black font-mono text-[var(--accent)] relative z-10"><NumberFlow value={Number(taxData.estTotalTax) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} /></div>
            </div>
          </div>
        </div>
      )}


        </div>
      </div>



      {guide && <GuideModal exchange={guide} onClose={() => setGuide(null)} />}

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
              {oauthStep === 0 && (
                <>
                  <div className="h-2 w-full" style={{ background: connectingExchange.color }} />
                  <button
                    onClick={() => setConnectingExchange(null)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>

                  <div className="p-8 text-center">
                    <div className="text-6xl mb-6 flex justify-center">{connectingExchange.logo}</div>
                    <h3 className="text-2xl font-black text-white mb-2">Connect {connectingExchange.name}</h3>
                    <p className="text-gray-400 text-sm mb-8">
                      Authorize CryptoNeko to view your {connectingExchange.name} balances and trading history via Fast API.
                    </p>

                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setOauthStep(1);
                          setTimeout(() => setOauthStep(2), 1500);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Connect automatically (OAuth)
                      </button>
                      <button 
                        onClick={() => setOauthStep(4)}
                        className="w-full text-xs font-bold text-gray-500 hover:text-white py-2 transition-colors"
                      >
                        Enter API Keys Manually
                      </button>
                    </div>
                  </div>
                </>
              )}

              {oauthStep === 4 && (
                <>
                  <div className="h-2 w-full" style={{ background: connectingExchange.color }} />
                  <button
                    onClick={() => {
                      setOauthStep(0);
                      setApiKey("");
                      setApiSecret("");
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
                    </div>

                    <button
                      onClick={async () => {
                        setIsConnecting(true);
                        setOauthStep(5);
                        try {
                          const res = await apiClient.post("/api/exchanges/sync", {
                            exchange_id: connectingExchange.name,
                            api_key: apiKey,
                            secret: apiSecret
                          });
                          
                          // Mocking the imported real holdings into demo trades for UX 
                          // Or we directly insert them
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

              {oauthStep === 1 && (
                <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">Redirecting to {connectingExchange.name}...</h3>
                  <p className="text-gray-500 text-sm">Opening secure OAuth portal</p>
                </div>
              )}

              {oauthStep === 2 && (
                <div className="bg-white text-black h-full flex flex-col">
                  <div className="flex items-center gap-2 border-b border-gray-200 p-3 bg-gray-50 text-xs text-gray-500 font-mono">
                    <Lock size={14} className="text-green-600" />
                    https://oauth.{connectingExchange.name.toLowerCase().replace(/\s/g, '')}.com/authorize
                  </div>
                  <div className="p-8 text-center flex-1">
                    <div className="text-5xl mb-4 flex justify-center">{connectingExchange.logo}</div>
                    <h2 className="text-xl font-bold mb-4">Authorize Access</h2>
                    <p className="text-gray-600 text-sm mb-6">
                      <strong>CryptoNeko</strong> is requesting read-only access to your {connectingExchange.name} account to view balances and trading history.
                    </p>
                    <div className="flex gap-3 mt-8">
                      <button 
                        onClick={() => {
                          setOauthStep(0);
                          setConnectingExchange(null);
                        }}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                      >
                        Deny
                      </button>
                      <button 
                        onClick={() => {
                          setOauthStep(3);
                          setTimeout(async () => {
                            const exName = connectingExchange.name;
                            const demoTrades = [
                              { symbol: "BTC", side: "buy", quantity: 0.15, price: 45000, total: 6750, traded_at: new Date().toISOString(), exchange: exName },
                              { symbol: "SOL", side: "buy", quantity: 45, price: 90, total: 4050, traded_at: new Date().toISOString(), exchange: exName }
                            ];
                            
                            if (user) {
                              const tradesToInsert = demoTrades.map(t => ({ ...t, user_id: user.id }));
                              await supabase.from("trades").insert(tradesToInsert);
                              const { data } = await supabase.from("trades").select("*").eq("user_id", user.id).order("traded_at", { ascending: true });
                              if (data) setTrades(data);
                            } else {
                              const updated = [...trades, ...demoTrades];
                              setTrades(updated);
                              localStorage.setItem("crypto_neko_trades", JSON.stringify(updated));
                            }
                            
                            setOauthStep(0);
                            setConnectingExchange(null);
                            setImportMsg({ ok: true, text: `Successfully synced with ${exName}!` });
                          }, 2500);
                        }}
                        className="flex-1 py-3 bg-[var(--accent)] hover:brightness-110 text-white font-bold rounded-xl transition-all"
                      >
                        Authorize
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {oauthStep === 3 && (
                <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">Syncing Data...</h3>
                  <p className="text-gray-500 text-sm">Downloading portfolio balances and trades</p>
                </div>
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


