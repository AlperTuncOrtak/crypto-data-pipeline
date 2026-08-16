import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { X, Activity } from "lucide-react";
import { FearGreedData } from "../../hooks/useFearAndGreed";

interface FearGreedModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: FearGreedData[];
}

function interpolateColor(color1: string, color2: string, factor: number) {
  const hex1 = color1.slice(1);
  const hex2 = color2.slice(1);
  const r1 = parseInt(hex1.slice(0, 2), 16);
  const g1 = parseInt(hex1.slice(2, 4), 16);
  const b1 = parseInt(hex1.slice(4, 6), 16);
  const r2 = parseInt(hex2.slice(0, 2), 16);
  const g2 = parseInt(hex2.slice(2, 4), 16);
  const b2 = parseInt(hex2.slice(4, 6), 16);
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function getColorForValue(v: number) {
  const clamp = Math.max(0, Math.min(100, v));
  if (clamp >= 50) {
    return interpolateColor('#f4b000', '#05b169', (clamp - 50) / 50);
  } else {
    return interpolateColor('#cf202f', '#f4b000', clamp / 50);
  }
}

export function FearGreedModal({ isOpen, onClose, history }: FearGreedModalProps) {
  // Format data for recharts safely
  const chartData = [...(history || [])].reverse().map(item => {
    const ts = parseInt(item.timestamp);
    const date = !isNaN(ts) ? new Date(ts * 1000) : new Date();
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseInt(item.value) || 0,
      classification: item.value_classification || "Unknown"
    };
  });

  const max_val = Math.max(1, ...chartData.map(d => d.value));
  const topColor = getColorForValue(max_val);
  const hasYellowStop = max_val > 50;
  const yellowOffset = hasYellowStop ? `${100 - (50 / max_val * 100)}%` : '0%';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="absolute inset-0 bg-[var(--bg-base)]/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-2xl bg-[var(--bg-elevated)]/90 backdrop-blur-xl border border-[var(--border-subtle)] rounded-[24px] shadow-[0_0_40px_rgba(59,130,246,0.15)] overflow-hidden p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-white/5 text-[#3b82f6]">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-[var(--text-main)] tracking-tight">Market Sentiment History</h2>
                  <p className="text-sm text-[#a1a1aa]">Last 30 Days Fear & Greed Index</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--border-subtle)] text-[#a1a1aa] hover:text-[var(--text-main)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={topColor} />
                    {hasYellowStop && <stop offset={yellowOffset} stopColor="#f4b000" />}
                    <stop offset="100%" stopColor="#cf202f" />
                  </linearGradient>
                  <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={topColor} stopOpacity={0.4} />
                    {hasYellowStop && <stop offset={yellowOffset} stopColor="#f4b000" stopOpacity={0.2} />}
                    <stop offset="100%" stopColor="#cf202f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.1)" 
                  tick={{ fill: '#a1a1aa', fontSize: 12, fontFamily: 'Inter, sans-serif' }} 
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.1)" 
                  tick={{ fill: '#a1a1aa', fontSize: 12, fontFamily: 'Inter, sans-serif' }} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const color = data.value <= 25 ? "#cf202f" : data.value <= 45 ? "#f4b000" : data.value <= 55 ? "#a8acb3" : "#05b169";
                      return (
                        <div className="bg-[var(--bg-elevated)]/90 border border-[var(--border-base)] rounded-3xl p-3 shadow-xl backdrop-blur-xl">
                          <div className="text-xs text-[#a1a1aa] mb-1">{data.date}</div>
                          <div className="text-lg font-bold font-mono" style={{ color }}>
                            {data.value} <span className="text-sm font-medium opacity-80 uppercase tracking-wider ml-1">{data.classification}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="url(#strokeGradient)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#fillGradient)" 
                />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
