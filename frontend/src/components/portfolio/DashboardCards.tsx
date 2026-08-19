import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import DepositModal from "./DepositModal";
import WithdrawModal from "./WithdrawModal";

interface DashboardCardsProps {
  totalValue: number;
  totalPnl: number;
  totalCost: number;
  taxData: any;
  allocation: any[];
  buyingPower: number;
  setActiveTab: (tab: string) => void;
  holdings?: any[];
}

export default function DashboardCards({
  totalValue,
  totalPnl,
  totalCost,
  taxData,
  allocation,
  buyingPower,
  setActiveTab,
  holdings = [],
}: DashboardCardsProps) {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Card 1: Total Equity */}
      <div className="p-6 rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[12px] font-bold text-[var(--text-muted)] mb-1">Total equity</div>
            <div className="text-3xl font-black text-[var(--text-main)]">
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
                  stroke="var(--positive)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold border-t border-[var(--border-subtle)] pt-4">
          <div>
            <div className="text-[var(--text-muted)] mb-1">P&L</div>
            <div className={totalPnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
              {totalPnl >= 0 ? "+" : "-"}$
              {Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-muted)] mb-1">Gain</div>
            <div className={totalPnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
              {totalCost > 0 ? `${totalPnl >= 0 ? "+" : ""}${((totalPnl / totalCost) * 100).toFixed(2)}%` : "—"}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-muted)] mb-1">Realized</div>
            <div className={taxData.net >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
              {taxData.net >= 0 ? "+" : "-"}$
              {Math.abs(taxData.net).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Allocation */}
      <div className="p-6 rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between">
        <div className="text-[12px] font-bold text-[var(--text-muted)] mb-6">Allocation</div>
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
                <span className="text-[var(--text-muted)]">{item.name}</span>
              </div>
              <div className="text-[var(--text-main)] text-[13px]">{item.pct.toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Buying Power */}
      <div className="p-6 rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[var(--accent-muted)] border-b border-l border-[var(--border-subtle)] text-[9px] font-black px-3 py-1 rounded-bl-lg text-[var(--text-main)]">
          Stablecoins
        </div>
        <div>
          <div className="text-[12px] font-bold text-[var(--text-muted)] mb-1">Buying power</div>
          <div className="text-2xl font-black text-[var(--text-main)] mb-6">
            ${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDepositOpen(true)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-[var(--text-main)] font-bold py-2.5 rounded-3xl text-[13px] transition-all flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={16} /> Deposit
          </button>
          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-base)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] font-bold py-2.5 rounded-3xl text-[13px] transition-all flex items-center justify-center gap-2"
          >
            <ArrowDownRight size={16} /> Withdraw
          </button>
        </div>
      </div>
    </div>

      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} holdings={holdings} />
    </>
  );
}
