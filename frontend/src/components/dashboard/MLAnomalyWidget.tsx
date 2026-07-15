import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, AlertTriangle } from "lucide-react";

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
    <div className="w-full h-full flex flex-col rounded-2xl border border-white/[0.05] bg-[#19191c]/80 backdrop-blur-xl overflow-hidden p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-[#0052ff]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">AI Anomaly Detection</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">Isolation Forest</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0052ff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0052ff]"></span>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-slate-500 animate-pulse">
            Analyzing live data...
          </div>
        ) : anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <Brain className="text-slate-500" size={20} />
            </div>
            <p className="text-sm text-slate-400 font-medium">No Anomalies Detected</p>
            <p className="text-xs text-slate-500 mt-1">The ML model has not detected any whale activity recently.</p>
          </div>
        ) : (
          <AnimatePresence>
            {anomalies.map((a, i) => (
              <motion.div
                key={`${a.symbol}-${a.timestamp}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${a.severity === "CRITICAL" ? "bg-rose-500/20 text-rose-400" : "bg-orange-500/20 text-orange-400"}`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{a.symbol}</div>
                    <div className="text-[10px] text-slate-400">Vol: {(a.volume).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-black font-mono ${a.severity === "CRITICAL" ? "text-rose-400" : "text-orange-400"}`}>
                    Score: {a.score.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
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
