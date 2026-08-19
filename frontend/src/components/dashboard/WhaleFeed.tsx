import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Radio } from "lucide-react";

interface WhaleTx {
  id: string;
  token: string;
  amount: string;
  amount_usd: string;
  label: string;
  color: string;
  sentiment: string;
  timestamp: string;
}

export function WhaleFeed() {
  const [transactions, setTransactions] = useState<WhaleTx[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determine websocket URL
    const wsUrl = import.meta.env.DEV 
      ? "ws://localhost:8000/feed"
      : `wss://${window.location.host}/api/ws/whales/feed`; // adjust depending on deployment

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const tx: WhaleTx = JSON.parse(event.data);
        // Add new transaction to the top, keep max 50 items
        setTransactions((prev) => [tx, ...prev].slice(0, 50));
      } catch (e) {
        console.error("Error parsing whale tx", e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    slate: "text-white/40 bg-white/[0.02] border-white/[0.04]",
  };

  const getAmountColor = (color: string) => {
    if (color === "emerald") return "text-emerald-400";
    if (color === "rose") return "text-rose-400";
    return "text-white";
  };

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col overflow-hidden p-6 bg-transparent">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Activity size={16} strokeWidth={2.5} />
          </div>
          <h2 className="text-[14px] font-semibold text-white tracking-tight">Smart Money Tracker</h2>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.02] px-2.5 py-1 rounded-[8px] border border-white/[0.06]">
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Live Feed</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-full min-h-[150px] rounded-[16px] border border-white/[0.04] bg-[#09090b]/40">
            <Radio className="text-white/10 mb-2 animate-pulse" size={20} strokeWidth={2} />
            <p className="text-[12px] text-white/30 font-medium">
              {isConnected ? "Awaiting Block Confirmations..." : "Establishing Secure Uplink..."}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-[#09090b]/40 hover:border-white/[0.08] hover:bg-white/[0.015] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${colorMap[tx.color] || colorMap.slate}`}>
                    {tx.label}
                  </div>
                  <div className="font-semibold text-white text-[13px] font-mono">
                    {tx.amount} <span className="text-white/40 font-medium">{tx.token}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[14px] font-semibold tracking-tight font-mono ${getAmountColor(tx.color)}`}>{tx.amount_usd}</div>
                  <div className="text-[10px] font-medium text-white/30 mt-0.5 font-mono">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
