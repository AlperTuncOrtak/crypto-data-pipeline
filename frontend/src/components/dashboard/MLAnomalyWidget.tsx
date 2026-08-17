import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, AlertTriangle, ShieldCheck } from "lucide-react";

interface MLAnomaly {
  symbol: string;
  timestamp: string;
  vwap: number;
  volume: number;
  score: number;
  severity: "CRITICAL" | "WARNING";
}

export function MLAnomalyWidget() {
  const [anomalies, setAnomalies] = useState<MLAnomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const apiUrl = import.meta.env.DEV ? "http://localhost:8000" : `https://${window.location.host}`;
        const res = await fetch(`${apiUrl}/api/whales/ml-anomalies`);
        if (res.ok) {
          const data = await res.json();
          setAnomalies(data);
        }
      } catch (error) {
        console.error("Failed to fetch ML anomalies", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnomalies();
    // Poll every 60 seconds
    const interval = setInterval(fetchAnomalies, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden p-6 bg-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[var(--accent)]/10 rounded-xl text-[var(--accent)]">
            <Brain size={18} strokeWidth={2.5} />
          </div>
          <h2 className="text-[15px] font-semibold text-[var(--text-main)] tracking-tight">AI Anomaly Detection</h2>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-overlay)] px-2 py-1 rounded-[8px] border border-[var(--border-subtle)]">
          <span className="text-[11px] text-[var(--text-muted)] font-medium">Isolation Forest</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--positive)] opacity-50"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--positive)]"></span>
          </span>
        </div>
      </div>

      <div className="flex-1 w-full flex items-center overflow-x-auto pb-2 space-x-3 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center w-full text-[14px] font-medium text-[var(--text-muted)] animate-pulse">
            Analyzing live data...
          </div>
        ) : anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-full min-h-[100px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]">
            <ShieldCheck className="text-[var(--text-faint)] mb-2" size={24} strokeWidth={2} />
            <p className="text-[13px] text-[var(--text-muted)] font-medium">Network is stable. No anomalies detected.</p>
          </div>
        ) : (
          <AnimatePresence>
            {anomalies.map((a, i) => (
              <motion.div
                key={`${a.symbol}-${a.timestamp}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, ease: "easeOut" }}
                className="flex-shrink-0 flex items-center justify-between min-w-[280px] p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--border-base)] hover:bg-[var(--bg-overlay)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${a.severity === "CRITICAL" ? "bg-[var(--negative)]/10 text-[var(--negative)]" : "bg-[var(--warning)]/10 text-[var(--warning)]"}`}>
                    <AlertTriangle size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-main)] text-[15px]">{a.symbol}</div>
                    <div className="text-[12px] font-medium text-[var(--text-muted)]">Vol: {(a.volume).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[14px] font-semibold ${a.severity === "CRITICAL" ? "text-[var(--negative)]" : "text-[var(--warning)]"}`}>
                    Score: {a.score.toFixed(2)}
                  </div>
                  <div className="text-[11px] font-medium text-[var(--text-faint)] mt-0.5">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
