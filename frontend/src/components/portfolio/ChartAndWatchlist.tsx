import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, LineChart, Line } from "recharts";

interface ChartAndWatchlistProps {
  change24hPct: number;
  chartData: any[];
  holdings: any[];
  sparklines: Record<string, any[]>;
  marketNews: any[];
}

export default function ChartAndWatchlist({
  change24hPct,
  chartData,
  holdings,
  sparklines,
  marketNews,
}: ChartAndWatchlistProps) {
  return (
    <>
      {/* MIDDLE ROW: Chart & Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Return Chart */}
        <div className="lg:col-span-2 p-6 rounded-[20px] bg-[#09090b]/40 backdrop-blur-xl border border-white/[0.04] shadow-xl">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-[15px] font-bold text-white">Cumulative return</h3>
            <div className="flex gap-6">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white/40 mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Portfolio (24H)
                </span>
                <span className={`text-[13px] font-black ${change24hPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {change24hPct >= 0 ? "+" : ""}{change24hPct.toFixed(2)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white/40 mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div> BTC
                </span>
                <span className="text-[13px] font-black text-rose-400">-0.33%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white/40 mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div> ETH
                </span>
                <span className="text-[13px] font-black text-rose-400">-4.27%</span>
              </div>
            </div>
          </div>
          <div className="h-[260px] w-full relative" style={{ touchAction: 'pan-y' }}>
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--positive)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d31" vertical={false} />
                  <XAxis dataKey="time" stroke="#4a4d51" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#4a4d51" fontSize={10} tickFormatter={(val) => '$' + (val / 1000) + 'k'} axisLine={false} tickLine={false} />
                  <RechartTooltip
                    contentStyle={{ backgroundColor: '#1a1d21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: number) => ['$' + value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), 'Portfolio Value']}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--positive)" strokeWidth={3} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 border border-dashed border-white/[0.04] rounded-[12px] bg-white/[0.02]">
                <span className="text-[14px] font-bold">No Historical Data</span>
                <span className="text-[12px]">Portfolio chart will populate soon as data is collected.</span>
              </div>
            )}
          </div>
        </div>

        {/* Watchlist Grid */}
        <div className="p-6 rounded-[20px] bg-[#09090b]/40 backdrop-blur-xl border border-white/[0.04] shadow-xl flex flex-col">
          <div className="relative z-10 flex gap-4 mb-6 border-b border-white/[0.04] pb-3">
            <button className="relative z-20 text-[12px] font-bold text-white border-b-2 border-white pb-3 -mb-[13px] cursor-pointer">Watchlist</button>
            <button className="relative z-20 text-[12px] font-bold text-white/40 hover:text-white transition-colors pb-3 -mb-[13px] cursor-pointer">Trending</button>
            <button className="relative z-20 text-[12px] font-bold text-white/40 hover:text-white transition-colors pb-3 -mb-[13px] cursor-pointer">Top Gainers</button>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            {holdings.slice(0, 4).map((asset, i) => (
              <div key={i} className="bg-white/[0.02] rounded-3xl p-3 flex flex-col justify-between border border-white/[0.04] hover:border-white/[0.08] transition-colors cursor-pointer group">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <img src={`https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`} className="w-5 h-5 rounded-full" alt={asset.symbol} onError={(e: any) => { e.target.src = "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=024"; }} />
                    <span className="text-[11px] font-bold text-white truncate">{asset.symbol}</span>
                  </div>
                  <div className="text-[15px] font-black text-white">${(asset.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className={`text-[10px] font-bold ${(asset.change_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(asset.change_24h ?? 0) >= 0 ? '+' : ''}{(asset.change_24h ?? 0).toFixed(2)}%
                  </div>
                </div>
                {/* Sparkline */}
                <div className="h-10 mt-2 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklines[asset.symbol] || []}>
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={(asset.change_24h ?? 0) >= 0 ? "var(--positive)" : "var(--negative)"}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

