import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip as RechartTooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, Activity } from "lucide-react";
import { CHART_COLORS, calcAllocation } from "./PortfolioUtils";

interface AnalyticsTabProps {
  holdings: any[];
}

export default function AnalyticsTab({ holdings }: AnalyticsTabProps) {
  const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);

  const allocation = useMemo(() => calcAllocation(holdings), [holdings]);

  const assetData = useMemo(() => {
    const data = holdings
      .filter((h) => h.value > 0)
      .map((h) => ({
        name: h.symbol.toUpperCase(),
        value: h.value,
      }))
      .sort((a, b) => b.value - a.value);
    
    // Group small assets into "Other"
    if (data.length > 6) {
      const top5 = data.slice(0, 5);
      const others = data.slice(5).reduce((sum, curr) => sum + curr.value, 0);
      return [...top5, { name: "Other", value: others }];
    }
    return data;
  }, [holdings]);

  const { bestPerformer, worstPerformer } = useMemo(() => {
    let best = null;
    let worst = null;
    holdings.forEach((h) => {
      if (!h.cost_basis || h.cost_basis <= 0) return;
      const roi = (h.value - h.cost_basis) / h.cost_basis;
      if (!best || roi > best.roi) best = { ...h, roi };
      if (!worst || roi < worst.roi) worst = { ...h, roi };
    });
    return { bestPerformer: best, worstPerformer: worst };
  }, [holdings]);

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1d21] border border-white/10 p-3 rounded-xl shadow-xl">
          <p className="text-white font-bold text-[13px] mb-1">{payload[0].name}</p>
          <p className="text-[#14F195] font-black text-[15px]">
            ${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-gray-400 font-medium text-[11px] mt-1">
            {((payload[0].value / totalValue) * 100).toFixed(2)}% of Portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Portfolio Analytics</h2>
          <p className="text-[13px] text-gray-400">Deep dive into your asset allocation and performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation Pie */}
        <div className="p-6 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={18} className="text-[#14F195]" />
            <h3 className="text-[15px] font-bold text-white">Asset Allocation</h3>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="w-[200px] h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartTooltip content={renderCustomTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              {assetData.map((asset, index) => (
                <div key={index} className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-[12px] font-bold text-gray-300">{asset.name}</span>
                  </div>
                  <span className="text-[13px] font-black text-white">
                    {((asset.value / totalValue) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Allocation Pie */}
        <div className="p-6 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={18} className="text-blue-400" />
            <h3 className="text-[15px] font-bold text-white">Category Exposure</h3>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="w-[200px] h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation.filter((a) => a.pct > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="pct"
                    stroke="none"
                  >
                    {allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartTooltip 
                    contentStyle={{ backgroundColor: '#1a1d21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(val: number) => [`${val.toFixed(2)}%`, 'Allocation']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              {allocation.filter(a => a.pct > 0).map((cat, index) => (
                <div key={index} className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-[12px] font-bold text-gray-300">{cat.name}</span>
                  </div>
                  <span className="text-[13px] font-black text-white">
                    {cat.pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Best & Worst Performers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-[20px] bg-gradient-to-br from-[#14F195]/10 to-transparent border border-[#14F195]/20 flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-[#14F195]/20 flex items-center justify-center shrink-0">
            <TrendingUp size={24} className="text-[#14F195]" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">Top Performer</p>
            {bestPerformer ? (
              <>
                <h4 className="text-2xl font-black text-white">{bestPerformer.symbol.toUpperCase()}</h4>
                <p className="text-[14px] font-bold text-[#14F195]">+{ (bestPerformer.roi * 100).toFixed(2) }% ROI</p>
              </>
            ) : (
              <p className="text-[14px] text-gray-500 font-medium">No data available</p>
            )}
          </div>
        </div>

        <div className="p-6 rounded-[20px] bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <TrendingDown size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">Worst Performer</p>
            {worstPerformer ? (
              <>
                <h4 className="text-2xl font-black text-white">{worstPerformer.symbol.toUpperCase()}</h4>
                <p className="text-[14px] font-bold text-red-400">{ (worstPerformer.roi * 100).toFixed(2) }% ROI</p>
              </>
            ) : (
              <p className="text-[14px] text-gray-500 font-medium">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
