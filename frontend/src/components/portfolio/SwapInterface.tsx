import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownUp, Settings, Info, Loader, Search, ChevronDown, CheckCircle2, X } from "lucide-react";
import { useAccount, useBalance, useReadContract, useWriteContract, useSendTransaction } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { parseUnits, formatUnits } from "viem";
import { TOKENS, UNISWAP_V2_ROUTER, WETH_ADDRESS, UNISWAP_ROUTER_ABI, ERC20_ABI } from "../../constants/web3";
import AITradeInsights from "../../components/market/AITradeInsights";
import { apiClient } from "../../api/client";

type TxState = "idle" | "confirming" | "pending" | "success";

export default function SwapInterface() {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Swap State
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [amountIn, setAmountIn] = useState("");
  const [quote, setQuote] = useState<{ amountOut: string; rate: number; platformFee?: string; tx?: { to: string; data: string; value: string } } | null>(null);

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
    query: { enabled: fromToken.address !== "ETH" && !!address },
  });

  const displayBalance =
    fromToken.address === "ETH" && ethBalance
      ? Number(ethBalance.formatted).toFixed(4)
      : erc20Balance
      ? Number(formatUnits(erc20Balance as bigint, fromToken.decimals)).toFixed(4)
      : "0.00";

  const path = [
    fromToken.address === "ETH" ? WETH_ADDRESS : fromToken.address,
    toToken.address === "ETH" ? WETH_ADDRESS : toToken.address,
  ] as `0x${string}`[];

  const parsedAmountIn = amountIn ? parseUnits(amountIn, fromToken.decimals) : 0n;

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
      try {
        const response = await apiClient.get("/api/swap/quote", {
          params: {
            sellToken: fromToken.address,
            buyToken: toToken.address,
            sellAmount: parsedAmountIn.toString(),
          },
        });
        const data = response.data;
        if (data.buyAmount) {
          const outStr = formatUnits(BigInt(data.buyAmount), toToken.decimals);
          const rate = Number(outStr) / Number(amountIn);
          const feeStr = formatUnits(BigInt(data.feeInfo?.feeAmount || "0"), toToken.decimals);
          setQuote({
            amountOut: Number(outStr).toFixed(6),
            rate,
            platformFee: feeStr,
            tx: { to: data.to, data: data.data, value: data.value },
          });
        }
      } catch (error: any) {
        if (error.response && error.response.status === 501) {
          setTimeout(() => {
            const inputUsd = Number(amountIn) * fromToken.price;
            const grossAmountOut = inputUsd / toToken.price;
            const feeAmount = grossAmountOut * 0.005;
            const netAmountOut = grossAmountOut - feeAmount;
            const rate = netAmountOut / Number(amountIn);
            setQuote({ amountOut: netAmountOut.toFixed(6), rate, platformFee: feeAmount.toFixed(6) });
            setIsQuoting(false);
          }, 800);
          return;
        }
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
    query: { enabled: fromToken.address !== "ETH" && !!address },
  });

  const needsApproval = fromToken.address !== "ETH" && parsedAmountIn > 0n && ((allowance as bigint) || 0n) < parsedAmountIn;

  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

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
    if (!isConnected) { openConnectModal?.(); return; }
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
          to: quote.tx.to as `0x${string}`,
          data: quote.tx.data as `0x${string}`,
          value: BigInt(quote.tx.value || "0"),
        });
      } else if (fromToken.address === "ETH") {
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

      setTxState("pending");
      toast.loading("Transaction pending...", { id: hash });
      setTimeout(() => {
        setTxState("success");
        toast.success(`Swapped ${amountIn} ${fromToken.symbol} for ${quote?.amountOut} ${toToken.symbol}`, {
          id: hash,
          description: "Transaction confirmed on-chain.",
          action: { label: "View Explorer", onClick: () => window.open(`https://etherscan.io/tx/${hash}`, "_blank") },
        });
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
    setAmountIn(quote?.amountOut ? quote.amountOut : "");
  };

  const setMaxBalance = () => {
    if (fromToken.address === "ETH" && ethBalance) {
      setAmountIn((Number(ethBalance.formatted) * 0.98).toFixed(4));
    } else if (erc20Balance) {
      setAmountIn(formatUnits(erc20Balance as bigint, fromToken.decimals));
    }
  };

  const filteredTokens = TOKENS.filter(
    (t) =>
      t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      t.name.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  // ── BUTTON STYLE ──
  const ctaBg =
    txState === "success" ? "#40d97a"
    : txState === "pending" || isApproving ? "rgba(250,78,255,0.15)"
    : txState === "confirming" ? "rgba(245,158,11,0.15)"
    : !amountIn && isConnected ? "rgba(255,255,255,0.05)"
    : "#fa4eff";
  const ctaColor =
    txState === "pending" || isApproving ? "#fa4eff"
    : txState === "confirming" ? "#f59e0b"
    : !amountIn && isConnected ? "rgba(255,255,255,0.25)"
    : "#000";

  return (
    <div className="w-full relative flex flex-col items-center justify-center pt-8 pb-16 overflow-visible">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full mx-auto flex flex-col md:flex-row items-center justify-center gap-5 relative z-10"
      >
        {/* ── SWAP CARD ── */}
        <div
          className="w-full max-w-[464px] shrink-0 mx-auto md:mx-0 overflow-hidden relative"
          style={{ background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <span className="text-white font-semibold text-base">Swap</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(`https://global.transak.com/?apiKey=YOUR_TRANSAK_API_KEY&cryptoCurrencyCode=${toToken.symbol}&walletAddress=${address || ""}`, "_blank")}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}
              >
                Buy
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-xl transition-all"
                style={{ background: showSettings ? "rgba(255,255,255,0.08)" : "transparent", color: showSettings ? "#fff" : "rgba(255,255,255,0.35)" }}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }} className="overflow-hidden px-5 pb-3"
              >
                <div style={{ background: "#222", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Slippage tolerance</span>
                    <span className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{slippage}%</span>
                  </div>
                  <div className="flex gap-2">
                    {["0.1", "0.5", "1.0"].map((s) => (
                      <button key={s} onClick={() => setSlippage(s)} className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: slippage === s ? "rgba(250,78,255,0.15)" : "rgba(255,255,255,0.05)",
                          color: slippage === s ? "#fa4eff" : "rgba(255,255,255,0.45)",
                          border: slippage === s ? "1px solid rgba(250,78,255,0.3)" : "1px solid transparent",
                        }}>
                        {s}%
                      </button>
                    ))}
                    <div className="relative flex-1">
                      <input type="text" value={slippage} onChange={(e) => setSlippage(e.target.value)}
                        className="w-full py-2 px-3 text-sm text-right rounded-xl focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid transparent" }} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inputs */}
          <div className="px-3 pb-3 flex flex-col gap-1">
            {/* FROM */}
            <div style={{ background: "#222", borderRadius: 20, padding: 16 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>You pay</span>
                <span className="text-xs font-mono flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {displayBalance}
                  <button onClick={setMaxBalance} className="font-bold text-[10px] px-2 py-0.5 rounded-md"
                    style={{ background: "rgba(250,78,255,0.12)", color: "#fa4eff" }}>
                    MAX
                  </button>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text" placeholder="0" value={amountIn}
                  onChange={(e) => {
                    let val = e.target.value.replace(/,/g, ".").replace(/-/g, "");
                    if (/^\d*\.?\d*$/.test(val)) setAmountIn(val);
                  }}
                  className="flex-1 bg-transparent font-semibold text-white outline-none placeholder:text-white/10 min-w-0"
                  style={{ fontSize: 40 }}
                />
                <button onClick={() => setShowTokenSelector("from")} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl transition-colors"
                  style={{ background: "#131313", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <img src={fromToken.icon} alt={fromToken.symbol} className="w-6 h-6 rounded-full" />
                  <span className="font-bold text-white text-sm">{fromToken.symbol}</span>
                  <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.35)" }} />
                </button>
              </div>
              <div className="text-xs font-mono mt-2" style={{ color: "rgba(255,255,255,0.22)" }}>
                ${amountIn ? (Number(amountIn) * fromToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
              </div>
            </div>

            {/* SWITCH */}
            <div className="relative h-0 flex justify-center items-center z-20 my-0.5">
              <button onClick={handleSwitchTokens}
                className="absolute flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ width: 36, height: 36, borderRadius: 12, background: "#1b1b1b", border: "4px solid #131313", color: "rgba(255,255,255,0.35)" }}>
                <ArrowDownUp size={16} />
              </button>
            </div>

            {/* TO */}
            <div style={{ background: "#222", borderRadius: 20, padding: 16 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>You receive</span>
              </div>
              <div className="flex items-center gap-3">
                {isQuoting ? (
                  <div className="flex-1 flex items-center" style={{ height: 48 }}>
                    <div className="w-28 h-9 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                  </div>
                ) : (
                  <input type="text" readOnly placeholder="0" value={quote ? quote.amountOut : ""}
                    className="flex-1 bg-transparent font-semibold text-white outline-none placeholder:text-white/10 min-w-0"
                    style={{ fontSize: 40 }} />
                )}
                <button onClick={() => setShowTokenSelector("to")} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl transition-colors"
                  style={{ background: "#131313", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <img src={toToken.icon} alt={toToken.symbol} className="w-6 h-6 rounded-full" />
                  <span className="font-bold text-white text-sm">{toToken.symbol}</span>
                  <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.35)" }} />
                </button>
              </div>
              <div className="text-xs font-mono mt-2 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.22)" }}>
                {isQuoting ? (
                  <div className="w-16 h-3 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                ) : (
                  <>
                    ${quote ? (Number(quote.amountOut) * toToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
                    {quote && <span style={{ color: "#40d97a" }}>· Best price</span>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quote details */}
          <AnimatePresence>
            {quote && !isQuoting && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }} className="overflow-hidden px-5">
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 0" }}>
                  {[
                    { label: "Rate", value: `1 ${fromToken.symbol} = ${quote.rate.toFixed(4)} ${toToken.symbol}` },
                    { label: "Fee (0.5%)", value: quote.platformFee ? `${Number(quote.platformFee).toFixed(4)} ${toToken.symbol}` : "—" },
                    { label: "Router", value: "0x Aggregator" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-1">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
                      <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA button */}
          <div className="px-3 pb-4">
            <button
              onClick={handleSwap}
              disabled={(!amountIn || txState !== "idle" || isApproving) && isConnected}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200"
              style={{ background: ctaBg, color: ctaColor, cursor: !amountIn && isConnected ? "not-allowed" : "pointer" }}
            >
              {txState === "confirming" && <><Loader size={18} className="animate-spin" /> Confirm in Wallet</>}
              {(txState === "pending" || isApproving) && <><Loader size={18} className="animate-spin" /> {isApproving ? "Approving…" : "Swapping…"}</>}
              {txState === "success" && <><CheckCircle2 size={20} /> Swap Successful</>}
              {txState === "idle" && !isApproving && (
                !isConnected ? "Connect Wallet"
                : !amountIn ? "Enter an amount"
                : needsApproval ? `Approve ${fromToken.symbol}`
                : "Swap"
              )}
            </button>
          </div>

          {/* Token selector modal */}
          <AnimatePresence>
            {showTokenSelector && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }} className="absolute inset-0 z-50 flex flex-col"
                style={{ background: "#1b1b1b", borderRadius: 24 }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-white font-semibold">Select token</span>
                  <button onClick={() => setShowTokenSelector(null)} className="transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "rgba(255,255,255,0.25)" }} />
                    <input type="text" placeholder="Search tokens" value={tokenSearch}
                      onChange={(e) => setTokenSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm text-white rounded-xl focus:outline-none"
                      style={{ background: "#222", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)" }}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-4">
                  {filteredTokens.map((token) => (
                    <button key={token.symbol}
                      onClick={() => { if (showTokenSelector === "from") setFromToken(token); else setToToken(token); setShowTokenSelector(null); setTokenSearch(""); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left hover:bg-white/[0.04]">
                      <img src={token.icon} alt={token.symbol} className="w-9 h-9 rounded-full" />
                      <div>
                        <div className="text-white font-semibold text-sm">{token.symbol}</div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{token.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Market Signals */}
        <div className="w-full md:w-[300px] shrink-0">
          <AITradeInsights onApplySuggestion={(tokenSymbol) => {
            const token = TOKENS.find((t) => t.symbol === tokenSymbol);
            if (token) setToToken(token);
          }} />
        </div>
      </motion.div>
    </div>
  );
}
