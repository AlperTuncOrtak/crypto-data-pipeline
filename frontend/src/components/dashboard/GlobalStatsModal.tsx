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
      icon: <Activity size={20} />,
      color: "#8b5cf6", // Purple
      dataKey: "total_market_cap",
      formatter: (val: number) => `$${(val / 1e12).toFixed(2)}T`,
    },
    volume: {
      title: "24h Trading Volume",
      subtitle: "Global Daily Volume (30 Days)",
      icon: <BarChart2 size={20} />,
      color: "#0ea5e9", // Sky Blue
      dataKey: "total_volume",
      formatter: (val: number) => `$${(val / 1e9).toFixed(2)}B`,
    },
    dominance: {
      title: "Bitcoin Dominance",
      subtitle: "BTC Market Share % (30 Days)",
      icon: <PieChart size={20} />,
      color: "#f59e0b", // Amber/Orange
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
            className="absolute inset-0 bg-[#0a0b0d]/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-2xl bg-[#27272a]/90 backdrop-blur-xl border border-white/5 rounded-[24px] shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-white/5" style={{ color: activeConfig.color }}>
                  {activeConfig.icon}
                </div>
                <div>
                  <h2 className="text-xl font-medium text-white tracking-tight">{activeConfig.title}</h2>
                  <p className="text-sm text-[#a1a1aa]">{activeConfig.subtitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 text-[#a1a1aa] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full mt-4">
              {chartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Loading data...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="displayDate" 
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
                      tickFormatter={(val) => {
                        if (type === "mcap") return `${(val / 1e12).toFixed(1)}T`;
                        if (type === "volume") return `${(val / 1e9).toFixed(0)}B`;
                        return `${val.toFixed(0)}%`;
                      }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#19191c]/90 border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-xl">
                              <div className="text-xs text-[#a1a1aa] mb-1">{data.displayDate}</div>
                              <div className="text-lg font-bold font-mono" style={{ color: activeConfig.color }}>
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
