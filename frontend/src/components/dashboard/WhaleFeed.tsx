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
    emerald: "text-[var(--positive)] bg-[var(--positive)]/10 border-[var(--positive)]/20",
    rose: "text-[var(--negative)] bg-[var(--negative)]/10 border-[var(--negative)]/20",
    cyan: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20",
    slate: "text-[var(--text-muted)] bg-[var(--bg-overlay)] border-[var(--border-subtle)]",
  };

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col overflow-hidden p-6 bg-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[var(--positive)]/10 rounded-xl text-[var(--positive)]">
            <Activity size={18} strokeWidth={2.5} />
          </div>
          <h2 className="text-[15px] font-semibold text-[var(--text-main)] tracking-tight">Smart Money Tracker</h2>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-overlay)] px-2 py-1 rounded-[8px] border border-[var(--border-subtle)]">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">Live Feed</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-[var(--positive)] animate-pulse" : "bg-[var(--negative)]"}`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-full min-h-[150px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]">
            <Radio className="text-[var(--text-faint)] mb-2" size={24} strokeWidth={2} />
            <p className="text-[13px] text-[var(--text-muted)] font-medium">
              {isConnected ? "Awaiting Block Confirmations..." : "Establishing Secure Uplink..."}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] hover:border-[var(--border-base)] hover:bg-[var(--bg-overlay)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded-lg text-[11px] font-semibold tracking-wide border ${colorMap[tx.color] || colorMap.slate}`}>
                    {tx.label}
                  </div>
                  <div className="font-semibold text-[var(--text-main)] text-[14px]">
                    {tx.amount} <span className="text-[var(--text-muted)] font-medium">{tx.token}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-semibold text-[var(--positive)] tracking-tight">{tx.amount_usd}</div>
                  <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
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
