import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import DepositModal from "./DepositModal";
import WithdrawModal from "./WithdrawModal";
import type { Holding, TaxSummary } from "./PortfolioUtils";

interface DashboardCardsProps {
  totalValue: number;
  change24hValue: number;
  change24hPct: number;
  totalPnl: number;
  totalCost: number;
  taxData: TaxSummary;
  allocation: { name: string; value: number; pct: number; color: string }[];
  buyingPower: number;
  chartData: { time: string; value: number }[];
  holdings: Holding[];
}

const usd = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DashboardCards({
  totalValue,
  change24hValue,
  change24hPct,
  totalPnl,
  totalCost,
  taxData,
  allocation,
  buyingPower,
  chartData,
  holdings,
}: DashboardCardsProps) {
  const { t } = useTranslation();
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const isUp = change24hValue >= 0;
  const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  // Below ~2 points there is no line to draw, so the card shows nothing rather
  // than a flat placeholder that implies data we don't have.
  const hasSparkline = chartData.length >= 2;

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Card 1: Total Equity */}
      <div className="p-6 rounded-[20px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] backdrop-blur-xl shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[12px] font-bold text-[var(--text-muted)] mb-1">{t("portfolio.cards.total_equity")}</div>
            <div className="text-3xl font-black text-[var(--text-main)]">${usd(totalValue)}</div>
          </div>
          <div className="w-24 h-10 opacity-70">
            {hasSparkline && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={isUp ? "var(--positive)" : "var(--negative)"}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold border-t border-[var(--border-subtle)] pt-4">
          <div>
            <div className="text-[var(--text-muted)] mb-1">{t("portfolio.cards.change_24h")}</div>
            <div className={isUp ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
              {isUp ? "+" : "-"}${usd(Math.abs(change24hValue))}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-muted)] mb-1">{t("portfolio.cards.change_24h_pct")}</div>
            <div className={isUp ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
              {isUp ? "+" : ""}{change24hPct.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-[var(--text-muted)] mb-1">{t("portfolio.cards.unrealized_pnl")}</div>
            {totalCost > 0 ? (
              <div className={totalPnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
                {totalPnl >= 0 ? "+" : "-"}${usd(Math.abs(totalPnl))}
                <span className="text-[var(--text-faint)] font-medium ml-1">({pnlPct.toFixed(1)}%)</span>
              </div>
            ) : (
              <div className="text-[var(--text-faint)]" title={t("portfolio.cards.unrealized_hint")}>—</div>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Allocation */}
      <div className="p-6 rounded-[20px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] backdrop-blur-xl shadow-sm flex flex-col justify-between">
        <div className="text-[12px] font-bold text-[var(--text-muted)] mb-6">{t("portfolio.cards.allocation")}</div>
        {allocation.length > 0 ? (
          <>
            <div className="flex h-3 rounded-full overflow-hidden mb-6">
              {allocation.map((item) => (
                <div key={item.name} style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              {allocation.slice(0, 4).map((item) => (
                <div key={item.name} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[var(--text-muted)]">{item.name}</span>
                  </div>
                  <div className="text-[var(--text-main)] text-[13px]">{item.pct.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center text-[12px] text-[var(--text-faint)] pb-2">
            {t("portfolio.cards.allocation_empty")}
          </div>
        )}
      </div>

      {/* Card 3: Buying Power */}
      <div className="p-6 rounded-[20px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] backdrop-blur-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[var(--accent-muted)] border-b border-l border-[var(--border-subtle)] text-[9px] font-black px-3 py-1 rounded-bl-lg text-[var(--text-main)]">
          {t("portfolio.cards.stablecoins")}
        </div>
        <div>
          <div className="text-[12px] font-bold text-[var(--text-muted)] mb-1">{t("portfolio.cards.buying_power")}</div>
          <div className="text-2xl font-black text-[var(--text-main)] mb-2">${usd(buyingPower)}</div>
          <div className="text-[11px] font-bold text-[var(--text-muted)] mb-6">
            {taxData.hasData ? (
              <>
                {t("portfolio.cards.realized_year", { year: taxData.currentYear })}{" "}
                <span className={taxData.currentYearRealized >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
                  {taxData.currentYearRealized >= 0 ? "+" : "-"}${usd(Math.abs(taxData.currentYearRealized))}
                </span>
              </>
            ) : (
              <span className="text-[var(--text-faint)]">{t("portfolio.cards.no_realized")}</span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDepositOpen(true)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-[var(--text-main)] font-bold py-2.5 rounded-3xl text-[13px] transition-all flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={16} /> {t("portfolio.cards.deposit")}
          </button>
          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-base)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] font-bold py-2.5 rounded-3xl text-[13px] transition-all flex items-center justify-center gap-2"
          >
            <ArrowDownRight size={16} /> {t("portfolio.cards.withdraw")}
          </button>
        </div>
      </div>
    </div>

      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} holdings={holdings} />
    </>
  );
}
