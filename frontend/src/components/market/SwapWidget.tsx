import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownUp, Settings, Info, Loader, Search, ChevronDown, CheckCircle2 } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import NumberFlow from "@number-flow/react";

const TOKENS = [
  { symbol: "ETH", name: "Ethereum", price: 3450.2, icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029" },
  { symbol: "USDT", name: "Tether", price: 1.0, icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=029" },
  { symbol: "USDC", name: "USD Coin", price: 1.0, icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029" },
  { symbol: "PEPE", name: "Pepe", price: 0.000012, icon: "https://cryptologos.cc/logos/pepe-pepe-logo.svg?v=029" },
  { symbol: "SOL", name: "Solana", price: 145.6, icon: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=029" },
  { symbol: "LINK", name: "Chainlink", price: 14.2, icon: "https://cryptologos.cc/logos/chainlink-link-logo.svg?v=029" },
];

type TxState = "idle" | "confirming" | "pending" | "success";

export default function SwapWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: ethBalance } = useBalance({ address });

  // Swap State
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [amountIn, setAmountIn] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [quote, setQuote] = useState<{ amountOut: number; rate: number; gas: number } | null>(null);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState("0.5");

  // Token Selector State
  const [showTokenSelector, setShowTokenSelector] = useState<"from" | "to" | null>(null);
  const [tokenSearch, setTokenSearch] = useState("");

  // Transaction State
  const [txState, setTxState] = useState<TxState>("idle");

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-swap", handleOpen);
    return () => window.removeEventListener("open-swap", handleOpen);
  }, []);

  useEffect(() => {
    if (!amountIn || Number(amountIn) <= 0) {
      setQuote(null);
      return;
    }
    setIsQuoting(true);
    const timeout = setTimeout(() => {
      const inputUsd = Number(amountIn) * fromToken.price;
      const amountOutRaw = inputUsd / toToken.price;
      const amountOut = amountOutRaw * (1 - Number(slippage) / 100);
      const rate = amountOut / Number(amountIn);
      const gas = Math.random() * 5 + 2; 

      setQuote({ amountOut, rate, gas });
      setIsQuoting(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [amountIn, fromToken, toToken, slippage]);

  const handleSwap = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    
    setTxState("confirming");
    
    // Simulate wallet confirmation delay
    setTimeout(() => {
      setTxState("pending");
      
      // Simulate blockchain pending delay
      setTimeout(() => {
        setTxState("success");
        toast.success(`Swapped ${amountIn} ${fromToken.symbol} for ${quote?.amountOut.toFixed(4)} ${toToken.symbol}`, {
          description: "Transaction confirmed on-chain.",
          action: {
            label: "View Explorer",
            onClick: () => window.open("https://etherscan.io", "_blank")
          }
        });

        setTimeout(() => {
          setTxState("idle");
          setAmountIn("");
        }, 3000);
      }, 4000);
    }, 2000);
  };

  const handleSwitchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmountIn(quote?.amountOut ? quote.amountOut.toFixed(6) : "");
  };

  const setMaxBalance = () => {
    if (fromToken.symbol === "ETH" && ethBalance) {
      setAmountIn((Number(ethBalance.formatted) * 0.98).toFixed(4));
    }
  };

  const filteredTokens = TOKENS.filter(t => 
    t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) || 
    t.name.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-[#020817]/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[420px] rounded-3xl bg-[#0a0b0d] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-white font-bold text-lg tracking-tight">Swap</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-xl transition-colors ${showSettings ? "bg-white/10 text-white" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                >
                  <Settings size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
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
                  className="px-5 pb-3 relative z-10"
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
                          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${slippage === s ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/[0.05] text-slate-400 hover:bg-white/10 border border-transparent"}`}
                        >
                          {s}%
                        </button>
                      ))}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={slippage}
                          onChange={(e) => setSlippage(e.target.value)}
                          className="w-full bg-white/[0.05] border border-transparent rounded-lg py-1.5 px-3 text-sm text-right text-slate-300 focus:outline-none focus:border-cyan-500/50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Inputs */}
            <div className="relative z-10 p-2 flex flex-col gap-1">
              
              {/* FROM INPUT */}
              <div className="bg-[#13151a] border border-white/5 rounded-3xl p-4 transition-colors focus-within:border-cyan-500/30">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-400">You pay</span>
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    Balance: {fromToken.symbol === "ETH" && ethBalance ? Number(ethBalance.formatted).toFixed(4) : "0.00"}
                    <button onClick={setMaxBalance} className="text-cyan-400 hover:text-cyan-300 font-bold ml-1">MAX</button>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    className="w-full bg-transparent text-4xl font-mono font-semibold text-white outline-none placeholder:text-slate-700"
                  />
                  <button 
                    onClick={() => setShowTokenSelector("from")}
                    className="shrink-0 flex items-center gap-2 bg-[#273951]/50 hover:bg-[#273951] pl-2 pr-3 py-1.5 rounded-full transition-colors border border-white/5"
                  >
                    <img src={fromToken.icon} alt={fromToken.symbol} className="w-6 h-6 rounded-full" />
                    <span className="font-bold text-white">{fromToken.symbol}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                </div>
                <div className="text-xs text-slate-500 mt-2 font-mono">
                  ${amountIn ? (Number(amountIn) * fromToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
                </div>
              </div>

              {/* SWAP BUTTON (MIDDLE) */}
              <div className="relative h-2 flex justify-center items-center z-20">
                <button 
                  onClick={handleSwitchTokens}
                  className="absolute p-2 bg-[#0a0b0d] border-4 border-[#020817] rounded-xl hover:scale-110 hover:text-cyan-400 transition-all text-slate-400 shadow-xl"
                >
                  <ArrowDownUp size={16} />
                </button>
              </div>

              {/* TO INPUT */}
              <div className="bg-[#13151a] border border-white/5 rounded-3xl p-4 transition-colors">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-400">You receive</span>
                  <span className="text-xs font-medium text-slate-500">
                    Balance: {toToken.symbol === "USDT" ? "1,250.00" : "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  {isQuoting ? (
                    <div className="flex-1 h-10 flex items-center">
                      <div className="w-32 h-8 bg-white/[0.03] animate-pulse rounded-lg" />
                    </div>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      placeholder="0.0"
                      value={quote ? quote.amountOut.toFixed(6) : ""}
                      className="w-full bg-transparent text-4xl font-mono font-semibold text-white outline-none placeholder:text-slate-700"
                    />
                  )}
                  <button 
                    onClick={() => setShowTokenSelector("to")}
                    className="shrink-0 flex items-center gap-2 bg-[#273951]/50 hover:bg-[#273951] pl-2 pr-3 py-1.5 rounded-full transition-colors border border-white/5"
                  >
                    <img src={toToken.icon} alt={toToken.symbol} className="w-6 h-6 rounded-full" />
                    <span className="font-bold text-white">{toToken.symbol}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                </div>
                <div className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-2">
                  {isQuoting ? (
                    <div className="w-16 h-3 bg-white/[0.03] animate-pulse rounded" />
                  ) : (
                    <>${quote ? (quote.amountOut * toToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}</>
                  )}
                  {quote && !isQuoting && (
                    <span className="text-emerald-500/80">
                      (-0.10%)
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
                  className="px-4 py-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 py-1">
                    <span className="flex items-center gap-1 border-b border-dashed border-slate-500/50 cursor-help">Rate <Info size={10} /></span>
                    <span className="font-mono">1 {fromToken.symbol} = {quote.rate.toFixed(4)} {toToken.symbol}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 py-1">
                    <span className="flex items-center gap-1 border-b border-dashed border-slate-500/50 cursor-help">Network Fee <Info size={10} /></span>
                    <span className="font-mono text-slate-300">~${quote.gas.toFixed(2)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTION BUTTON */}
            <div className="p-4 relative z-10 pt-2">
              <button
                onClick={handleSwap}
                disabled={(!amountIn || txState !== "idle") && isConnected}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  txState === "success" ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : txState === "pending" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : txState === "confirming" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : !isConnected ? "bg-cyan-500 text-[#020817] hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                  : !amountIn ? "bg-white/5 text-slate-500 cursor-not-allowed"
                  : "bg-cyan-500 text-[#020817] hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                }`}
              >
                {txState === "confirming" && (
                  <><Loader size={18} className="animate-spin" /> Confirming in Wallet...</>
                )}
                {txState === "pending" && (
                  <><Loader size={18} className="animate-spin" /> Swapping...</>
                )}
                {txState === "success" && (
                  <><CheckCircle2 size={20} /> Swap Successful</>
                )}
                {txState === "idle" && (
                  !isConnected ? "Connect Wallet"
                  : !amountIn ? "Enter an amount"
                  : "Swap"
                )}
              </button>
            </div>

            {/* TOKEN SELECTOR MODAL (Overlay) */}
            <AnimatePresence>
              {showTokenSelector && (
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="absolute inset-0 z-50 bg-[#0a0b0d] flex flex-col"
                >
                  <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <h3 className="text-white font-bold text-lg">Select a token</h3>
                    <button onClick={() => setShowTokenSelector(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search name or paste address" 
                        value={tokenSearch}
                        onChange={(e) => setTokenSearch(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
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
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <img src={token.icon} alt={token.symbol} className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="text-white font-bold">{token.symbol}</div>
                            <div className="text-slate-500 text-xs">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-mono text-sm">{token.symbol === "ETH" ? "2.45" : "0.00"}</div>
                          <div className="text-slate-500 text-xs font-mono">${token.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
