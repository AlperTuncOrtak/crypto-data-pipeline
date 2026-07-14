import React from "react";
import { Download, AlertCircle, FileText, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { exportTaxCSV } from "./PortfolioUtils";

interface TaxesTabProps {
  taxData: any;
}

export default function TaxesTab({ taxData }: TaxesTabProps) {
  if (!taxData) return null;

  const handleExport = () => {
    exportTaxCSV(taxData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Tax Center</h2>
          <p className="text-[13px] text-gray-400">Estimated capital gains and losses based on FIFO method</p>
        </div>
        <button
          onClick={handleExport}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-800/20 hover:from-blue-600/40 hover:to-blue-800/40 text-blue-400 border border-blue-500/30 font-bold py-2.5 px-5 rounded-xl text-[13px] transition-all shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
        >
          <Download size={16} />
          Export CSV Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Realized Gains */}
        <div className="p-6 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-gray-400" />
            <h3 className="text-[14px] font-bold text-gray-300">Total Realized Gain</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className={`text-3xl font-black ${taxData.net >= 0 ? "text-[#14F195]" : "text-red-400"}`}>
              ${Math.abs(taxData.net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[14px] font-bold text-gray-500 mb-1">{taxData.net >= 0 ? "Profit" : "Loss"}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
            This is the total net profit or loss realized from closed positions.
          </p>
        </div>

        {/* Short Term */}
        <div className="p-6 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-yellow-500" />
            <h3 className="text-[14px] font-bold text-gray-300">Short-Term Gains</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className={`text-3xl font-black ${taxData.shortGain >= 0 ? "text-[#14F195]" : "text-red-400"}`}>
              ${Math.abs(taxData.shortGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
            Assets held for less than 1 year. Typically taxed at your ordinary income rate (est. 30%).
          </p>
        </div>

        {/* Long Term */}
        <div className="p-6 rounded-[20px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-purple-400" />
            <h3 className="text-[14px] font-bold text-gray-300">Long-Term Gains</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className={`text-3xl font-black ${taxData.longGain >= 0 ? "text-[#14F195]" : "text-red-400"}`}>
              ${Math.abs(taxData.longGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
            Assets held for more than 1 year. Typically taxed at a lower capital gains rate (est. 15%).
          </p>
        </div>
      </div>

      <div className="p-6 rounded-[20px] bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 flex flex-col md:flex-row items-start md:items-center gap-6 mt-6">
        <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
          <AlertCircle size={24} className="text-orange-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-black text-white mb-1">Estimated Tax Liability</h4>
          <p className="text-[13px] text-gray-400">
            Based on an estimated 30% short-term and 15% long-term tax rate, your total estimated tax liability is:
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-orange-400">
            ${taxData.estTotalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-4">Recent Realized Events</h3>
        <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-xl rounded-[20px] overflow-hidden">
          {taxData.allRealized.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white/[0.02]">
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Sell Date</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Buy Price</th>
                    <th className="px-6 py-4">Sell Price</th>
                    <th className="px-6 py-4 text-right">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-gray-300 divide-y divide-white/5">
                  {taxData.allRealized.slice(0, 10).map((event: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{event.symbol.toUpperCase()}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(event.sell_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{Number(event.qty).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                      <td className="px-6 py-4">${Number(event.buy_price).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                      <td className="px-6 py-4">${Number(event.sell_price).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                      <td className={`px-6 py-4 text-right font-bold ${event.gain >= 0 ? "text-[#14F195]" : "text-red-400"}`}>
                        {event.gain >= 0 ? "+" : ""}${Number(event.gain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {taxData.allRealized.length > 10 && (
                <div className="p-4 text-center border-t border-white/5">
                  <span className="text-[12px] font-bold text-gray-500">
                    Showing 10 most recent events. Export CSV for the full report.
                  </span>
                </div>
              )}
            </div>
          ) : (
             <div className="p-12 text-center flex flex-col items-center justify-center opacity-50">
              <div className="w-16 h-16 rounded-full bg-[#1a1d21] border border-white/5 flex items-center justify-center mb-4">
                <FileText size={24} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Realized Events</h3>
              <p className="text-sm text-gray-400 max-w-md">
                You haven't sold any assets yet. Tax events are generated when you close a position.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
