import React, { useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, LineChart, Line } from "recharts";
import type { Holding } from "./PortfolioUtils";

type TabId = "holdings" | "trending" | "gainers";

const TABS: { id: TabId; label: string }[] = [
  { id: "holdings", label: "Holdings" },
  { id: "trending", label: "Trending" },
  { id: "gainers", label: "Top Gainers" },
];

interface ChartAndWatchlistProps {
  change24hPct: number;
  chartData: { time: string; value: number }[];
  isChartLoading: boolean;
  timeframeLabel: string;
  holdings: Holding[];
  marketData: any[];
  sparklines: Record<string, { price: number; time: string }[]>;
}

interface Tile {
  symbol: string;
  price: number;
  change: number;
  image_url?: string;
}

export default function ChartAndWatchlist({
  change24hPct,
  chartData,
  isChartLoading,
  timeframeLabel,
  holdings,
  marketData,
  sparklines,
}: ChartAndWatchlistProps) {
  const [activeTab, setActiveTab] = useState<TabId>("holdings");

  // The two benchmark figures used to be hardcoded. They now come from the
  // same market feed as the rest of the page.
  const benchmark = (symbol: string) => {
    const coin = (marketData || []).find((c) => c.symbol?.toUpperCase() === symbol);
    const pct = coin ? Number(coin.price_change_percentage_24h) : NaN;
    return isFinite(pct) ? pct : null;
  };

  const btcChange = benchmark("BTC");
  const ethChange = benchmark("ETH");

  const tiles: Tile[] = useMemo(() => {
    if (activeTab === "holdings") {
      return holdings.slice(0, 4).map((h) => ({
        symbol: h.symbol,
        price: h.current_price || 0,
        change: h.change_24h ?? 0,
        image_url: h.image_url,
      }));
    }

    const list = (marketData || []).filter((c) => c?.symbol);
    const sorted =
      activeTab === "trending"
        ? list.slice().sort((a, b) => (Number(b.total_volume) || 0) - (Number(a.total_volume) || 0))
        : list
            .slice()
            .sort(
              (a, b) =>
                (Number(b.price_change_percentage_24h) || 0) - (Number(a.price_change_percentage_24h) || 0)
            );

    return sorted.slice(0, 4).map((c) => ({
      symbol: String(c.symbol).toUpperCase(),
      price: Number(c.current_price) || 0,
      change: Number(c.price_change_percentage_24h) || 0,
      image_url: c.image_url,
    }));
  }, [activeTab, holdings, marketData]);

  const emptyTabMessage =
    activeTab === "holdings"
      ? "No assets yet — connect a wallet or import your trades."
      : "Market data is unavailable right now.";

  return (
    <>
      {/* MIDDLE ROW: Chart & Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio value chart */}
        <div className="lg:col-span-2 p-6 rounded-[20px] bg-[#09090b]/40 backdrop-blur-xl border border-white/[0.04] shadow-xl">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
            <h3 className="text-[15px] font-bold text-white">Portfolio value</h3>
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
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div> BTC (24H)
                </span>
                <span className={`text-[13px] font-black ${btcChange === null ? "text-white/30" : btcChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {btcChange === null ? "—" : `${btcChange >= 0 ? "+" : ""}${btcChange.toFixed(2)}%`}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white/40 mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div> ETH (24H)
                </span>
                <span className={`text-[13px] font-black ${ethChange === null ? "text-white/30" : ethChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {ethChange === null ? "—" : `${ethChange >= 0 ? "+" : ""}${ethChange.toFixed(2)}%`}
                </span>
              </div>
            </div>
          </div>
          <div className="h-[260px] w-full relative" style={{ touchAction: 'pan-y' }}>
            {isChartLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-white/40">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--positive)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d31" vertical={false} />
                  <XAxis dataKey="time" stroke="#4a4d51" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis
                    stroke="#4a4d51"
                    fontSize={10}
                    domain={['auto', 'auto']}
                    tickFormatter={(val: number) =>
                      Math.abs(val) >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val.toFixed(0)}`
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartTooltip
                    contentStyle={{ backgroundColor: '#1a1d21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: number) => ['$' + value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), 'Portfolio Value']}
                    labelFormatter={(label) => `${timeframeLabel} · ${label}`}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--positive)" strokeWidth={3} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 border border-dashed border-white/[0.04] rounded-[12px] bg-white/[0.02] text-center px-6">
                <span className="text-[14px] font-bold">No Historical Data</span>
                <span className="text-[12px]">
                  {holdings.length === 0
                    ? "Connect a wallet or import trades to start tracking."
                    : "Not enough price history for this range yet."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Watchlist Grid */}
        <div className="p-6 rounded-[20px] bg-[#09090b]/40 backdrop-blur-xl border border-white/[0.04] shadow-xl flex flex-col">
          <div className="relative z-10 flex gap-4 mb-6 border-b border-white/[0.04] pb-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-20 text-[12px] font-bold pb-3 -mb-[13px] cursor-pointer transition-colors ${
                  activeTab === tab.id
                    ? "text-white border-b-2 border-white"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {tiles.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-[12px] text-white/30 px-4">
              {emptyTabMessage}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 flex-1">
              {tiles.map((asset) => (
                <div key={asset.symbol} className="bg-white/[0.02] rounded-3xl p-3 flex flex-col justify-between border border-white/[0.04] hover:border-white/[0.08] transition-colors group">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={asset.image_url || `https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`}
                        className="w-5 h-5 rounded-full"
                        alt={asset.symbol}
                        onError={(e: any) => { e.target.style.visibility = "hidden"; }}
                      />
                      <span className="text-[11px] font-bold text-white truncate">{asset.symbol}</span>
                    </div>
                    <div className="text-[15px] font-black text-white">
                      ${asset.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: asset.price < 1 ? 6 : 2,
                      })}
                    </div>
                    <div className={`text-[10px] font-bold ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                    </div>
                  </div>
                  {/* Sparkline */}
                  <div className="h-10 mt-2 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {(sparklines?.[asset.symbol]?.length ?? 0) > 1 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklines[asset.symbol]}>
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke={asset.change >= 0 ? "var(--positive)" : "var(--negative)"}
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
