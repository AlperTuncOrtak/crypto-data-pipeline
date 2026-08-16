import React from "react";
import { Lock, AlertTriangle } from "lucide-react";
import { getCoinColor } from "../../utils/colors";
import { motion } from "framer-motion";

function fmtLarge(n: number) {
  if (!n) return "—";
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
}

export default function TokenomicsWidget({ coin }: { coin: any }) {
  const brandColor = getCoinColor(coin?.symbol) || "#0052ff";

  const circ = Number(coin?.circulating_supply) || 0;
  const total = Number(coin?.total_supply) || circ;
  const max = Number(coin?.max_supply) || total;

  const baseSupply = max > 0 ? max : total > 0 ? total : circ;
  const circPct = baseSupply > 0 ? Math.min((circ / baseSupply) * 100, 100) : 0;
  
  // Mock unlocks based on symbol for demonstration
  const hasMockUnlocks = ["ARB", "OP", "SUI", "APT", "WLD", "DYDX"].includes(coin?.symbol?.toUpperCase());
  const unlockAmount = hasMockUnlocks ? (total * 0.024).toFixed(0) : null;
  const unlockDays = hasMockUnlocks ? 12 : null;

  if (!circ && !total && !max) return null;

  return (
    <div className="bg-[var(--bg-base)]/80 backdrop-blur-xl border border-[var(--border-subtle)] shadow-2xl rounded-2xl p-6 flex flex-col gap-6 w-full relative overflow-hidden group">
      
      {/* Background ambient glow based on tokenomics */}
      <div 
        className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-[80px] opacity-20 transition-colors duration-1000"
        style={{ backgroundColor: brandColor }}
      />

      <div className="flex items-center gap-2 mb-2 relative z-10">
        <Lock size={18} className="text-[var(--text-muted)]" />
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
          Tokenomics & Supply
        </h3>
      </div>

      <div className="flex flex-col gap-6 relative z-10">
        {/* Supply Progress */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Circulating</p>
              <p className="text-xl font-black text-[var(--text-main)] font-mono">{fmtLarge(circ)} <span className="text-xs text-[var(--text-muted)] ml-1">{coin?.symbol}</span></p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{max > 0 ? "Max Supply" : "Total Supply"}</p>
              <p className="text-xl font-black text-gray-300 font-mono">{fmtLarge(baseSupply)}</p>
            </div>
          </div>
          
          <div className="h-2.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border-subtle)] relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${circPct}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full rounded-full" 
              style={{ backgroundColor: brandColor }} 
            />
          </div>
          <p className="text-right text-xs font-bold mt-2 text-[var(--text-muted)]">
            {circPct.toFixed(1)}% Unlocked
          </p>
        </div>

        {/* Mock Upcoming Unlocks */}
        {hasMockUnlocks && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-4 rounded-3xl border border-red-500/20 bg-red-500/5 flex items-start gap-3 mt-2"
          >
            <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-400 mb-1">Upcoming Unlock Warning</p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                <span className="font-bold text-gray-200">{fmtLarge(Number(unlockAmount))} {coin?.symbol}</span> (approx. 2.4% of total supply) will be unlocked in <span className="font-bold text-gray-200">{unlockDays} days</span>. This may introduce significant sell pressure.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
