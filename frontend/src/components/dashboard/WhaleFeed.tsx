import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";

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
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    slate: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  };

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col rounded-2xl border border-white/[0.05] bg-[#080b10] overflow-hidden p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[#00d084]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Smart Money Tracker</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono">Live Feed</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#00d084] animate-pulse" : "bg-rose-500"}`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-slate-500">
            {isConnected ? "Waiting for transactions..." : "Connecting to feed..."}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex items-center justify-between p-3 rounded-xl border border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${colorMap[tx.color] || colorMap.slate}`}>
                    {tx.label}
                  </div>
                  <div className="font-bold text-white text-sm">
                    {tx.amount} <span className="text-slate-400">{tx.token}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black font-mono text-[#00d084]">{tx.amount_usd}</div>
                  <div className="text-[10px] text-slate-500">
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
