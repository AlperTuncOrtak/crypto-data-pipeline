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
    return interpolateColor('#F59E0B', '#10B981', (clamp - 50) / 50);
  } else {
    return interpolateColor('#EF4444', '#F59E0B', clamp / 50);
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
            className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-[#18181b] rounded-[24px] border border-white/[0.06] shadow-2xl overflow-hidden p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-white/[0.06] pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[#10B981]/10 text-[#10B981]">
                  <Activity size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold text-white tracking-tight">Market Sentiment</h2>
                  <p className="text-[13px] font-medium text-zinc-400 mt-1">Last 30 Days Fear & Greed Index</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                  <linearGradient id="strokeGradientFng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={topColor} />
                    {hasYellowStop && <stop offset={yellowOffset} stopColor="#F59E0B" />}
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                  <linearGradient id="fillGradientFng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={topColor} stopOpacity={0.2} />
                    {hasYellowStop && <stop offset={yellowOffset} stopColor="#F59E0B" stopOpacity={0.1} />}
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.06)" 
                  tick={{ fill: '#71717A', fontSize: 11, fontWeight: '500' }} 
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.06)" 
                  tick={{ fill: '#71717A', fontSize: 11, fontWeight: '500' }} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const color = data.value <= 25 ? "#EF4444" : data.value <= 45 ? "#F59E0B" : data.value <= 55 ? "#A1A1AA" : "#10B981";
                      return (
                        <div className="bg-[#09090b] border border-white/[0.06] rounded-xl p-4 shadow-xl">
                          <div className="text-[11px] font-medium text-zinc-500 mb-1">{data.date}</div>
                          <div className="text-2xl font-semibold" style={{ color }}>
                            {data.value} <span className="text-[13px] text-zinc-400 font-medium ml-1">{data.classification}</span>
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
                  stroke="url(#strokeGradientFng)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#fillGradientFng)" 
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
