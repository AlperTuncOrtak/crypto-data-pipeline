import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, LineChart, Line } from "recharts";
import type { Holding } from "./PortfolioUtils";

type TabId = "holdings" | "trending" | "gainers";

const TABS: TabId[] = ["holdings", "trending", "gainers"];
const TAB_KEYS: Record<TabId, string> = {
  holdings: "portfolio.watchlist.holdings",
  trending: "portfolio.watchlist.trending",
  gainers: "portfolio.watchlist.gainers",
};

interface ChartAndWatchlistProps {
  change24hPct: number;
  chartData: { time: string; value: number }[];
  isChartLoading: boolean;
  timeframeLabel: string;
  chartSource: "snapshots" | "reconstructed";
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
  chartSource,
  holdings,
  marketData,
  sparklines,
}: ChartAndWatchlistProps) {
  const { t } = useTranslation();
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

  const emptyTabMessage = t(
    activeTab === "holdings" ? "portfolio.watchlist.empty_holdings" : "portfolio.watchlist.empty_market"
  );

  return (
    <>
      {/* MIDDLE ROW: Chart & Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio value chart */}
        <div className="lg:col-span-2 p-6 rounded-[20px] bg-[var(--bg-subtle)] backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
            <div>
              <h3 className="text-[15px] font-bold text-[var(--text-main)]">{t("portfolio.chart.title")}</h3>
              {/* The reconstruction prices today's quantities at past prices, so it
                  is not what the portfolio was actually worth. Say so rather than
                  letting the line imply a history the user did not have. */}
              <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
                {t(chartSource === "snapshots" ? "portfolio.chart.from_snapshots" : "portfolio.chart.estimated")}
              </p>
            </div>
            <div className="flex gap-6">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[var(--positive)] rounded-full"></div> {t("portfolio.chart.portfolio_24h")}
                </span>
                <span className={`text-[13px] font-black ${change24hPct >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                  {change24hPct >= 0 ? "+" : ""}{change24hPct.toFixed(2)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div> {t("portfolio.chart.btc_24h")}
                </span>
                <span className={`text-[13px] font-black ${btcChange === null ? "text-[var(--text-faint)]" : btcChange >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                  {btcChange === null ? "—" : `${btcChange >= 0 ? "+" : ""}${btcChange.toFixed(2)}%`}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div> {t("portfolio.chart.eth_24h")}
                </span>
                <span className={`text-[13px] font-black ${ethChange === null ? "text-[var(--text-faint)]" : ethChange >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                  {ethChange === null ? "—" : `${ethChange >= 0 ? "+" : ""}${ethChange.toFixed(2)}%`}
                </span>
              </div>
            </div>
          </div>
          <div className="h-[260px] w-full relative" style={{ touchAction: 'pan-y' }}>
            {isChartLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--text-faint)" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis
                    stroke="var(--text-faint)"
                    fontSize={10}
                    domain={['auto', 'auto']}
                    tickFormatter={(val: number) =>
                      Math.abs(val) >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val.toFixed(0)}`
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartTooltip
                    contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-base)', borderRadius: '12px' }}
                    itemStyle={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: number) => ['$' + value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), t("portfolio.chart.tooltip_value")]}
                    labelFormatter={(label) => `${timeframeLabel} · ${label}`}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--positive)" strokeWidth={3} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-[12px] bg-[var(--bg-overlay)] text-center px-6">
                <span className="text-[14px] font-bold">{t("portfolio.chart.no_data")}</span>
                <span className="text-[12px]">
                  {t(holdings.length === 0 ? "portfolio.chart.no_data_connect" : "portfolio.chart.no_data_range")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Watchlist Grid */}
        <div className="p-6 rounded-[20px] bg-[var(--bg-subtle)] backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl flex flex-col">
          <div className="relative z-10 flex gap-4 mb-6 border-b border-[var(--border-subtle)] pb-3">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative z-20 text-[12px] font-bold pb-3 -mb-[13px] cursor-pointer transition-colors ${
                  activeTab === tab
                    ? "text-[var(--text-main)] border-b-2 border-[var(--text-main)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                {t(TAB_KEYS[tab])}
              </button>
            ))}
          </div>

          {tiles.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-[12px] text-[var(--text-faint)] px-4">
              {emptyTabMessage}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 flex-1">
              {tiles.map((asset) => (
                <div key={asset.symbol} className="bg-[var(--bg-overlay)] rounded-3xl p-3 flex flex-col justify-between border border-[var(--border-subtle)] hover:border-[var(--border-base)] transition-colors group">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={asset.image_url || `https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`}
                        className="w-5 h-5 rounded-full"
                        alt={asset.symbol}
                        onError={(e: any) => { e.target.style.visibility = "hidden"; }}
                      />
                      <span className="text-[11px] font-bold text-[var(--text-main)] truncate">{asset.symbol}</span>
                    </div>
                    <div className="text-[15px] font-black text-[var(--text-main)]">
                      ${asset.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: asset.price < 1 ? 6 : 2,
                      })}
                    </div>
                    <div className={`text-[10px] font-bold ${asset.change >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
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
