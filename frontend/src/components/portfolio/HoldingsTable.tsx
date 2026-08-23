import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Wallet, Building2, FileText } from "lucide-react";
import type { Holding } from "./PortfolioUtils";
import { COIN_COLORS, CHART_COLORS } from "./PortfolioUtils";

type SortKey = "value" | "symbol" | "quantity" | "current_price" | "change_24h" | "pnl" | "weight";

interface HoldingsTableProps {
  holdings: Holding[];
  totalValue: number;
  isLoading?: boolean;
}

const GRID = "grid-cols-[2fr_1.1fr_1.2fr_1fr_1.1fr_1.3fr_0.9fr]";

/** Where a position came from. Wallet balances are on-chain; the rest are not. */
function SourceBadge({ source }: { source: string }) {
  const { t } = useTranslation();
  const map: Record<string, { icon: typeof Wallet; label: string }> = {
    Wallet: { icon: Wallet, label: t("portfolio.holdings.badge_wallet") },
    Trades: { icon: FileText, label: t("portfolio.holdings.badge_imported") },
  };
  const entry = map[source] || { icon: Building2, label: source };
  const Icon = entry.icon;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">
      <Icon size={9} strokeWidth={2.5} />
      {entry.label}
    </span>
  );
}

const money = (n: number, max = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: max });

const qty = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: n < 1 ? 8 : 4 });

