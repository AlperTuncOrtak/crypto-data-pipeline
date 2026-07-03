import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownUp, Settings, Info, Loader } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import NumberFlow from "@number-flow/react";

const TOKENS = [
  { symbol: "ETH", name: "Ethereum", price: 3450.2, icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029" },
  { symbol: "USDT", name: "Tether", price: 1.0, icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=029" },
  { symbol: "PEPE", name: "Pepe", price: 0.000012, icon: "https://cryptologos.cc/logos/pepe-pepe-logo.svg?v=029" },
  { symbol: "SOL", name: "Solana", price: 145.6, icon: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=029" },
  { symbol: "LINK", name: "Chainlink", price: 14.2, icon: "https://cryptologos.cc/logos/chainlink-link-logo.svg?v=029" },
];

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

  // Toggle Modal Event Listener
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-swap", handleOpen);
    return () => window.removeEventListener("open-swap", handleOpen);
  }, []);

  // Fetch Fake Quote (Simulating 0x API routing)
  useEffect(() => {
    if (!amountIn || Number(amountIn) <= 0) {
      setQuote(null);
      return;
    }

    setIsQuoting(true);
    const timeout = setTimeout(() => {
      // Math simulation: (Amount In * From Price) / To Price
      const inputUsd = Number(amountIn) * fromToken.price;
      const amountOutRaw = inputUsd / toToken.price;
      
      // Add a slight slippage/fee (0.1%)
      const amountOut = amountOutRaw * 0.999;
      const rate = amountOut / Number(amountIn);
      const gas = Math.random() * 5 + 2; // Random gas between $2 - $7

      setQuote({ amountOut, rate, gas });
      setIsQuoting(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [amountIn, fromToken, toToken]);

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmountIn(quote ? quote.amountOut.toFixed(6) : "");
  };

  const setMaxBalance = () => {
    if (fromToken.symbol === "ETH" && ethBalance) {
      // Leave tiny bit for gas
      const max = Math.max(0, Number(ethBalance.formatted) - 0.005);
      setAmountIn(max.toString());
    } else {
      // Mock max for other tokens
      setAmountIn("1000");
    }
  };

  const handleExecuteSwap = () => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
      return;
    }
    // Would trigger Wagmi writeContract here for 0x proxy
    alert(`Simulating Swap transaction for ${amountIn} ${fromToken.symbol} to ${toToken.symbol} via 0x Router.`);
    setAmountIn("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-[#0a0b0d]/80 backdrop-blur-sm"
        />

        {/* Modal Body (Bento Box Premium) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-[420px] bg-[#16181c] border border-[#273951]/80 rounded-[32px] p-2 shadow-2xl overflow-hidden"
        >
          {/* Subtle Glow Background */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-white font-bold text-lg">Swap</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                <Settings size={18} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="relative z-10 p-2 flex flex-col gap-1">
            
            {/* FROM INPUT */}
            <div className="bg-[#0a0b0d] border border-white/5 rounded-3xl p-4 transition-colors focus-within:border-purple-500/50">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">You pay</span>
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  Balance: {fromToken.symbol === "ETH" && ethBalance ? Number(ethBalance.formatted).toFixed(4) : "0.00"}
                  <button onClick={setMaxBalance} className="text-purple-400 hover:text-purple-300 font-bold ml-1">MAX</button>
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <input
                  type="number"
                  placeholder="0.0"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  className="w-full bg-transparent text-3xl font-mono font-bold text-white outline-none placeholder:text-gray-700"
                />
                <button className="shrink-0 flex items-center gap-2 bg-[#273951]/50 hover:bg-[#273951] px-4 py-2 rounded-2xl transition-colors border border-white/5">
                  <img src={fromToken.icon} alt={fromToken.symbol} className="w-6 h-6 rounded-full" />
                  <span className="font-bold text-white">{fromToken.symbol}</span>
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2 font-mono">
                ${amountIn ? (Number(amountIn) * fromToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
              </div>
            </div>

            {/* SWAP BUTTON (MIDDLE) */}
            <div className="relative h-2 flex justify-center items-center z-20">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: 180 }}
                onClick={handleSwapTokens}
                className="absolute w-10 h-10 bg-[#16181c] border border-white/10 rounded-xl flex items-center justify-center text-white hover:text-purple-400 hover:border-purple-500/50 shadow-lg transition-colors z-20"
              >
                <ArrowDownUp size={18} />
              </motion.button>
            </div>

            {/* TO INPUT */}
            <div className="bg-[#0a0b0d] border border-white/5 rounded-3xl p-4 transition-colors">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">You receive</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="w-full text-3xl font-mono font-bold text-white truncate">
                  {isQuoting ? (
                    <span className="text-gray-700 animate-pulse">Fetching...</span>
                  ) : quote ? (
                    <NumberFlow value={quote.amountOut} format={{ maximumFractionDigits: 6 }} />
                  ) : (
                    <span className="text-gray-700">0.0</span>
                  )}
                </div>
                <button className="shrink-0 flex items-center gap-2 bg-[#273951]/50 hover:bg-[#273951] px-4 py-2 rounded-2xl transition-colors border border-white/5">
                  <img src={toToken.icon} alt={toToken.symbol} className="w-6 h-6 rounded-full" />
                  <span className="font-bold text-white">{toToken.symbol}</span>
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2 font-mono flex justify-between items-center">
                <span>${quote ? (quote.amountOut * toToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}</span>
                {quote && <span className="text-green-500 font-bold ml-2">(-0.1% Slippage)</span>}
              </div>
            </div>

            {/* QUOTE DETAILS */}
            <AnimatePresence>
              {quote && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-4 px-2 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium flex items-center gap-1">Rate <Info size={14} className="text-gray-600"/></span>
                      <span className="text-white font-mono">1 {fromToken.symbol} = {quote.rate.toFixed(6)} {toToken.symbol}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Network Cost (Gas)</span>
                      <span className="text-gray-300 font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        ~${quote.gas.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Routing</span>
                      <span className="text-gray-300 font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">0x Aggregator</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTION BUTTON */}
            <button
              onClick={handleExecuteSwap}
              disabled={isQuoting || (!amountIn && isConnected)}
              className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 text-white font-bold text-lg shadow-[0_0_30px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {!isConnected ? "Connect Wallet" : isQuoting ? <Loader className="animate-spin mx-auto" /> : quote ? "Review Swap" : "Enter an amount"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
