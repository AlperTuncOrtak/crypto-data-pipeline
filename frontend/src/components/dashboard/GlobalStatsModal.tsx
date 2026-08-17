import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { X, Activity, BarChart2, PieChart } from "lucide-react";

interface GlobalStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  type: "mcap" | "volume" | "dominance";
}

export function GlobalStatsModal({ isOpen, onClose, data, type }: GlobalStatsModalProps) {
  // Format data for recharts
  const chartData = (data || []).map(item => {
    const dateObj = new Date(item.date);
    return {
      ...item,
      displayDate: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  // Config based on type
  const config = {
    mcap: {
      title: "Global Market Cap",
      subtitle: "Total Crypto Market Capitalization (30 Days)",
      icon: <Activity size={24} strokeWidth={2.5} />,
      color: "#6366f1", // Electric Indigo
      dataKey: "total_market_cap",
      formatter: (val: number) => `$${(val / 1e12).toFixed(2)}T`,
    },
    volume: {
      title: "24h Trading Volume",
      subtitle: "Global Daily Volume (30 Days)",
      icon: <BarChart2 size={24} strokeWidth={2.5} />,
      color: "#0EA5E9", // Sky Blue
      dataKey: "total_volume",
      formatter: (val: number) => `$${(val / 1e9).toFixed(2)}B`,
    },
    dominance: {
      title: "Bitcoin Dominance",
      subtitle: "BTC Market Share % (30 Days)",
      icon: <PieChart size={24} strokeWidth={2.5} />,
      color: "#F59E0B", // Amber
      dataKey: "btc_dominance",
      formatter: (val: number) => `${val.toFixed(2)}%`,
    }
  };

  const activeConfig = config[type] || config.mcap;

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
            className="absolute inset-0 bg-[var(--bg-base)]/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-[var(--bg-elevated)] rounded-[24px] border border-[var(--border-subtle)] shadow-2xl overflow-hidden p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-[var(--border-subtle)] pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${activeConfig.color}20`, color: activeConfig.color }}>
                  {activeConfig.icon}
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold text-white tracking-tight">{activeConfig.title}</h2>
                  <p className="text-[13px] font-medium text-zinc-400 mt-1">{activeConfig.subtitle}</p>
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
              {chartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 font-medium text-[14px]">
                  Loading data...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="displayDate" 
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
                      tickFormatter={(val) => {
                        if (type === "mcap") return `${(val / 1e12).toFixed(1)}T`;
                        if (type === "volume") return `${(val / 1e9).toFixed(0)}B`;
                        return `${val.toFixed(0)}%`;
                      }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-xl">
                              <div className="text-[11px] font-medium text-zinc-500 mb-1">{data.displayDate}</div>
                              <div className="text-2xl font-semibold" style={{ color: activeConfig.color }}>
                                {activeConfig.formatter(data[activeConfig.dataKey])}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={activeConfig.dataKey} 
                      stroke={activeConfig.color} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill={`url(#gradient-${type})`} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
