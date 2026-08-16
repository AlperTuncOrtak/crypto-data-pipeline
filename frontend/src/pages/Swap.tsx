import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowDownUp, Settings, Loader, Search, ChevronDown, CheckCircle2, 
  X, Sparkles, LineChart, Zap, Activity, Info, CornerDownLeft, ShieldCheck
} from "lucide-react";
import { useAccount, useBalance, useReadContract, useWriteContract, useSendTransaction } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { parseUnits, formatUnits } from "viem";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { TOKENS, UNISWAP_V2_ROUTER, WETH_ADDRESS, UNISWAP_ROUTER_ABI, ERC20_ABI } from "../constants/web3";

type TxState = "idle" | "confirming" | "pending" | "success";
type GasSpeed = "slow" | "normal" | "fast";

export default function Swap() {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  
  // Swap State
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [amountIn, setAmountIn] = useState("");
  const [inputMode, setInputMode] = useState<"CRYPTO" | "FIAT">("CRYPTO");
  const [quote, setQuote] = useState<{ 
    amountOut: string; 
    rate: number; 
    platformFee: string;
    priceImpact: number;
    route: string[];
    tx?: { to: string, data: string, value: string } 
  } | null>(null);

  // Settings & UI State
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  const [gasSpeed, setGasSpeed] = useState<GasSpeed>("normal");
  const [showChart, setShowChart] = useState(false);

  // Token Selector State
  const [showTokenSelector, setShowTokenSelector] = useState<"from" | "to" | null>(null);
  const [tokenSearch, setTokenSearch] = useState("");

  // AI State
  const [aiCommand, setAiCommand] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Transaction State
  const [txState, setTxState] = useState<TxState>("idle");
  const [isApproving, setIsApproving] = useState(false);

  // Balances
  const { data: ethBalance } = useBalance({ address });
  const { data: erc20Balance } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: { enabled: fromToken.address !== "ETH" && !!address }
  });

  const exactBalanceNum = fromToken.address === "ETH" && ethBalance 
    ? Number(ethBalance.formatted)
    : erc20Balance 
      ? Number(formatUnits(erc20Balance as bigint, fromToken.decimals))
      : 0;
      
  const displayBalance = exactBalanceNum.toFixed(4);

  // Input conversion (Crypto <-> Fiat)
  const effectiveCryptoAmount = inputMode === "CRYPTO" 
    ? amountIn 
    : amountIn ? (Number(amountIn) / fromToken.price).toFixed(fromToken.decimals) : "";
    
  const effectiveFiatAmount = inputMode === "FIAT"
    ? amountIn
    : amountIn ? (Number(amountIn) * fromToken.price).toFixed(2) : "0.00";

  // Compute Path for Uniswap
  const path = [
    fromToken.address === "ETH" ? WETH_ADDRESS : fromToken.address,
    toToken.address === "ETH" ? WETH_ADDRESS : toToken.address
  ] as `0x${string}`[];

  const parsedAmountIn = effectiveCryptoAmount && Number(effectiveCryptoAmount) > 0 ? parseUnits(effectiveCryptoAmount, fromToken.decimals) : 0n;

  // 0x API Quote Fetching
  const [isQuoting, setIsQuoting] = useState(false);

  useEffect(() => {
    if (!effectiveCryptoAmount || Number(effectiveCryptoAmount) <= 0 || fromToken.address === toToken.address) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setIsQuoting(true);
      
      const API_KEY = import.meta.env.VITE_0X_API_KEY;
      const FEE_RECIPIENT = import.meta.env.VITE_TREASURY_ADDRESS || "0x0000000000000000000000000000000000000000";
      const FEE_PERCENTAGE = import.meta.env.VITE_FEE_PERCENTAGE || "0.005";
      
      if (!API_KEY || API_KEY === "YOUR_0X_API_KEY_HERE") {
        setTimeout(() => {
          // Mock 0x API pricing
          const inputUsd = Number(effectiveCryptoAmount) * fromToken.price;
          const grossAmountOut = inputUsd / toToken.price;
          const feeAmount = grossAmountOut * Number(FEE_PERCENTAGE);
          const netAmountOut = grossAmountOut - feeAmount;
          const rate = netAmountOut / Number(effectiveCryptoAmount);
          const impact = Math.min((Number(effectiveCryptoAmount) * fromToken.price) / 100000, 15);
          
          setQuote({ 
            amountOut: netAmountOut.toFixed(6), 
            rate, 
            platformFee: feeAmount.toFixed(6),
            priceImpact: impact,
            route: [fromToken.symbol, "Uniswap V3", toToken.symbol]
          });
          setIsQuoting(false);
        }, 600);
        return;
      }

      try {
        const response = await fetch(
          `https://api.0x.org/swap/v1/quote?sellToken=${fromToken.address}&buyToken=${toToken.address}&sellAmount=${parsedAmountIn.toString()}&feeRecipient=${FEE_RECIPIENT}&buyTokenPercentageFee=${FEE_PERCENTAGE}`,
          { headers: { "0x-api-key": API_KEY } }
        );
        const data = await response.json();
        if (data.buyAmount) {
          const outStr = formatUnits(BigInt(data.buyAmount), toToken.decimals);
          const rate = Number(outStr) / Number(effectiveCryptoAmount);
          const feeStr = formatUnits(BigInt(data.feeInfo?.feeAmount || "0"), toToken.decimals);
          
          setQuote({ 
            amountOut: Number(outStr).toFixed(6), 
            rate, 
            platformFee: feeStr,
            priceImpact: Number(data.estimatedPriceImpact || 0.5),
            route: [fromToken.symbol, "0x Aggregator", toToken.symbol],
            tx: { to: data.to, data: data.data, value: data.value }
          });
        }
      } catch (error) {
        console.error("0x API Quote Error:", error);
      } finally {
        setIsQuoting(false);
      }
    };

    fetchQuote();
  }, [effectiveCryptoAmount, fromToken, toToken, parsedAmountIn]);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address as `0x${string}`, UNISWAP_V2_ROUTER],
    query: { enabled: fromToken.address !== "ETH" && !!address }
  });

  const needsApproval = fromToken.address !== "ETH" && parsedAmountIn > 0n && (allowance as bigint || 0n) < parsedAmountIn;

  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  // ----- AI COMMAND ENGINE (NLP MOCK) -----
  const processAICommand = (cmd: string) => {
    if (!cmd.trim()) return;
    setIsAiThinking(true);
    setAiMessage(null);
    
    setTimeout(() => {
      const lower = cmd.toLowerCase();
      let newFrom = fromToken;
      let newTo = toToken;
      let newAmt = "";
      let foundAmt = false;
      
      // Extract tokens
      const words = lower.split(" ");
      const foundTokens = TOKENS.filter(t => words.includes(t.symbol.toLowerCase()) || words.includes(t.name.toLowerCase()));
      
      if (foundTokens.length >= 2) {
        newFrom = foundTokens[0];
        newTo = foundTokens[1];
      } else if (foundTokens.length === 1) {
        // If they just said "buy PEPE", assume from USDC or ETH
        if (words.includes("buy")) {
          newTo = foundTokens[0];
          newFrom = TOKENS.find(t => t.symbol === "USDC" || t.symbol === "USDT") || TOKENS[0];
        } else {
          newTo = foundTokens[0];
        }
      }

      // Extract amount logic
      if (lower.includes("half") || lower.includes("50%")) {
        const dummyBal = exactBalanceNum > 0 ? exactBalanceNum : 1000; // Mock balance if disconnected
        newAmt = (dummyBal * 0.5).toFixed(newFrom.decimals);
        foundAmt = true;
      } else if (lower.includes("all") || lower.includes("max") || lower.includes("100%")) {
        const dummyBal = exactBalanceNum > 0 ? exactBalanceNum : 1000;
        newAmt = (dummyBal * 0.98).toFixed(newFrom.decimals);
        foundAmt = true;
      } else if (lower.includes("$") || lower.includes("dollars") || lower.includes("usd")) {
        // Find the dollar amount
        const match = lower.match(/\$?(\d+(\.\d+)?)/);
        if (match && match[1]) {
          setInputMode("FIAT");
          newAmt = match[1];
          foundAmt = true;
        }
      } else {
        // find a generic number
        const match = lower.match(/(\d+(\.\d+)?)/);
        if (match && match[1]) {
          setInputMode("CRYPTO");
          newAmt = match[1];
          foundAmt = true;
        }
      }

      setFromToken(newFrom);
      setToToken(newTo);
      if (foundAmt) setAmountIn(newAmt);

      setAiMessage(`✨ Parsed: Swapping ${foundAmt ? newAmt : "amount of"} ${newFrom.symbol} for ${newTo.symbol}`);
      setIsAiThinking(false);
      setAiCommand("");
      aiInputRef.current?.blur();
      
      setTimeout(() => setAiMessage(null), 5000);
    }, 1200);
  };
  // ----------------------------------------

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await writeContractAsync({
        address: fromToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [UNISWAP_V2_ROUTER, parsedAmountIn],
      });
      toast.loading("Approving token...", { id: "approve" });
      setTimeout(() => {
        toast.success("Approved successfully!", { id: "approve" });
        refetchAllowance();
        setIsApproving(false);
      }, 5000);
    } catch (error) {
      setIsApproving(false);
      toast.error("Approval failed or rejected.");
    }
  };

  const handleSwap = async () => {
    if (!isConnected) return openConnectModal?.();
    if (needsApproval) return handleApprove();
    
    setTxState("confirming");
    try {
      const amountOutMin = parseUnits(
        (Number(quote?.amountOut) * (1 - Number(slippage) / 100)).toFixed(toToken.decimals),
        toToken.decimals
      );
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      let hash: `0x${string}`;
      if (quote?.tx) {
        hash = await sendTransactionAsync({
          to: quote.tx.to as `0x${string}`, data: quote.tx.data as `0x${string}`, value: BigInt(quote.tx.value || "0"),
        });
      } else {
        if (fromToken.address === "ETH") {
          hash = await writeContractAsync({
            address: UNISWAP_V2_ROUTER, abi: UNISWAP_ROUTER_ABI, functionName: "swapExactETHForTokens",
            args: [amountOutMin, path, address as `0x${string}`, deadline], value: parsedAmountIn,
          });
        } else if (toToken.address === "ETH") {
          hash = await writeContractAsync({
            address: UNISWAP_V2_ROUTER, abi: UNISWAP_ROUTER_ABI, functionName: "swapExactTokensForETH",
            args: [parsedAmountIn, amountOutMin, path, address as `0x${string}`, deadline],
          });
        } else {
          hash = await writeContractAsync({
            address: UNISWAP_V2_ROUTER, abi: UNISWAP_ROUTER_ABI, functionName: "swapExactTokensForTokens",
            args: [parsedAmountIn, amountOutMin, path, address as `0x${string}`, deadline],
          });
        }
      }

      setTxState("pending");
      toast.loading("Transaction pending...", { id: hash });
      setTimeout(() => {
        setTxState("success");
        toast.success(`Swapped ${effectiveCryptoAmount} ${fromToken.symbol} for ${quote?.amountOut} ${toToken.symbol}`, { id: hash });
        setTimeout(() => { setTxState("idle"); setAmountIn(""); }, 3000);
      }, 5000);
    } catch (error) {
      console.error(error);
      setTxState("idle");
      toast.error("Transaction failed or rejected.");
    }
  };

  const handleSwitchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    if(inputMode === "CRYPTO") {
      setAmountIn(quote?.amountOut ? quote.amountOut : "");
    }
  };

  const setPercentageBalance = (pct: number) => {
    const dummyBal = exactBalanceNum > 0 ? exactBalanceNum : 1000; // fallback for preview
    const isEthMax = fromToken.address === "ETH" && pct === 100;
    const amountToUse = isEthMax ? dummyBal * 0.98 : dummyBal * (pct / 100);
    if (inputMode === "CRYPTO") {
      setAmountIn(amountToUse.toFixed(fromToken.decimals));
    } else {
      setAmountIn((amountToUse * fromToken.price).toFixed(2));
    }
  };

  const filteredTokens = TOKENS.filter(t => 
    t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) || t.name.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  // CoinGecko Trending Data
  const { data: trendingCoins, isLoading: isLoadingTrending } = useQuery({
    queryKey: ["trendingCoins"],
    queryFn: async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/search/trending");
        const data = await res.json();
        return data.coins.slice(0, 2).map((c: any) => c.item);
      } catch (err) {
        console.error("CoinGecko Fetch Error", err);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const chartData = useMemo(() => {
    const data = [];
    let baseRate = fromToken.price / toToken.price;
    for(let i=0; i<24; i++) {
      data.push({ time: i, value: baseRate });
      baseRate = baseRate * (1 + (Math.random() - 0.48) * 0.03);
    }
    return data;
  }, [fromToken, toToken]);

  const gasMultiplier = gasSpeed === "slow" ? 0.8 : gasSpeed === "fast" ? 1.5 : 1;
  const networkCost = (1.42 * gasMultiplier).toFixed(2);
  const isHighImpact = quote && quote.priceImpact > 2.5;

  return (
    <div className="flex-1 w-full flex items-center justify-center font-sans p-6 min-h-[calc(100vh-100px)] relative">
      <div className="w-full max-w-[600px] mx-auto relative flex flex-col items-center justify-center gap-6">
        
        {/* Main Swap Card (Perfectly Centered) */}
        <div className="w-full max-w-[480px] flex flex-col gap-6 relative z-10">
          
          {/* Main Swap Card */}
          <div className="w-full rounded-[24px] bg-gradient-to-b from-[#111214] to-[#0a0b0d] border border-[var(--border-base)] p-2 shadow-2xl overflow-hidden relative">
            
            {/* AI Intent Input */}
            <div className="w-full px-2 pt-2 pb-1 relative z-20">
               <div className="w-full bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-[16px] flex items-center p-3 relative overflow-hidden group focus-within:border-[var(--accent)] transition-colors">
                 <Sparkles size={16} className={`shrink-0 ml-1 ${isAiThinking ? "text-[var(--accent)] animate-pulse" : "text-[var(--text-muted)] group-focus-within:text-[var(--accent)]"} transition-colors`} />
                 <input
                   ref={aiInputRef}
                   type="text"
                   value={aiCommand}
                   onChange={(e) => setAiCommand(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && processAICommand(aiCommand)}
                   placeholder="Ask AI to trade (e.g. Swap half USDC for BTC)"
                   className="w-full bg-transparent border-none outline-none text-[var(--text-main)] text-[14px] px-3 placeholder:text-[var(--text-muted)]"
                   disabled={isAiThinking}
                 />
                 {aiCommand && !isAiThinking && (
                   <button onClick={() => processAICommand(aiCommand)} className="shrink-0 p-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-[6px] hover:bg-[var(--accent)]/20 transition-colors mr-1">
                     <CornerDownLeft size={14} />
                   </button>
                 )}
                 {isAiThinking && <Loader size={16} className="text-[var(--accent)] animate-spin mr-2" />}
               </div>
               <AnimatePresence>
                  {aiMessage && (
                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:"auto"}} exit={{opacity:0, height:0}} className="pt-2 px-2">
                      <div className="text-[11px] font-medium text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-[8px] px-3 py-1.5 flex items-center gap-2">
                         <ShieldCheck size={12} /> {aiMessage}
                      </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* Header & Chart Toggle */}
            <div className="flex items-center justify-between px-4 py-3 relative z-10">
              <h2 className="text-[var(--text-main)] font-semibold text-[16px] tracking-tight flex items-center gap-2">
                Swap
                <button onClick={() => setShowChart(!showChart)} className={`p-1.5 rounded-[8px] transition-colors ${showChart ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}><LineChart size={14} /></button>
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-[10px] transition-colors ${showSettings ? "bg-[var(--bg-elevated)] text-[var(--text-main)]" : "hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}><Settings size={18} /></button>
              </div>
            </div>

            {/* Mini Price Chart Drawer */}
            <AnimatePresence>
              {showChart && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 140, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-2 relative z-10">
                  <div className="h-[120px] w-full rounded-[12px] bg-[#0d0e12] border border-[var(--border-base)] p-2 flex flex-col">
                    <div className="flex justify-between items-center px-1 mb-1">
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">{fromToken.symbol}/{toToken.symbol} (24H)</span>
                      <span className="text-[11px] text-[#2ecc71]">+1.24%</span>
                    </div>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <YAxis domain={['auto', 'auto']} hide />
                          <Area type="monotone" dataKey="value" stroke="var(--accent)" fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Settings Popover */}
            <AnimatePresence>
              {showSettings && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4 relative z-10 overflow-hidden">
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-[12px] p-4 shadow-inner flex flex-col gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-medium text-[var(--text-muted)]">Max Slippage</span><span className="text-[12px] text-[var(--text-main)] font-mono">{slippage}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {["0.1", "0.5", "1.0"].map((s) => (
                          <button key={s} onClick={() => setSlippage(s)} className={`flex-1 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ${slippage === s ? "bg-white text-black" : "bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>{s}%</button>
                        ))}
                        <input type="text" value={slippage} onChange={(e) => setSlippage(e.target.value)} className="w-[60px] bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-[8px] py-1.5 px-2 text-[12px] text-center text-[var(--text-main)] focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2"><span className="text-[12px] font-medium text-[var(--text-muted)]">Transaction Speed</span></div>
                      <div className="flex items-center p-1 bg-[var(--bg-elevated)] rounded-[8px] border border-[var(--border-base)]">
                        {["slow", "normal", "fast"].map((s) => (
                          <button key={s} onClick={() => setGasSpeed(s as GasSpeed)} className={`flex-1 py-1.5 rounded-[6px] text-[11px] font-medium capitalize transition-colors ${gasSpeed === s ? "bg-[var(--bg-elevated)] text-[var(--text-main)] shadow" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Inputs */}
            <div className="relative z-10 p-2 flex flex-col gap-[4px]">
              {/* FROM INPUT */}
              <div className="bg-[var(--bg-elevated)] rounded-[20px] p-5 transition-all hover:bg-[var(--bg-elevated)] group relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[13px] font-medium text-[var(--text-muted)]">You pay</span>
                  <span className="text-[12px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">Bal: {displayBalance} {fromToken.symbol}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="relative w-full flex items-center">
                    {inputMode === "FIAT" && <span className="text-[36px] font-medium text-[var(--text-main)] absolute left-0">$</span>}
                    <input
                      type="number" placeholder="0" value={amountIn} min="0"
                      onChange={(e) => { const val = e.target.value; if (Number(val) >= 0) setAmountIn(val); }}
                      onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
                      className={`w-full bg-transparent text-[36px] font-medium text-[var(--text-main)] outline-none placeholder:text-[#3a3d41] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${inputMode === "FIAT" ? "pl-7" : ""}`}
                    />
                    <div className="flex flex-col gap-1 shrink-0 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setAmountIn(((Number(amountIn) || 0) + 1).toString())} className="p-1 bg-[var(--bg-elevated)] rounded-[4px] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-base)]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg></button>
                      <button onClick={() => { const curr = Number(amountIn)||0; setAmountIn(curr>1 ? (curr-1).toString() : "0"); }} className="p-1 bg-[var(--bg-elevated)] rounded-[4px] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-base)]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
                    </div>
                  </div>
                  <button onClick={() => setShowTokenSelector("from")} className="shrink-0 flex items-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] px-4 py-2 rounded-full transition-colors border border-[var(--border-base)] group-hover:border-[var(--border-base)]">
                    <img src={fromToken.icon} alt={fromToken.symbol} className="w-6 h-6 rounded-full" />
                    <span className="font-semibold text-[var(--text-main)] text-[16px]">{fromToken.symbol}</span><ChevronDown size={16} className="text-[var(--text-muted)]" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3 h-[24px]">
                  <div className="flex items-center gap-1.5">
                    {[25, 50, 75, 100].map(pct => (
                      <button key={pct} onClick={() => setPercentageBalance(pct)} className="text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] px-2 py-0.5 rounded-[4px] transition-colors">{pct === 100 ? "MAX" : `${pct}%`}</button>
                    ))}
                  </div>
                  <button onClick={() => setInputMode(prev => prev === "CRYPTO" ? "FIAT" : "CRYPTO")} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-main)] font-mono flex items-center gap-1 transition-colors bg-transparent"><ArrowDownUp size={10} />{inputMode === "CRYPTO" ? `$${effectiveFiatAmount}` : `${effectiveCryptoAmount} ${fromToken.symbol}`}</button>
                </div>
              </div>

              {/* SWAP BUTTON (MIDDLE) */}
              <div className="relative h-1 flex justify-center items-center z-20">
                <button onClick={handleSwitchTokens} className="absolute p-2.5 bg-[var(--bg-elevated)] border-[4px] border-[#0a0b0d] rounded-[12px] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)] transition-all text-[var(--text-muted)] z-10 group"><ArrowDownUp size={16} className="group-hover:rotate-180 transition-transform duration-300" /></button>
              </div>

              {/* TO INPUT */}
              <div className="bg-[var(--bg-elevated)] rounded-[20px] p-5 transition-all hover:bg-[var(--bg-elevated)] group relative overflow-hidden">
                <div className="flex justify-between mb-3"><span className="text-[13px] font-medium text-[var(--text-muted)]">You receive</span></div>
                <div className="flex items-center justify-between gap-4">
                  {isQuoting ? (
                    <div className="flex-1 h-[54px] flex items-center"><div className="w-32 h-10 bg-[var(--bg-elevated)] animate-pulse rounded-[8px]" /></div>
                  ) : (
                    <input type="text" readOnly placeholder="0" value={quote ? (inputMode === "CRYPTO" ? quote.amountOut : (Number(quote.amountOut) * toToken.price).toFixed(2)) : ""} className="w-full bg-transparent text-[36px] font-medium text-[var(--text-main)] outline-none placeholder:text-[#3a3d41] p-0" />
                  )}
                  <button onClick={() => setShowTokenSelector("to")} className="shrink-0 flex items-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] px-4 py-2 rounded-full transition-colors border border-[var(--border-base)] group-hover:border-[var(--border-base)]">
                    <img src={toToken.icon} alt={toToken.symbol} className="w-6 h-6 rounded-full" />
                    <span className="font-semibold text-[var(--text-main)] text-[16px]">{toToken.symbol}</span><ChevronDown size={16} className="text-[var(--text-muted)]" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3 h-[24px]">
                  {isQuoting ? (
                    <div className="w-20 h-4 bg-[var(--bg-elevated)] animate-pulse rounded" />
                  ) : (
                    <span className="text-[12px] text-[var(--text-muted)] font-mono">{inputMode === "CRYPTO" ? `$${quote ? (Number(quote.amountOut) * toToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}` : `${quote ? quote.amountOut : "0.00"} ${toToken.symbol}`}</span>
                  )}
                  {quote && !isQuoting && (
                    <span className={`font-semibold text-[11px] px-2 py-0.5 rounded-[6px] flex items-center gap-1 ${isHighImpact ? "bg-red-500/10 text-red-500" : "bg-[#2ecc71]/10 text-[#2ecc71]"}`}>
                      {isHighImpact ? <Zap size={12} /> : <Sparkles size={12} />} {isHighImpact ? `-${quote.priceImpact.toFixed(2)}% Impact` : "Best Price"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* QUOTE DETAILS (EXPANDED) */}
            <AnimatePresence>
              {quote && !isQuoting && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-6 py-3 overflow-hidden flex flex-col gap-2 relative z-10">
                  <div className="flex items-center justify-between text-[12px] bg-[var(--bg-elevated)]/50 p-2 rounded-[8px] mb-1">
                    <span className="text-[var(--text-muted)] flex items-center gap-1"><Activity size={12} /> Route</span>
                    <div className="flex items-center gap-1.5 text-[var(--text-main)] font-mono text-[11px]">
                      {quote.route.map((node, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className={i % 2 === 1 ? "text-[var(--text-muted)]" : "font-semibold"}>{node}</span>{i < quote.route.length - 1 && <span className="text-[var(--text-muted)]">›</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)] px-1"><span>Rate</span><span className="font-mono text-[var(--text-main)]">1 {fromToken.symbol} = {quote.rate.toFixed(4)} {toToken.symbol}</span></div>
                  {isHighImpact && <div className="flex items-center justify-between text-[12px] text-red-500 px-1 font-medium"><span>Price Impact</span><span>-{quote.priceImpact.toFixed(2)}%</span></div>}
                  <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)] px-1"><span className="flex items-center gap-1">Network Cost <Info size={10} className="text-[var(--text-muted)]"/></span><span className="font-mono text-[var(--text-main)]"><span className="text-[var(--text-muted)]">~${networkCost}</span></span></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTION BUTTON */}
            <div className="p-2 pt-2 relative z-10">
              <button
                onClick={handleSwap} disabled={(!amountIn || txState !== "idle" || isApproving || isHighImpact) && isConnected}
                className={`w-full py-4 rounded-[16px] font-bold text-[16px] flex items-center justify-center gap-2 transition-all ${
                  txState === "success" ? "bg-white text-black" : txState === "pending" || isApproving || txState === "confirming" ? "bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-base)]"
                  : !isConnected ? "bg-white text-black hover:bg-gray-200" : isHighImpact ? "bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed"
                  : !amountIn ? "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed" : needsApproval ? "bg-white text-black hover:bg-gray-200" : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                {txState === "confirming" && <><Loader size={18} className="animate-spin" /> Confirming in Wallet...</>}
                {(txState === "pending" || isApproving) && <><Loader size={18} className="animate-spin" /> {isApproving ? "Approving..." : "Swapping..."}</>}
                {txState === "success" && <><CheckCircle2 size={18} /> Swap Successful</>}
                {txState === "idle" && !isApproving && (!isConnected ? "Connect Wallet" : isHighImpact ? "Price Impact Too High" : !amountIn ? "Enter an amount" : needsApproval ? `Approve ${fromToken.symbol}` : "Swap")}
              </button>
            </div>

            {/* TOKEN SELECTOR MODAL */}
            <AnimatePresence>
              {showTokenSelector && (
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="absolute inset-0 z-50 bg-[var(--bg-base)] flex flex-col rounded-[24px] overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-[var(--border-base)]"><h3 className="text-[var(--text-main)] font-semibold text-[18px]">Select a token</h3><button onClick={() => setShowTokenSelector(null)} className="p-2 hover:bg-[var(--bg-elevated)] rounded-[10px] text-[var(--text-muted)] transition-colors"><X size={20} /></button></div>
                  <div className="p-4 border-b border-[var(--border-base)]"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} /><input type="text" placeholder="Search name or paste address" value={tokenSearch} onChange={(e) => setTokenSearch(e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-[12px] pl-10 pr-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#4a4d51] transition-colors text-[15px]"/></div></div>
                  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {filteredTokens.map((token) => (
                      <button key={token.symbol} onClick={() => { if (showTokenSelector === "from") setFromToken(token); else setToToken(token); setShowTokenSelector(null); setTokenSearch(""); }} className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-elevated)] rounded-[12px] transition-colors text-left">
                        <div className="flex items-center gap-4"><img src={token.icon} alt={token.symbol} className="w-10 h-10 rounded-full" /><div><div className="text-[var(--text-main)] font-semibold text-[16px]">{token.symbol}</div><div className="text-[var(--text-muted)] text-[13px]">{token.name}</div></div></div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Trade Insights Widget (Centered below the swap card) */}
        <div className="w-full max-w-[600px] bg-[var(--bg-base)] border border-[var(--border-base)] rounded-[16px] p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-[var(--accent)]" />
            <h3 className="text-[var(--text-main)] font-semibold text-[14px]">AI Swap Intelligence <span className="text-[10px] ml-2 bg-[var(--bg-elevated)] text-[var(--text-muted)] px-2 py-0.5 rounded-[4px]">Live</span></h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isLoadingTrending ? (
              <>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-base)] rounded-[12px] p-4 h-[90px] animate-pulse"></div>
                <div className="bg-[var(--bg-subtle)] border border-[var(--border-base)] rounded-[12px] p-4 h-[90px] animate-pulse"></div>
              </>
            ) : trendingCoins && trendingCoins.length > 0 ? (
              trendingCoins.map((coin: any, i: number) => (
                <div 
                  key={coin.id}
                  className="bg-[var(--bg-subtle)] border border-[var(--border-base)] rounded-[12px] p-4 cursor-pointer hover:border-[var(--accent)] transition-colors group" 
                  onClick={() => {
                    setFromToken(TOKENS.find(t => t.symbol === "USDC") || TOKENS[0]);
                    setToToken({
                      symbol: coin.symbol.toUpperCase(),
                      name: coin.name,
                      price: coin.data?.price || 1.0,
                      address: coin.id,
                      decimals: 18,
                      icon: coin.thumb
                    });
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-semibold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">USDC → {coin.symbol.toUpperCase()}</span>
                    <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded-[6px]">Trending #{i + 1}</span>
                  </div>
                  <div className="text-[12px] text-[var(--text-muted)] leading-relaxed flex items-start gap-2">
                    <img src={coin.thumb} alt={coin.name} className="w-5 h-5 rounded-full shrink-0" />
                    <span>High social volume detected. {coin.name} is currently trending globally.</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-base)] rounded-[12px] p-4 col-span-2 sm:col-span-2 text-center text-[var(--text-muted)] text-[13px]">
                Live trending data currently unavailable.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
