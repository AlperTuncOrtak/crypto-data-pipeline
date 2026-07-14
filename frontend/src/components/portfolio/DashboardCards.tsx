import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";

interface DashboardCardsProps {
  totalValue: number;
  totalPnl: number;
  totalCost: number;
  taxData: any;
  allocation: any[];
  buyingPower: number;
  setActiveTab: (tab: string) => void;
}

export default function DashboardCards({
  totalValue,
  totalPnl,
  totalCost,
  taxData,
  allocation,
  buyingPower,
  setActiveTab,
}: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Card 1: Total Equity */}
      <div className="p-6 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col justify-between">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[12px] font-bold text-gray-500 mb-1">Total equity</div>
            <div className="text-3xl font-black text-white">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          {/* Mini Sparkline Placeholder */}
          <div className="w-24 h-10 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{ v: 10 }, { v: 12 }, { v: 9 }, { v: 15 }, { v: 14 }, { v: 18 }]}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#14F195"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold border-t border-white/5 pt-4">
          <div>
            <div className="text-gray-500 mb-1">P&L</div>
            <div className={totalPnl >= 0 ? "text-[#14F195]" : "text-red-400"}>
              {totalPnl >= 0 ? "+" : "-"}$
              {Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Gain</div>
            <div className={totalPnl >= 0 ? "text-[#14F195]" : "text-red-400"}>
              {totalCost > 0 ? `${totalPnl >= 0 ? "+" : ""}${((totalPnl / totalCost) * 100).toFixed(2)}%` : "—"}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Realized</div>
            <div className={taxData.net >= 0 ? "text-[#14F195]" : "text-red-400"}>
              {taxData.net >= 0 ? "+" : "-"}$
              {Math.abs(taxData.net).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Allocation */}
      <div className="p-6 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col justify-between">
        <div className="text-[12px] font-bold text-gray-500 mb-6">Allocation</div>
        <div className="flex h-3 rounded-full overflow-hidden mb-6">
          {allocation.map((item, i) => (
            <div key={i} style={{ width: `${item.pct}%`, backgroundColor: item.color }}></div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold">
          {allocation.map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-500">{item.name}</span>
              </div>
              <div className="text-white text-[13px]">{item.pct.toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Buying Power */}
      <div className="p-6 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-[9px] font-black px-3 py-1 rounded-bl-lg text-white">
          Stablecoins
        </div>
        <div>
          <div className="text-[12px] font-bold text-gray-500 mb-1">Buying power</div>
          <div className="text-2xl font-black text-white mb-6">
            ${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("swap")}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl text-[13px] transition-all flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={16} /> Deposit
          </button>
          <button
            onClick={() => setActiveTab("swap")}
            className="flex-1 bg-[#1a1d21] border border-white/10 hover:bg-[#2a2d31] text-white font-bold py-2.5 rounded-xl text-[13px] transition-all flex items-center justify-center gap-2"
          >
            <ArrowDownRight size={16} /> Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
