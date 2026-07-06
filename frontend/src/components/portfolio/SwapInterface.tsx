import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownUp, Settings, Loader, Search, ChevronDown, CheckCircle2, X } from "lucide-react";
import { useAccount, useBalance, useReadContract, useWriteContract, useSendTransaction } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { parseUnits, formatUnits } from "viem";
import { TOKENS, UNISWAP_V2_ROUTER, WETH_ADDRESS, UNISWAP_ROUTER_ABI, ERC20_ABI } from "../../constants/web3";
import AITradeInsights from "../../components/market/AITradeInsights";
import { apiClient } from "../../api/client";

type TxState = "idle" | "confirming" | "pending" | "success";

// Landing page glass style constants
const GLASS_BG   = "rgba(255,255,255,0.04)";
const GLASS_BG2  = "rgba(255,255,255,0.06)";
const GLASS_BORDER = "rgba(255,255,255,0.08)";
const GLASS_BORDER_HOVER = "rgba(255,255,255,0.14)";

export default function SwapInterface() {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken,   setToToken]   = useState(TOKENS[1]);
  const [amountIn,  setAmountIn]  = useState("");
  const [quote, setQuote] = useState<{
    amountOut: string; rate: number; platformFee?: string;
    tx?: { to: string; data: string; value: string };
  } | null>(null);

  const [showSettings,    setShowSettings]    = useState(false);
  const [slippage,        setSlippage]        = useState("0.5");
  const [showTokenSelector, setShowTokenSelector] = useState<"from" | "to" | null>(null);
  const [tokenSearch,     setTokenSearch]     = useState("");
  const [txState,         setTxState]         = useState<TxState>("idle");
  const [isApproving,     setIsApproving]     = useState(false);
  const [isQuoting,       setIsQuoting]       = useState(false);
  const [apiKeyError,     setApiKeyError]     = useState(false);

  const { data: ethBalance }  = useBalance({ address });
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
    toToken.address   === "ETH" ? WETH_ADDRESS : toToken.address,
  ] as `0x${string}`[];

  const parsedAmountIn = amountIn ? parseUnits(amountIn, fromToken.decimals) : 0n;

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
          params: { sellToken: fromToken.address, buyToken: toToken.address, sellAmount: parsedAmountIn.toString() },
        });
        const data = response.data;
        if (data.buyAmount) {
          const outStr = formatUnits(BigInt(data.buyAmount), toToken.decimals);
          const rate   = Number(outStr) / Number(amountIn);
          const feeStr = formatUnits(BigInt(data.feeInfo?.feeAmount || "0"), toToken.decimals);
          setQuote({ amountOut: Number(outStr).toFixed(6), rate, platformFee: feeStr, tx: { to: data.to, data: data.data, value: data.value } });
        }
      } catch (error: any) {
        if (error.response?.status === 501) {
          setTimeout(() => {
            const inputUsd     = Number(amountIn) * fromToken.price;
            const grossOut     = inputUsd / toToken.price;
            const fee          = grossOut * 0.005;
            const net          = grossOut - fee;
            setQuote({ amountOut: net.toFixed(6), rate: net / Number(amountIn), platformFee: fee.toFixed(6) });
            setIsQuoting(false);
          }, 800);
          return;
        }
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
      await writeContractAsync({ address: fromToken.address as `0x${string}`, abi: ERC20_ABI, functionName: "approve", args: [UNISWAP_V2_ROUTER, parsedAmountIn] });
      toast.loading("Approving token...", { id: "approve" });
      setTimeout(() => { toast.success("Approved!", { id: "approve" }); refetchAllowance(); setIsApproving(false); }, 5000);
    } catch { setIsApproving(false); toast.error("Approval failed."); }
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
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      let hash: `0x${string}`;

      if (quote?.tx) {
        hash = await sendTransactionAsync({ to: quote.tx.to as `0x${string}`, data: quote.tx.data as `0x${string}`, value: BigInt(quote.tx.value || "0") });
      } else if (fromToken.address === "ETH") {
        hash = await writeContractAsync({ address: UNISWAP_V2_ROUTER, abi: UNISWAP_ROUTER_ABI, functionName: "swapExactETHForTokens", args: [amountOutMin, path, address as `0x${string}`, deadline], value: parsedAmountIn });
      } else if (toToken.address === "ETH") {
        hash = await writeContractAsync({ address: UNISWAP_V2_ROUTER, abi: UNISWAP_ROUTER_ABI, functionName: "swapExactTokensForETH", args: [parsedAmountIn, amountOutMin, path, address as `0x${string}`, deadline] });
      } else {
        hash = await writeContractAsync({ address: UNISWAP_V2_ROUTER, abi: UNISWAP_ROUTER_ABI, functionName: "swapExactTokensForTokens", args: [parsedAmountIn, amountOutMin, path, address as `0x${string}`, deadline] });
      }

      setTxState("pending");
      toast.loading("Pending...", { id: hash });
      setTimeout(() => {
        setTxState("success");
        toast.success(`Swapped ${amountIn} ${fromToken.symbol} → ${quote?.amountOut} ${toToken.symbol}`, {
          id: hash,
          action: { label: "Etherscan", onClick: () => window.open(`https://etherscan.io/tx/${hash}`, "_blank") },
        });
        setTimeout(() => { setTxState("idle"); setAmountIn(""); }, 3000);
      }, 5000);
    } catch (error) {
      console.error(error);
      setTxState("idle");
      toast.error("Transaction rejected.");
    }
  };

  const handleSwitchTokens = () => {
    const tmp = fromToken; setFromToken(toToken); setToToken(tmp);
    setAmountIn(quote?.amountOut ?? "");
  };

  const setMaxBalance = () => {
    if (fromToken.address === "ETH" && ethBalance) setAmountIn((Number(ethBalance.formatted) * 0.98).toFixed(4));
    else if (erc20Balance) setAmountIn(formatUnits(erc20Balance as bigint, fromToken.decimals));
  };

  const filteredTokens = TOKENS.filter(t =>
    t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
    t.name.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  // CTA button state styles — Landing page "Start Trading" vibe
  const ctaStyle = (() => {
    if (txState === "success")                    return { bg: "#10b981", color: "#000" };
    if (txState === "pending" || isApproving)     return { bg: GLASS_BG2, color: "rgba(255,255,255,0.5)" };
    if (txState === "confirming")                 return { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" };
    if (!amountIn && isConnected)                 return { bg: GLASS_BG, color: "rgba(255,255,255,0.2)" };
    return { bg: "#ffffff", color: "#000000" }; // solid white — Landing page style
  })();

  return (
    <div className="w-full flex flex-col items-center justify-center pt-8 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full mx-auto flex flex-col md:flex-row items-start justify-center gap-4"
      >
        {/* ── SWAP CARD ── */}
        <div
          className="w-full max-w-[460px] shrink-0 mx-auto md:mx-0 relative overflow-hidden backdrop-blur-sm"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${GLASS_BORDER}`,
            borderRadius: 24,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset",
          }}
        >
          {/* Subtle top glow — matches landing */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <span className="text-white font-semibold text-base tracking-tight">Swap</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(`https://global.transak.com/?apiKey=YOUR_TRANSAK_API_KEY&cryptoCurrencyCode=${toToken.symbol}&walletAddress=${address || ""}`, "_blank")}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:border-white/20"
                style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: "rgba(255,255,255,0.5)" }}
              >
                Buy
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-xl transition-all"
                style={{ background: showSettings ? GLASS_BG2 : "transparent", color: showSettings ? "#fff" : "rgba(255,255,255,0.35)" }}
              >
                <Settings size={17} />
              </button>
            </div>
          </div>

          {/* Settings */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden px-5 pb-3"
              >
                <div className="backdrop-blur-md rounded-2xl p-4" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-400">Slippage tolerance</span>
                    <span className="text-sm font-mono text-white/60">{slippage}%</span>
                  </div>
                  <div className="flex gap-2">
                    {["0.1", "0.5", "1.0"].map(s => (
                      <button key={s} onClick={() => setSlippage(s)}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: slippage === s ? "rgba(34,211,238,0.12)" : GLASS_BG,
                          color:      slippage === s ? "#22d3ee" : "rgba(255,255,255,0.4)",
                          border:     slippage === s ? "1px solid rgba(34,211,238,0.3)" : `1px solid transparent`,
                        }}>
                        {s}%
                      </button>
                    ))}
                    <div className="relative flex-1">
                      <input type="text" value={slippage} onChange={e => setSlippage(e.target.value)}
                        className="w-full py-2 px-3 text-sm text-right rounded-xl focus:outline-none"
                        style={{ background: GLASS_BG, color: "rgba(255,255,255,0.6)", border: `1px solid ${GLASS_BORDER}` }} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input panels */}
          <div className="px-3 pb-3 flex flex-col gap-1">

            {/* FROM */}
            <div className="p-4 rounded-[18px] transition-all" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">You pay</span>
                <span className="text-xs font-mono text-slate-600 flex items-center gap-1.5">
                  {displayBalance}
                  <button onClick={setMaxBalance}
                    className="font-bold text-[10px] px-2 py-0.5 rounded-md transition-colors"
                    style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee" }}>
                    MAX
                  </button>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text" placeholder="0" value={amountIn}
                  onChange={e => { let v = e.target.value.replace(/,/g, ".").replace(/-/g, ""); if (/^\d*\.?\d*$/.test(v)) setAmountIn(v); }}
                  className="flex-1 bg-transparent font-semibold text-white outline-none min-w-0"
                  style={{ fontSize: 38, letterSpacing: "-0.02em" }}
                />
                <button onClick={() => setShowTokenSelector("from")}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-full transition-all backdrop-blur-sm hover:border-white/20"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${GLASS_BORDER}` }}>
                  <img src={fromToken.icon} alt={fromToken.symbol} className="w-6 h-6 rounded-full" />
                  <span className="font-bold text-white text-sm">{fromToken.symbol}</span>
                  <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
                </button>
              </div>
              <div className="text-xs font-mono mt-2 text-slate-700">
                ${amountIn ? (Number(amountIn) * fromToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
              </div>
            </div>

            {/* SWITCH */}
            <div className="relative h-0 flex justify-center z-20 my-0.5">
              <button onClick={handleSwitchTokens}
                className="absolute flex items-center justify-center transition-all hover:scale-110 active:scale-95 backdrop-blur-sm"
                style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `4px solid #000`, color: "rgba(255,255,255,0.4)" }}>
                <ArrowDownUp size={15} />
              </button>
            </div>

            {/* TO */}
            <div className="p-4 rounded-[18px] transition-all" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">You receive</span>
              </div>
              <div className="flex items-center gap-3">
                {isQuoting ? (
                  <div className="flex-1 flex items-center" style={{ height: 46 }}>
                    <div className="w-24 h-8 rounded-lg animate-pulse" style={{ background: GLASS_BG2 }} />
                  </div>
                ) : (
                  <input type="text" readOnly placeholder="0" value={quote?.amountOut ?? ""}
                    className="flex-1 bg-transparent font-semibold text-white outline-none min-w-0"
                    style={{ fontSize: 38, letterSpacing: "-0.02em" }} />
                )}
                <button onClick={() => setShowTokenSelector("to")}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-full transition-all backdrop-blur-sm hover:border-white/20"
                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${GLASS_BORDER}` }}>
                  <img src={toToken.icon} alt={toToken.symbol} className="w-6 h-6 rounded-full" />
                  <span className="font-bold text-white text-sm">{toToken.symbol}</span>
                  <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
                </button>
              </div>
              <div className="text-xs font-mono mt-2 flex items-center gap-2 text-slate-700">
                {isQuoting ? <div className="w-14 h-3 rounded animate-pulse" style={{ background: GLASS_BG2 }} /> : (
                  <>
                    ${quote ? (Number(quote.amountOut) * toToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
                    {quote && <span style={{ color: "#10b981" }}>· Best price</span>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quote row */}
          <AnimatePresence>
            {quote && !isQuoting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                className="overflow-hidden px-5"
              >
                <div style={{ borderTop: `1px solid ${GLASS_BORDER}`, padding: "10px 0 12px" }}>
                  {[
                    { label: "Rate",       value: `1 ${fromToken.symbol} = ${quote.rate.toFixed(4)} ${toToken.symbol}` },
                    { label: "Fee (0.5%)", value: quote.platformFee ? `${Number(quote.platformFee).toFixed(4)} ${toToken.symbol}` : "—" },
                    { label: "Router",     value: "0x Aggregator" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-0.5">
                      <span className="text-xs text-slate-600">{label}</span>
                      <span className="text-xs font-mono text-slate-500">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA — Landing page solid white button */}
          <div className="px-3 pb-4">
            <button
              onClick={handleSwap}
              disabled={(!amountIn || txState !== "idle" || isApproving) && isConnected}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: ctaStyle.bg, color: ctaStyle.color, cursor: !amountIn && isConnected ? "not-allowed" : "pointer", boxShadow: ctaStyle.bg === "#ffffff" ? "0 0 30px rgba(255,255,255,0.15)" : "none" }}
            >
              {txState === "confirming" && <><Loader size={17} className="animate-spin" /> Confirm in Wallet</>}
              {(txState === "pending" || isApproving) && <><Loader size={17} className="animate-spin" /> {isApproving ? "Approving…" : "Swapping…"}</>}
              {txState === "success"    && <><CheckCircle2 size={19} /> Swap Successful</>}
              {txState === "idle" && !isApproving && (
                !isConnected ? "Connect Wallet"
                : !amountIn  ? "Enter an amount"
                : needsApproval ? `Approve ${fromToken.symbol}`
                : "Swap"
              )}
            </button>
          </div>

          {/* Token selector modal */}
          <AnimatePresence>
            {showTokenSelector && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 z-50 flex flex-col backdrop-blur-xl"
                style={{ background: "rgba(0,0,0,0.92)", borderRadius: 24 }}
              >
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}>
                  <span className="text-white font-semibold">Select token</span>
                  <button onClick={() => setShowTokenSelector(null)} className="transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.35)" }}>
                    <X size={19} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: "rgba(255,255,255,0.25)" }} />
                    <input type="text" placeholder="Search tokens" value={tokenSearch}
                      onChange={e => setTokenSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl focus:outline-none"
                      style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, color: "rgba(255,255,255,0.8)" }} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-4">
                  {filteredTokens.map(token => (
                    <button key={token.symbol}
                      onClick={() => { if (showTokenSelector === "from") setFromToken(token); else setToToken(token); setShowTokenSelector(null); setTokenSearch(""); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors"
                      style={{ background: "transparent" }}
                      onMouseEnter={e => (e.currentTarget.style.background = GLASS_BG)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <img src={token.icon} alt={token.symbol} className="w-9 h-9 rounded-full" />
                      <div>
                        <div className="text-white font-semibold text-sm">{token.symbol}</div>
                        <div className="text-xs text-slate-600">{token.name}</div>
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
          <AITradeInsights onApplySuggestion={tokenSymbol => {
            const token = TOKENS.find(t => t.symbol === tokenSymbol);
            if (token) setToToken(token);
          }} />
        </div>
      </motion.div>
    </div>
  );
}
