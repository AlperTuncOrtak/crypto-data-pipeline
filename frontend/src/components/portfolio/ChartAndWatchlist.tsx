import React from "react";
import { Plus, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, LineChart, Line } from "recharts";

interface ChartAndWatchlistProps {
  totalPnl: number;
  totalCost: number;
  chartData: any[];
  holdings: any[];
  sparklines: Record<string, any[]>;
  marketNews: any[];
}

export default function ChartAndWatchlist({
  totalPnl,
  totalCost,
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
        <div className="lg:col-span-2 p-6 rounded-[20px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-[15px] font-bold text-[var(--text-main)]">Cumulative return</h3>
            <div className="flex gap-6">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[var(--positive)] rounded-full"></div> Portfolio
                </span>
                <span className={`text-[13px] font-black ${totalPnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                  {totalCost > 0 ? `${totalPnl >= 0 ? "+" : ""}${((totalPnl / totalCost) * 100).toFixed(2)}%` : "0.00%"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div> BTC
                </span>
                <span className="text-[13px] font-black text-[var(--negative)]">-0.33%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div> ETH
                </span>
                <span className="text-[13px] font-black text-[var(--negative)]">-4.27%</span>
              </div>
            </div>
          </div>
          <div className="h-[260px] w-full" style={{ touchAction: 'pan-y' }}>
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
          </div>
        </div>

        {/* Watchlist Grid */}
        <div className="p-6 rounded-[20px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl flex flex-col">
          <div className="relative z-10 flex gap-4 mb-6 border-b border-[var(--border-subtle)] pb-3">
            <button className="relative z-20 text-[12px] font-bold text-[var(--text-main)] border-b-2 border-white pb-3 -mb-[13px] cursor-pointer">Watchlist</button>
            <button className="relative z-20 text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors pb-3 -mb-[13px] cursor-pointer">Trending</button>
            <button className="relative z-20 text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors pb-3 -mb-[13px] cursor-pointer">Top Gainers</button>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            {holdings.slice(0, 4).map((asset, i) => (
              <div key={i} className="bg-[var(--bg-elevated)] rounded-3xl p-3 flex flex-col justify-between border border-[var(--border-subtle)] hover:border-[var(--border-base)] transition-colors cursor-pointer group">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <img src={`https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`} className="w-5 h-5 rounded-full" alt={asset.symbol} onError={(e: any) => { e.target.src = "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=024"; }} />
                    <span className="text-[11px] font-bold text-[var(--text-main)] truncate">{asset.symbol}</span>
                  </div>
                  <div className="text-[15px] font-black text-[var(--text-main)]">${(asset.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className={`text-[10px] font-bold ${(asset.change_24h ?? 0) >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                    {(asset.change_24h ?? 0) >= 0 ? '+' : ''}{(asset.change_24h ?? 0).toFixed(2)}%
                  </div>
                </div>
                {/* Sparkline */}
                <div className="h-10 mt-2 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklines?.[asset.symbol.toUpperCase()] || [{ price: 0 }, { price: 0 }]}>
                      <Line type="monotone" dataKey="price" stroke={(asset.change_24h ?? 0) >= 0 ? "var(--positive)" : "var(--negative)"} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 w-full py-2.5 rounded-3xl border border-[var(--border-base)] text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)] transition-all flex items-center justify-center gap-2">
            <Plus size={14} /> Add asset
          </button>
        </div>
      </div>

      {/* BOTTOM ROW: Events & News */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="p-6 rounded-[20px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-bold text-[var(--text-main)]">Upcoming events</h3>
            <button className="text-[11px] font-bold text-blue-500 hover:text-blue-400">View details &gt;</button>
          </div>
          <div className="space-y-4">
            {[
              { date: 'APR 19', title: 'Bitcoin Halving', desc: 'Block subsidy drops to 3.125 BTC', icon: '₿' },
              { date: 'MAY 23', title: 'Ethereum ETF Decision', desc: 'SEC final deadline for VanEck Spot ETH', icon: 'Ξ' },
              { date: 'JUN 12', title: 'FOMC Meeting', desc: 'Fed Interest Rate Decision', icon: '🏛️' }
            ].map((event, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-3xl hover:bg-[var(--border-subtle)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border-subtle)]">
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] shrink-0">
                  <span className="text-[9px] font-bold text-[var(--text-muted)]">{event.date.split(' ')[0]}</span>
                  <span className="text-[14px] font-black text-[var(--text-main)]">{event.date.split(' ')[1]}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-[13px] font-bold text-[var(--text-main)]">{event.title}</h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{event.desc}</p>
                </div>
                <div className="text-xl opacity-50">{event.icon}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent News */}
        <div className="p-6 rounded-[20px] bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-bold text-[var(--text-main)]">Recent news</h3>
            <button className="text-[11px] font-bold text-blue-500 hover:text-blue-400">View details &gt;</button>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {marketNews && marketNews.length > 0 ? (
              marketNews.map((newsItem: any, i: number) => (
                <a key={i} href={newsItem.url} target="_blank" rel="noopener noreferrer" className="flex gap-4 group p-2 rounded-3xl hover:bg-[var(--border-subtle)] transition-colors">
                  <div className="w-16 h-12 bg-[var(--bg-elevated)] rounded-2xl overflow-hidden shrink-0 border border-[var(--border-subtle)]">
                    <img src={newsItem.imageurl || `https://picsum.photos/seed/${newsItem.id}/100/100`} alt="news" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex flex-col justify-between">
                    <p className="text-[12px] text-gray-300 font-medium leading-tight group-hover:text-[var(--text-main)] transition-colors line-clamp-2">
                      {newsItem.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{newsItem.source}</span>
                      <span className="text-[9px] text-[var(--positive)] opacity-80">{new Date(newsItem.published_on * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-3 pt-6">
                <Activity className="text-[var(--positive)] animate-pulse" size={14} />
                <div className="text-xs font-semibold text-[var(--positive)] uppercase tracking-widest">Fetching Live Intel</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
