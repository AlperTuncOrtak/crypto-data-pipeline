import React, { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Search, Filter } from "lucide-react";

interface HistoryTabProps {
  trades: any[];
}

export default function HistoryTab({ trades }: HistoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTrades = trades
    .filter((t) => t.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.traded_at).getTime() - new Date(a.traded_at).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-1">Transaction History</h2>
          <p className="text-[13px] text-[var(--text-muted)]">All your manual trades and synced exchange history</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl pl-10 pr-4 py-2 text-[13px] text-[var(--text-main)] focus:outline-none focus:border-[#14F195]/50 transition-all"
            />
          </div>
          <button className="flex items-center justify-center w-10 h-10 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl rounded-[20px] overflow-hidden">
        {filteredTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-subtle)]">
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Source</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-gray-300 divide-y divide-white/5">
                {filteredTrades.map((trade, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-overlay)] transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--text-main)] flex items-center gap-3">
                      <img
                        src={`https://assets.coincap.io/assets/icons/${trade.symbol.toLowerCase()}@2x.png`}
                        className="w-6 h-6 rounded-full bg-[var(--bg-subtle)]"
                        alt={trade.symbol}
                        onError={(e: any) => {
                          e.target.src = "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=024";
                        }}
                      />
                      {trade.symbol.toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl text-[11px] font-bold ${
                          trade.side === "buy" ? "bg-[var(--positive-muted)] text-[var(--positive)]" : "bg-[var(--negative-muted)] text-[var(--negative)]"
                        }`}
                      >
                        {trade.side === "buy" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        {trade.side.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      ${Number(trade.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td className="px-6 py-4 font-medium text-[var(--text-main)]">
                      {trade.side === "buy" ? "+" : "-"}{Number(trade.quantity).toLocaleString()} {trade.symbol.toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      ${Number(trade.total || trade.quantity * trade.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">
                      {new Date(trade.traded_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-block px-2.5 py-1 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-muted)] capitalize">
                        {trade.exchange || "Manual"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center opacity-50">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
              <Filter size={24} className="text-[var(--text-muted)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">No Transactions Found</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md">
              We couldn't find any trades matching your criteria. Try syncing an exchange or uploading a CSV file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
