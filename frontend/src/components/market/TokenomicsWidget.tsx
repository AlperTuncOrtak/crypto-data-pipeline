import React from "react";
import { Lock, AlertTriangle } from "lucide-react";
import { getCoinColor } from "../../utils/colors";

function fmtLarge(n: number) {
  if (!n) return "—";
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
}

export default function TokenomicsWidget({ coin }: { coin: any }) {
  const brandColor = getCoinColor(coin?.symbol) || "var(--accent)";

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
    <div className="glass-panel w-full" style={{ padding: "24px", borderRadius: "20px" }}>
      <div className="flex items-center gap-2 mb-6">
        <Lock size={16} style={{ color: "var(--text-muted)" }} />
        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
          Tokenomics & Supply
        </h3>
      </div>

      <div className="flex flex-col gap-6">
        {/* Supply Progress */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Circulating</p>
              <p className="text-lg font-black text-[var(--text-primary)] font-mono">{fmtLarge(circ)} <span className="text-xs text-[var(--text-muted)] ml-1">{coin?.symbol}</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{max > 0 ? "Max Supply" : "Total Supply"}</p>
              <p className="text-lg font-black text-[var(--text-primary)] font-mono">{fmtLarge(baseSupply)}</p>
            </div>
          </div>
          
          <div className="h-3 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)] relative">
            <div 
              className="absolute top-0 left-0 h-full rounded-full" 
              style={{ 
                width: `${circPct}%`, 
                backgroundColor: brandColor,
                transition: "width 1s ease-in-out"
              }} 
            />
          </div>
          <p className="text-right text-xs font-bold mt-2 text-[var(--text-muted)]">
            {circPct.toFixed(1)}% Unlocked
          </p>
        </div>

        {/* Mock Upcoming Unlocks */}
        {hasMockUnlocks && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-400 mb-1">Upcoming Unlock Warning</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <span className="font-bold text-[var(--text-primary)]">{fmtLarge(Number(unlockAmount))} {coin?.symbol}</span> (approx. 2.4% of total supply) will be unlocked in <span className="font-bold text-[var(--text-primary)]">{unlockDays} days</span>. This may introduce significant sell pressure.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
