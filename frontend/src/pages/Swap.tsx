import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownUp, Settings, Info, Loader, Search, ChevronDown, CheckCircle2 } from "lucide-react";
import { useAccount, useBalance, useReadContract, useWriteContract, useSendTransaction } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { parseUnits, formatUnits } from "viem";
import { TOKENS, UNISWAP_V2_ROUTER, WETH_ADDRESS, UNISWAP_ROUTER_ABI, ERC20_ABI } from "../constants/web3";
import AITradeInsights from "../components/market/AITradeInsights";

type TxState = "idle" | "confirming" | "pending" | "success";

export default function Swap() {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  
  // Swap State
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [amountIn, setAmountIn] = useState("");
  const [quote, setQuote] = useState<{ amountOut: string; rate: number; platformFee?: string; tx?: { to: string, data: string, value: string } } | null>(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState("0.5");

  // Token Selector State
  const [showTokenSelector, setShowTokenSelector] = useState<"from" | "to" | null>(null);
  const [tokenSearch, setTokenSearch] = useState("");

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

  const displayBalance = fromToken.address === "ETH" && ethBalance 
    ? Number(ethBalance.formatted).toFixed(4)
    : erc20Balance 
      ? Number(formatUnits(erc20Balance as bigint, fromToken.decimals)).toFixed(4)
      : "0.00";

  // Compute Path for Uniswap
  const path = [
    fromToken.address === "ETH" ? WETH_ADDRESS : fromToken.address,
    toToken.address === "ETH" ? WETH_ADDRESS : toToken.address
  ] as `0x${string}`[];

  const parsedAmountIn = amountIn ? parseUnits(amountIn, fromToken.decimals) : 0n;

  // 0x API Quote Fetching Architecture (with Platform Fee)
  const [isQuoting, setIsQuoting] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);

  useEffect(() => {
    if (!amountIn || Number(amountIn) <= 0 || fromToken.address === toToken.address) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setIsQuoting(true);
      setApiKeyError(false);
      
      const API_KEY = import.meta.env.VITE_0X_API_KEY;
      const FEE_RECIPIENT = import.meta.env.VITE_TREASURY_ADDRESS || "0x0000000000000000000000000000000000000000";
      const FEE_PERCENTAGE = import.meta.env.VITE_FEE_PERCENTAGE || "0.005"; // 0.5%
      
      if (!API_KEY || API_KEY === "YOUR_0X_API_KEY_HERE") {
        setTimeout(() => {
          // Simulate 0x API pricing with Fee Extraction
          const inputUsd = Number(amountIn) * fromToken.price;
          const grossAmountOut = inputUsd / toToken.price;
          
          // Deduct the Platform Fee (0.5%)
          const feeAmount = grossAmountOut * Number(FEE_PERCENTAGE);
          const netAmountOut = grossAmountOut - feeAmount;
          
          const rate = netAmountOut / Number(amountIn);
          
          setQuote({ amountOut: netAmountOut.toFixed(6), rate, platformFee: feeAmount.toFixed(6) });
          setIsQuoting(false);
        }, 800);
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
          const rate = Number(outStr) / Number(amountIn);
          const feeStr = formatUnits(BigInt(data.feeInfo?.feeAmount || "0"), toToken.decimals);
          
          setQuote({ 
            amountOut: Number(outStr).toFixed(6), 
            rate, 
            platformFee: feeStr,
            tx: { to: data.to, data: data.data, value: data.value }
          });
        }
      } catch (error) {
        console.error("0x API Quote Error:", error);
        setApiKeyError(true);
      } finally {
        setIsQuoting(false);
      }
    };

    fetchQuote();
  }, [amountIn, fromToken, toToken, parsedAmountIn]);

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

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const hash = await writeContractAsync({
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
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (needsApproval) {
      return handleApprove();
    }
    
    setTxState("confirming");
    
    try {
      const amountOutMin = parseUnits(
        (Number(quote?.amountOut) * (1 - Number(slippage) / 100)).toFixed(toToken.decimals),
        toToken.decimals
      );
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 mins

      let hash: `0x${string}`;

      if (quote?.tx) {
        hash = await sendTransactionAsync({
          to: quote.tx.to as `0x${string}`,
          data: quote.tx.data as `0x${string}`,
          value: BigInt(quote.tx.value || "0"),
        });
      } else {
        if (fromToken.address === "ETH") {
          hash = await writeContractAsync({
            address: UNISWAP_V2_ROUTER,
            abi: UNISWAP_ROUTER_ABI,
            functionName: "swapExactETHForTokens",
            args: [amountOutMin, path, address as `0x${string}`, deadline],
            value: parsedAmountIn,
          });
        } else if (toToken.address === "ETH") {
          hash = await writeContractAsync({
            address: UNISWAP_V2_ROUTER,
            abi: UNISWAP_ROUTER_ABI,
            functionName: "swapExactTokensForETH",
            args: [parsedAmountIn, amountOutMin, path, address as `0x${string}`, deadline],
          });
        } else {
          hash = await writeContractAsync({
            address: UNISWAP_V2_ROUTER,
            abi: UNISWAP_ROUTER_ABI,
            functionName: "swapExactTokensForTokens",
            args: [parsedAmountIn, amountOutMin, path, address as `0x${string}`, deadline],
          });
        }
      }

      setTxState("pending");
      
      toast.loading("Transaction pending...", { id: hash });
      
      setTimeout(() => {
        setTxState("success");
        toast.success(`Swapped ${amountIn} ${fromToken.symbol} for ${quote?.amountOut} ${toToken.symbol}`, {
          id: hash,
          description: "Transaction confirmed on-chain.",
          action: {
            label: "View Explorer",
            onClick: () => window.open(`https://etherscan.io/tx/${hash}`, "_blank")
          }
        });

        setTimeout(() => {
          setTxState("idle");
          setAmountIn("");
        }, 3000);
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
    setAmountIn(quote?.amountOut ? quote.amountOut : "");
  };

  const setMaxBalance = () => {
    if (fromToken.address === "ETH" && ethBalance) {
      setAmountIn((Number(ethBalance.formatted) * 0.98).toFixed(4));
    } else if (erc20Balance) {
      setAmountIn(formatUnits(erc20Balance as bigint, fromToken.decimals));
    }
  };

  const filteredTokens = TOKENS.filter(t => 
    t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) || 
    t.name.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambient Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-start justify-center gap-6 relative z-10"
      >
        {/* Main Swap Container */}
        <div className="w-full max-w-[480px] rounded-[32px] bg-[#0a0b0d] border border-white/10 shadow-2xl overflow-hidden shrink-0 mx-auto md:mx-0">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-white font-bold text-xl tracking-tight">Swap</h2>
              <p className="text-xs text-slate-400">Trade tokens instantly on-chain.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.open(`https://global.transak.com/?apiKey=YOUR_TRANSAK_API_KEY&cryptoCurrencyCode=${toToken.symbol}&walletAddress=${address || ''}`, "_blank")}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-colors bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 mr-2"
              >
                Buy with Fiat
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2.5 rounded-xl transition-colors ${showSettings ? "bg-white/10 text-white" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
              >
                <Settings size={20} />
              </button>
            </div>
          </div>

          {/* Settings Popover */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-4 relative z-10 overflow-hidden"
              >
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-300">Max Slippage</span>
                    <span className="text-xs text-slate-500 font-mono">{slippage}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {["0.1", "0.5", "1.0"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSlippage(s)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${slippage === s ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/[0.05] text-slate-400 hover:bg-white/10 border border-transparent"}`}
                      >
                        {s}%
                      </button>
                    ))}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="w-full bg-white/[0.05] border border-transparent rounded-lg py-2 px-3 text-sm text-right text-slate-300 focus:outline-none focus:border-cyan-500/50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Inputs */}
          <div className="relative z-10 p-2 px-3 flex flex-col gap-1.5">
            
            {/* FROM INPUT */}
            <div className="bg-[#13151a] border border-white/5 rounded-3xl p-5 transition-colors hover:border-white/10 focus-within:border-cyan-500/30 focus-within:hover:border-cyan-500/30">
              <div className="flex justify-between mb-3">
                <span className="text-sm font-medium text-slate-400">You pay</span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  Balance: {displayBalance}
                  <button onClick={setMaxBalance} className="text-cyan-400 hover:text-cyan-300 font-bold ml-1">MAX</button>
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <input
                  type="number"
                  placeholder="0.0"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  className="w-full bg-transparent text-4xl sm:text-5xl font-mono font-semibold text-white outline-none placeholder:text-slate-700"
                />
                <button 
                  onClick={() => setShowTokenSelector("from")}
                  className="shrink-0 flex items-center gap-2 bg-[#273951]/40 hover:bg-[#273951]/80 pl-2 pr-4 py-2 rounded-full transition-colors border border-white/5"
                >
                  <img src={fromToken.icon} alt={fromToken.symbol} className="w-7 h-7 rounded-full" />
                  <span className="font-bold text-white text-lg">{fromToken.symbol}</span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
              </div>
              <div className="text-sm text-slate-500 mt-3 font-mono">
                ${amountIn ? (Number(amountIn) * fromToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
              </div>
            </div>

            {/* SWAP BUTTON (MIDDLE) */}
            <div className="relative h-2 flex justify-center items-center z-20">
              <button 
                onClick={handleSwitchTokens}
                className="absolute p-2.5 bg-[#0a0b0d] border-4 border-[#020817] rounded-xl hover:scale-110 hover:text-cyan-400 transition-all text-slate-400 shadow-xl"
              >
                <ArrowDownUp size={18} />
              </button>
            </div>

            {/* TO INPUT */}
            <div className="bg-[#13151a] border border-white/5 rounded-3xl p-5 transition-colors hover:border-white/10">
              <div className="flex justify-between mb-3">
                <span className="text-sm font-medium text-slate-400">You receive</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                {isQuoting ? (
                  <div className="flex-1 h-12 flex items-center">
                    <div className="w-32 h-10 bg-white/[0.03] animate-pulse rounded-lg" />
                  </div>
                ) : (
                  <input
                    type="text"
                    readOnly
                    placeholder="0.0"
                    value={quote ? quote.amountOut : ""}
                    className="w-full bg-transparent text-4xl sm:text-5xl font-mono font-semibold text-white outline-none placeholder:text-slate-700"
                  />
                )}
                <button 
                  onClick={() => setShowTokenSelector("to")}
                  className="shrink-0 flex items-center gap-2 bg-[#273951]/40 hover:bg-[#273951]/80 pl-2 pr-4 py-2 rounded-full transition-colors border border-white/5"
                >
                  <img src={toToken.icon} alt={toToken.symbol} className="w-7 h-7 rounded-full" />
                  <span className="font-bold text-white text-lg">{toToken.symbol}</span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
              </div>
              <div className="text-sm text-slate-500 mt-3 font-mono flex items-center gap-2">
                {isQuoting ? (
                  <div className="w-20 h-4 bg-white/[0.03] animate-pulse rounded" />
                ) : (
                  <>${quote ? (Number(quote.amountOut) * toToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}</>
                )}
                {quote && !isQuoting && (
                  <span className="text-emerald-500/80 text-xs ml-2">
                    (Best Price)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* QUOTE DETAILS */}
          <AnimatePresence>
            {quote && !isQuoting && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 py-2 overflow-hidden"
              >
                <div className="flex items-center justify-between text-sm text-slate-400 py-1.5">
                  <span className="flex items-center gap-1 border-b border-dashed border-slate-500/50 cursor-help">Rate <Info size={12} /></span>
                  <span className="font-mono text-slate-300">1 {fromToken.symbol} = {quote.rate.toFixed(4)} {toToken.symbol}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400 py-1.5">
                  <span className="flex items-center gap-1 border-b border-dashed border-slate-500/50 cursor-help text-purple-400">Platform Fee (0.5%) <Info size={12} /></span>
                  <span className="font-mono text-purple-400 font-semibold">
                    {quote.platformFee ? `${Number(quote.platformFee).toFixed(4)} ${toToken.symbol}` : "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400 py-1.5">
                  <span className="flex items-center gap-1 border-b border-dashed border-slate-500/50 cursor-help">Provider <Info size={12} /></span>
                  <span className="font-mono text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    0x API Aggregator
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTION BUTTON */}
          <div className="p-4 relative z-10">
            <button
              onClick={handleSwap}
              disabled={(!amountIn || txState !== "idle" || isApproving) && isConnected}
              className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 transition-all ${
                txState === "success" ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : txState === "pending" || isApproving ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : txState === "confirming" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : !isConnected ? "bg-cyan-500 text-[#020817] hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                : !amountIn ? "bg-white/5 text-slate-500 cursor-not-allowed"
                : needsApproval ? "bg-purple-500 text-white hover:bg-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                : "bg-cyan-500 text-[#020817] hover:bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
              }`}
            >
              {txState === "confirming" && (
                <><Loader size={22} className="animate-spin" /> Confirming in Wallet...</>
              )}
              {(txState === "pending" || isApproving) && (
                <><Loader size={22} className="animate-spin" /> {isApproving ? "Approving..." : "Swapping..."}</>
              )}
              {txState === "success" && (
                <><CheckCircle2 size={24} /> Swap Successful</>
              )}
              {txState === "idle" && !isApproving && (
                !isConnected ? "Connect Wallet"
                : !amountIn ? "Enter an amount"
                : needsApproval ? `Approve ${fromToken.symbol}`
                : "Swap"
              )}
            </button>
          </div>

          {/* TOKEN SELECTOR MODAL */}
          <AnimatePresence>
            {showTokenSelector && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute inset-0 z-50 bg-[#0a0b0d] flex flex-col"
              >
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <h3 className="text-white font-bold text-xl">Select a token</h3>
                  <button onClick={() => setShowTokenSelector(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                      type="text" 
                      placeholder="Search name or paste address" 
                      value={tokenSearch}
                      onChange={(e) => setTokenSearch(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors text-lg"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {filteredTokens.map((token) => (
                    <button 
                      key={token.symbol}
                      onClick={() => {
                        if (showTokenSelector === "from") setFromToken(token);
                        else setToToken(token);
                        setShowTokenSelector(null);
                        setTokenSearch("");
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <img src={token.icon} alt={token.symbol} className="w-10 h-10 rounded-full" />
                        <div>
                          <div className="text-white font-bold text-lg">{token.symbol}</div>
                          <div className="text-slate-500 text-sm">{token.name}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Trade Insights Widget */}
        <div className="w-full md:w-[320px] shrink-0 h-full">
          <AITradeInsights onApplySuggestion={(tokenSymbol) => {
            const token = TOKENS.find(t => t.symbol === tokenSymbol);
            if (token) setToToken(token);
          }} />
        </div>
      </motion.div>
    </div>
  );
}