export default function HoldingsTable({ holdings, totalValue, isLoading = false }: HoldingsTableProps) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => {
    const withWeight = holdings.map((h) => ({
      ...h,
      weight: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
    }));

    const get = (h: typeof withWeight[number]) => {
      switch (sortKey) {
        case "symbol": return h.symbol;
        case "quantity": return h.quantity;
        case "current_price": return h.current_price;
        case "change_24h": return h.change_24h;
        case "pnl": return h.pnl;
        case "weight": return h.weight;
        default: return h.value;
      }
    };

    return withWeight.sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return asc ? cmp : -cmp;
    });
  }, [holdings, totalValue, sortKey, asc]);

  const toggle = (key: SortKey) => {
    if (key === sortKey) {
      setAsc(!asc);
    } else {
      setSortKey(key);
      // Text sorts read naturally A→Z; numbers are most useful biggest-first.
      setAsc(key === "symbol");
    }
  };

  const TH = ({ label, k, align = "right" }: { label: string; k: SortKey; align?: "left" | "right" }) => (
    <button
      onClick={() => toggle(k)}
      className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest transition-colors hover:text-[var(--text-main)] ${
        sortKey === k ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"
      } ${align === "right" ? "justify-end" : "justify-start"}`}
    >
      {label}
      {sortKey === k && (asc ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />)}
    </button>
  );

  return (
    <div className="rounded-[20px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="flex items-baseline justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-[15px] font-bold text-[var(--text-main)]">{t("portfolio.holdings.title")}</h3>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            {t("portfolio.holdings.subtitle", { count: holdings.length })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{t("portfolio.holdings.total")}</div>
          <div className="text-[15px] font-black text-[var(--text-main)] tabular-nums">${money(totalValue)}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-[var(--bg-overlay)] animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[var(--bg-overlay)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Wallet size={20} className="text-[var(--text-faint)]" />
          </div>
          <p className="text-[14px] font-bold text-[var(--text-main)] mb-1">{t("portfolio.holdings.empty_title")}</p>
          <p className="text-[13px] text-[var(--text-muted)]">
            {t("portfolio.holdings.empty_desc")}
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[880px]">
            <div className={`grid ${GRID} gap-3 px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/40 items-center`}>
              <TH label={t("portfolio.holdings.asset")} k="symbol" align="left" />
              <TH label={t("portfolio.holdings.quantity")} k="quantity" />
              <TH label={t("portfolio.holdings.avg_price")} k="current_price" />
              <TH label={t("portfolio.holdings.change_24h")} k="change_24h" />
              <TH label={t("portfolio.holdings.value")} k="value" />
              <TH label={t("portfolio.holdings.pnl")} k="pnl" />
              <TH label={t("portfolio.holdings.weight")} k="weight" />
            </div>

            {rows.map((h) => {
              const hasCost = h.cost_basis > 0 && h.trade_quantity > 0;
              const up = h.change_24h >= 0;
              const barColor = COIN_COLORS[h.symbol] || CHART_COLORS[0];

              return (
                <div
                  key={h.symbol}
                  className={`grid ${GRID} gap-3 px-6 py-3.5 items-center border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-overlay)]/60 transition-colors`}
                >
                  {/* Asset */}
                  <div className="flex items-center gap-3 min-w-0">
                    {h.image_url ? (
                      <img
                        src={h.image_url}
                        alt={h.symbol}
                        className="w-8 h-8 rounded-full shrink-0"
                        onError={(e: any) => (e.currentTarget.style.visibility = "hidden")}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-white"
                        style={{ backgroundColor: barColor }}
                      >
                        {h.symbol.slice(0, 3)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-[var(--text-main)] truncate">{h.symbol}</div>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {h.sources.slice(0, 2).map((s) => (
                          <SourceBadge key={s} source={s} />
                        ))}
                        {/* The same symbol can sit on several chains; showing
                            which ones is the whole point of reading them all. */}
                        {h.chain_balances.slice(0, 3).map((c) => (
                          <span
                            key={`${c.chain_id}-${c.contract_address || "native"}`}
                            title={`${c.quantity} ${h.symbol} on ${c.chain_name}`}
                            // Chain names are proper nouns — no uppercase
                            // transform, which would render "Arbitrum" as
                            // "ARBİTRUM" under Turkish casing rules.
                            className="px-1.5 py-0.5 rounded-md bg-[var(--accent-muted)] border border-[var(--accent-border)] text-[9px] font-bold tracking-wider text-[var(--accent)] whitespace-nowrap"
                          >
                            {c.chain_name}
                          </span>
                        ))}
                        {h.chain_balances.length > 3 && (
                          <span className="text-[9px] font-bold text-[var(--text-faint)]">
                            +{h.chain_balances.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="text-right text-[13px] font-medium text-[var(--text-main)] tabular-nums font-mono">
                    {qty(h.quantity)}
                  </div>

                  {/* Avg cost / current price */}
                  <div className="text-right tabular-nums">
                    <div className="text-[13px] font-medium text-[var(--text-main)]">
                      ${money(h.current_price, h.current_price < 1 ? 6 : 2)}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]" title={hasCost ? t("portfolio.holdings.cost_tooltip") : t("portfolio.holdings.no_cost_tooltip")}>
                      {hasCost
                        ? t("portfolio.holdings.avg", { price: `$${money(h.avg_cost, h.avg_cost < 1 ? 6 : 2)}` })
                        : t("portfolio.holdings.no_cost_basis")}
                    </div>
                  </div>

                  {/* 24h */}
                  <div className={`text-right text-[13px] font-bold tabular-nums ${up ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                    {up ? "+" : ""}{h.change_24h.toFixed(2)}%
                  </div>

                  {/* Value */}
                  <div className="text-right text-[13px] font-bold text-[var(--text-main)] tabular-nums">
                    ${money(h.value)}
                  </div>

                  {/* Unrealized P&L */}
                  <div className="text-right tabular-nums">
                    {hasCost ? (
                      <>
                        <div className={`text-[13px] font-bold ${h.pnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                          {h.pnl >= 0 ? "+" : "-"}${money(Math.abs(h.pnl))}
                        </div>
                        <div className={`text-[11px] font-medium ${h.pnl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"} opacity-70`}>
                          {h.pnl >= 0 ? "+" : ""}{h.pnl_pct.toFixed(2)}%
                        </div>
                      </>
                    ) : (
                      <span className="text-[13px] text-[var(--text-faint)]">—</span>
                    )}
                  </div>

                  {/* Weight */}
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-[var(--text-main)] tabular-nums mb-1">
                      {h.weight.toFixed(1)}%
                    </div>
                    <div className="h-1 rounded-full bg-[var(--bg-overlay)] overflow-hidden ml-auto">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(h.weight, 100)}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {rows.some((h) => h.cost_basis > 0 && h.trade_quantity === 0) && (
        <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/40">
          <p className="text-[11px] text-[var(--text-muted)]">
            {t("portfolio.holdings.wallet_note")}
          </p>
        </div>
      )}
    </div>
  );
}
