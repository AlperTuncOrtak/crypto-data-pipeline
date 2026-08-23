import React, { useMemo, useState } from "react";
import { Trash2, AlertTriangle, Receipt, Loader2, X } from "lucide-react";
import type { Trade } from "./PortfolioUtils";

interface TransactionHistoryProps {
  trades: Trade[];
  setTrades: (trades: Trade[]) => void;
  user: any;
}

const GRID = "grid-cols-[130px_90px_1fr_1.1fr_1.1fr_1.1fr_40px]";

const money = (n: number, max = 2) =>
  Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: max });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
};

/** Local rows have no database id, so fall back to a content signature. */
const tradeKey = (t: any, i: number) =>
  t.id ?? `${t.symbol}-${t.side}-${t.quantity}-${t.price}-${t.traded_at}-${i}`;

export default function TransactionHistory({ trades, setTrades, user }: TransactionHistoryProps) {
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [pending, setPending] = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sources = useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => set.add(t.exchange || "Manual"));
    return Array.from(set).sort();
  }, [trades]);

  const rows = useMemo(() => {
    const filtered =
      sourceFilter === "all" ? trades : trades.filter((t) => (t.exchange || "Manual") === sourceFilter);
    return filtered
      .slice()
      .sort((a, b) => new Date(b.traded_at).getTime() - new Date(a.traded_at).getTime());
  }, [trades, sourceFilter]);

  const persist = async (remaining: Trade[], removeFilter: (q: any) => any) => {
    if (user) {
      const { supabase } = await import("../../lib/supabase");
      const query = supabase.from("trades").delete().eq("user_id", user.id);
      const { error: delError } = await removeFilter(query);
      if (delError) throw new Error(delError.message);
    }
    setTrades(remaining);
    localStorage.setItem("crypto_neko_trades", JSON.stringify(remaining));
  };

  const deleteOne = async (trade: any, key: string) => {
    setPending(key);
    setError(null);
    try {
      const remaining = trades.filter((t, i) => tradeKey(t, i) !== key);
      await persist(remaining, (q) =>
        // Rows synced from Supabase always carry an id; local-only rows never
        // reach this branch because there is no user session to delete from.
        trade.id ? q.eq("id", trade.id) : Promise.resolve({ error: null })
      );
    } catch (e: any) {
      setError(e?.message || "Could not delete that transaction.");
    } finally {
      setPending(null);
    }
  };

  const deleteShown = async () => {
    setPending("bulk");
    setError(null);
    try {
      const doomed = new Set(rows.map((t, i) => tradeKey(t, i)));
      const remaining = trades.filter((t, i) => !doomed.has(tradeKey(t, i)));
      await persist(remaining, (q) =>
        sourceFilter === "all" ? q : q.eq("exchange", sourceFilter)
      );
      setConfirmBulk(false);
    } catch (e: any) {
      setError(e?.message || "Could not delete those transactions.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="rounded-[20px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--text-main)]">Transactions</h3>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            Imported trades. These drive your cost basis and realized gains.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sources.length > 1 && (
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-[var(--bg-overlay)] border border-[var(--border-base)] rounded-2xl px-3 py-2 text-[12px] font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            >
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          {rows.length > 0 && (
            <button
              onClick={() => setConfirmBulk(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[12px] font-bold text-[var(--negative)] bg-[var(--negative-muted)] border border-[var(--negative)]/20 hover:bg-[var(--negative)]/20 transition-colors"
            >
              <Trash2 size={13} />
              Delete {sourceFilter === "all" ? "all" : sourceFilter}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-2xl bg-[var(--negative-muted)] border border-[var(--negative)]/20 text-[12px] font-medium text-[var(--negative)]">
          {error}
        </div>
      )}

      {confirmBulk && (
        <div className="mx-6 mt-4 px-4 py-4 rounded-2xl bg-[var(--warning-muted)] border border-[var(--warning)]/25">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-[var(--warning)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-[var(--text-main)] mb-1">
                Delete {rows.length} transaction{rows.length === 1 ? "" : "s"}?
              </p>
              <p className="text-[12px] text-[var(--text-muted)] mb-3">
                This permanently removes {sourceFilter === "all" ? "every imported trade" : `everything imported from ${sourceFilter}`}.
                Your cost basis and realized gains will be recalculated. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={deleteShown}
                  disabled={pending === "bulk"}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12px] font-bold bg-[var(--negative)] text-white hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {pending === "bulk" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmBulk(false)}
                  className="px-4 py-2 rounded-2xl text-[12px] font-bold bg-[var(--bg-overlay)] border border-[var(--border-base)] text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            <button onClick={() => setConfirmBulk(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[var(--bg-overlay)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Receipt size={20} className="text-[var(--text-faint)]" />
          </div>
          <p className="text-[14px] font-bold text-[var(--text-main)] mb-1">No transactions imported</p>
          <p className="text-[13px] text-[var(--text-muted)]">
            Upload a CSV or sync an exchange from <span className="font-bold">Add Source</span> to track cost basis and taxes.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[820px]">
            <div className={`grid ${GRID} gap-3 px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/40 items-center`}>
              {["Date", "Side", "Asset", "Quantity", "Price", "Total", ""].map((label, i) => (
                <div
                  key={label || i}
                  className={`text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] ${i >= 3 ? "text-right" : ""}`}
                >
                  {label}
                </div>
              ))}
            </div>

            {rows.map((t, i) => {
              const key = tradeKey(t, i);
              const isBuy = String(t.side).toLowerCase() === "buy";
              const total = Number(t.total ?? Number(t.quantity) * Number(t.price));

              return (
                <div
                  key={key}
                  className={`grid ${GRID} gap-3 px-6 py-3 items-center border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-overlay)]/60 transition-colors group ${
                    pending === key ? "opacity-40" : ""
                  }`}
                >
                  <div className="text-[12px] text-[var(--text-muted)] tabular-nums">{fmtDate(t.traded_at)}</div>

                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isBuy
                          ? "bg-[var(--positive-muted)] text-[var(--positive)]"
                          : "bg-[var(--negative-muted)] text-[var(--negative)]"
                      }`}
                    >
                      {isBuy ? "Buy" : "Sell"}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[var(--text-main)] truncate">{t.symbol}</div>
                    {t.exchange && (
                      <div className="text-[11px] text-[var(--text-faint)] truncate">{t.exchange}</div>
                    )}
                  </div>

                  <div className="text-right text-[12px] font-mono text-[var(--text-main)] tabular-nums">
                    {Number(t.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  </div>

                  <div className="text-right text-[12px] font-mono text-[var(--text-muted)] tabular-nums">
                    ${money(Number(t.price), Number(t.price) < 1 ? 6 : 2)}
                  </div>

                  <div className="text-right text-[13px] font-bold text-[var(--text-main)] tabular-nums">
                    ${money(total)}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => deleteOne(t, key)}
                      disabled={pending !== null}
                      title="Delete this transaction"
                      className="p-1.5 rounded-lg text-[var(--text-faint)] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-[var(--negative)] hover:bg-[var(--negative-muted)] transition-all disabled:opacity-30"
                    >
                      {pending === key ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
