import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Scale, Info } from "lucide-react";
import type { TaxSummary, Disposal } from "./PortfolioUtils";

interface TaxReportProps {
  taxData: TaxSummary;
}

const GRID = "grid-cols-[1fr_110px_110px_90px_1fr_1fr_1fr]";

const money = (n: number) =>
  Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const signed = (n: number) => `${n >= 0 ? "+" : "-"}$${money(n)}`;

const shortDate = (iso: string, locale: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(locale, { year: "2-digit", month: "short", day: "2-digit" });
};

/** RFC-4180-ish quoting so symbols or dates containing a comma can't shift columns. */
const csvCell = (v: string | number) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function buildCSV(disposals: Disposal[]) {
  const header = [
    "Symbol", "Quantity", "Acquired", "Sold", "Holding days", "Term",
    "Proceeds (USD)", "Cost basis (USD)", "Gain/Loss (USD)",
  ];
  const rows = disposals.map((d) => [
    d.symbol,
    d.quantity,
    new Date(d.acquired).toISOString().slice(0, 10),
    new Date(d.sold).toISOString().slice(0, 10),
    d.holdingDays,
    d.longTerm ? "Long" : "Short",
    d.proceeds.toFixed(2),
    d.cost.toFixed(2),
    d.gain.toFixed(2),
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

function StatCard({
  label, value, tone = "neutral", sub,
}: { label: string; value: string; tone?: "neutral" | "positive" | "negative"; sub?: string }) {
  const color =
    tone === "positive" ? "text-[var(--positive)]"
    : tone === "negative" ? "text-[var(--negative)]"
    : "text-[var(--text-main)]";
  return (
    <div className="p-5 rounded-[16px] bg-[var(--bg-overlay)] border border-[var(--border-subtle)]">
      <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">{label}</div>
      <div className={`text-[22px] font-black tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--text-muted)] mt-1">{sub}</div>}
    </div>
  );
}

export default function TaxReport({ taxData }: TaxReportProps) {
  const { t, i18n } = useTranslation();
  const years = taxData.byYear.map((y) => y.year);
  const [year, setYear] = useState<number | "all">(years[0] ?? "all");

  const active = useMemo(
    () => (year === "all" ? taxData.disposals : taxData.disposals.filter((d) => d.year === year)),
    [taxData.disposals, year]
  );

  const totals = useMemo(() => {
    const t = { proceeds: 0, cost: 0, gain: 0, shortTerm: 0, longTerm: 0 };
    for (const d of active) {
      t.proceeds += d.proceeds;
      t.cost += d.cost;
      t.gain += d.gain;
      if (d.longTerm) t.longTerm += d.gain;
      else t.shortTerm += d.gain;
    }
    return t;
  }, [active]);

  const download = () => {
    const blob = new Blob([buildCSV(active)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cryptoneko-realized-gains-${year === "all" ? "all-years" : year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!taxData.hasData) {
    return (
      <div className="rounded-[20px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-6 py-16 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[var(--bg-overlay)] border border-[var(--border-subtle)] flex items-center justify-center">
          <Scale size={20} className="text-[var(--text-faint)]" />
        </div>
        <p className="text-[14px] font-bold text-[var(--text-main)] mb-1">{t("portfolio.tax.empty_title")}</p>
        <p className="text-[13px] text-[var(--text-muted)] max-w-md mx-auto">
          {t("portfolio.tax.empty_desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[20px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text-main)]">{t("portfolio.tax.title")}</h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              {t("portfolio.tax.subtitle", { count: taxData.disposalCount })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--bg-base)] rounded-2xl p-1 border border-[var(--border-subtle)]">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                    year === y ? "bg-[var(--bg-overlay)] text-[var(--text-main)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {y}
                </button>
              ))}
              {years.length > 1 && (
                <button
                  onClick={() => setYear("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                    year === "all" ? "bg-[var(--bg-overlay)] text-[var(--text-main)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {t("portfolio.tax.all")}
                </button>
              )}
            </div>

            <button
              onClick={download}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-[12px] font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              <Download size={14} />
              {t("portfolio.tax.export")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <StatCard label={t("portfolio.tax.proceeds")} value={`$${money(totals.proceeds)}`} sub={t("portfolio.tax.proceeds_hint")} />
          <StatCard label={t("portfolio.tax.cost_basis")} value={`$${money(totals.cost)}`} sub={t("portfolio.tax.cost_hint")} />
          <StatCard
            label={t("portfolio.tax.net")}
            value={signed(totals.gain)}
            tone={totals.gain >= 0 ? "positive" : "negative"}
            sub={year === "all" ? t("portfolio.tax.net_all") : t("portfolio.tax.net_year", { year })}
          />
          <StatCard
            label={t("portfolio.tax.term_split")}
            value={`${signed(totals.shortTerm)} · ${signed(totals.longTerm)}`}
            sub={t("portfolio.tax.term_hint")}
          />
        </div>
      </div>

      <div className="rounded-[20px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[860px]">
            <div className={`grid ${GRID} gap-3 px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/40 items-center`}>
              {[
                { l: t("portfolio.tax.asset"), a: "left" }, { l: t("portfolio.tax.acquired"), a: "left" },
                { l: t("portfolio.tax.sold"), a: "left" }, { l: t("portfolio.tax.term"), a: "left" },
                { l: t("portfolio.tax.proceeds"), a: "right" }, { l: t("portfolio.tax.cost_basis"), a: "right" },
                { l: t("portfolio.tax.gain"), a: "right" },
              ].map(({ l, a }) => (
                <div key={l} className={`text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] ${a === "right" ? "text-right" : ""}`}>
                  {l}
                </div>
              ))}
            </div>

            {active.map((d, i) => (
              <div
                key={`${d.symbol}-${d.sold}-${d.acquired}-${i}`}
                className={`grid ${GRID} gap-3 px-6 py-3 items-center border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-overlay)]/60 transition-colors`}
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[var(--text-main)] truncate">{d.symbol}</div>
                  <div className="text-[11px] text-[var(--text-faint)] font-mono tabular-nums">
                    {d.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  </div>
                </div>
                <div className="text-[12px] text-[var(--text-muted)] tabular-nums">{shortDate(d.acquired, i18n.language)}</div>
                <div className="text-[12px] text-[var(--text-muted)] tabular-nums">{shortDate(d.sold, i18n.language)}</div>
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      d.longTerm
                        ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                        : "bg-[var(--bg-overlay)] text-[var(--text-muted)]"
                    }`}
                    title={t("portfolio.tax.days_held", { count: d.holdingDays })}
                  >
                    {d.longTerm ? t("portfolio.tax.long") : t("portfolio.tax.short")}
                  </span>
                </div>
                <div className="text-right text-[13px] font-medium text-[var(--text-main)] tabular-nums">${money(d.proceeds)}</div>
                <div className="text-right text-[13px] font-medium text-[var(--text-muted)] tabular-nums">${money(d.cost)}</div>
                <div className={`text-right text-[13px] font-bold tabular-nums ${d.gain >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                  {signed(d.gain)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2.5 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/40">
          <Info size={14} className="text-[var(--text-faint)] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            {t("portfolio.tax.disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
