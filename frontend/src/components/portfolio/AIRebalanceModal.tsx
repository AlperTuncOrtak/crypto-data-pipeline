import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, X, ShieldAlert, Layers, Target, Coins, TrendingUp, TrendingDown,
  CheckCircle2, AlertTriangle, Lightbulb, RefreshCw, WifiOff,
} from "lucide-react";
import { apiClient } from "../../api/client";
import type { Holding, TaxSummary } from "./PortfolioUtils";
import { COIN_COLORS, CHART_COLORS } from "./PortfolioUtils";

interface AIRebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Holding[];
  totalValue: number;
  totalPnl: number;
  /** False when no trade history is imported, so P&L is marked to market. */
  hasCostBasis: boolean;
  taxData: TaxSummary;
}

interface Analysis {
  ai_available: boolean;
  empty?: boolean;
  risk_score: number;
  risk_label: string;
  diversification_score: number;
  dominant_sector: string;
  sector_breakdown: Record<string, number>;
  correlation_risk: string;
  concentration_pct: number;
  effective_positions: number;
  stablecoin_pct: number;
  position_count: number;
  summary: string | null;
  strengths: string[];
  risks: string[];
  recommendations: string[];
  best_position: string | null;
  worst_position: string | null;
}

const toneForRisk = (score: number) =>
  score <= 3 ? "var(--positive)" : score <= 5 ? "var(--warning)" : "var(--negative)";

const toneForDiversification = (score: number) =>
  score >= 7 ? "var(--positive)" : score >= 4 ? "var(--warning)" : "var(--negative)";

/** Ten segments beat a number alone: the shape of the bar is readable at a glance. */
function ScoreMeter({
  label, score, color, caption,
}: { label: string; score: number; color: string; caption: string }) {
  return (
    <div className="p-5 rounded-[16px] bg-[var(--bg-overlay)] border border-[var(--border-subtle)]">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
        <span className="text-[20px] font-black tabular-nums" style={{ color }}>
          {score}<span className="text-[12px] text-[var(--text-faint)] font-bold">/10</span>
        </span>
      </div>
      <div className="flex gap-1 mb-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ backgroundColor: i < score ? color : "var(--border-base)" }}
          />
        ))}
      </div>
      <p className="text-[11px] text-[var(--text-muted)] leading-snug">{caption}</p>
    </div>
  );
}

function MetricTile({
  icon: Icon, label, value, hint,
}: { icon: typeof Target; label: string; value: string; hint?: string }) {
  return (
    <div className="p-4 rounded-[14px] bg-[var(--bg-overlay)] border border-[var(--border-subtle)]">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={12} className="text-[var(--text-faint)]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
      </div>
      <div className="text-[16px] font-black text-[var(--text-main)] tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-[var(--text-faint)] mt-0.5 leading-snug">{hint}</div>}
    </div>
  );
}

function InsightList({
  title, items, icon: Icon, color,
}: { title: string; items: string[]; icon: typeof CheckCircle2; color: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color }} />
        <h4 className="text-[12px] font-bold uppercase tracking-widest text-[var(--text-main)]">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[13px] text-[var(--text-muted)] leading-relaxed">
            <span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AIRebalanceModal({
  isOpen, onClose, holdings, totalValue, totalPnl, hasCostBasis, taxData,
}: AIRebalanceModalProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"scanning" | "results" | "error">("scanning");
  const [scanText, setScanText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [runId, setRunId] = useState(0);

  // Holdings are rebuilt on every market tick. Without this snapshot the
  // effect re-fired every few seconds and hit the paid LLM endpoint each time.
  const snapshot = useRef({ holdings, totalValue, totalPnl, hasCostBasis, taxData });
  if (!isOpen) snapshot.current = { holdings, totalValue, totalPnl, hasCostBasis, taxData };

  useEffect(() => {
    if (!isOpen) {
      setPhase("scanning");
      setAnalysis(null);
      setErrorMsg("");
      return;
    }

    let cancelled = false;
    const snap = snapshot.current;

    const run = async () => {
      setPhase("scanning");
      try {
        setScanText(t("portfolio.ai.scanning"));
        const response = await apiClient.post("/ai/portfolio", {
          holdings: snap.holdings.map((h) => ({
            symbol: h.symbol,
            value: h.value || 0,
            pnl_pct: snap.hasCostBasis ? h.pnl_pct || 0 : 0,
            quantity: h.quantity || 0,
            avg_cost: h.avg_cost || 0,
          })),
          total_value: snap.totalValue,
          total_pnl: snap.hasCostBasis ? snap.totalPnl : 0,
          has_cost_basis: snap.hasCostBasis,
          realized_ytd: snap.taxData?.hasData ? snap.taxData.currentYearRealized : undefined,
        });

        if (cancelled) return;
        setAnalysis(response.data);
        setPhase("results");
      } catch (err: any) {
        if (cancelled) return;
        setErrorMsg(err?.response?.data?.detail || err?.message || t("portfolio.ai.error_generic"));
        setPhase("error");
      }
    };

    run();
    return () => { cancelled = true; };
  }, [isOpen, runId]);

  if (!isOpen) return null;

  const sectorEntries = Object.entries(analysis?.sector_breakdown || {});

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-3xl bg-[var(--bg-subtle)] border border-[var(--border-base)] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center border border-[var(--accent-border)]">
              <Brain className="text-[var(--accent)]" size={19} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[var(--text-main)]">{t("portfolio.ai.title")}</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t("portfolio.ai.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phase === "results" && (
              <button
                onClick={() => setRunId((n) => n + 1)}
                title={t("portfolio.ai.rerun")}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-overlay)] rounded-xl transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-overlay)] rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {phase === "scanning" && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 gap-5">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--border-base)]" />
                  <div className="absolute inset-0 rounded-full border-t-2 border-[var(--accent)] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="text-[var(--accent)]" size={22} />
                  </div>
                </div>
                <p className="text-[13px] font-medium text-[var(--text-muted)]">{scanText}</p>
              </motion.div>
            )}

            {phase === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--negative-muted)] flex items-center justify-center">
                  <WifiOff className="text-[var(--negative)]" size={24} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[var(--text-main)] mb-1">{t("portfolio.ai.unavailable_title")}</h3>
                  <p className="text-[13px] text-[var(--text-muted)] max-w-sm">{errorMsg}</p>
                </div>
                <button
                  onClick={() => setRunId((n) => n + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                >
                  <RefreshCw size={14} /> {t("portfolio.ai.retry")}
                </button>
              </motion.div>
            )}

            {phase === "results" && analysis && (
              <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
                {analysis.empty ? (
                  <div className="py-16 text-center">
                    <p className="text-[14px] font-bold text-[var(--text-main)] mb-2">{t("portfolio.ai.empty_title")}</p>
                    <p className="text-[13px] text-[var(--text-muted)] max-w-md mx-auto">{analysis.summary}</p>
                  </div>
                ) : (
                  <>
                    {/* Scores */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ScoreMeter
                        label={t("portfolio.ai.risk")}
                        score={analysis.risk_score}
                        color={toneForRisk(analysis.risk_score)}
                        caption={t("portfolio.ai.risk_caption", { label: analysis.risk_label })}
                      />
                      <ScoreMeter
                        label={t("portfolio.ai.diversification")}
                        score={analysis.diversification_score}
                        color={toneForDiversification(analysis.diversification_score)}
                        caption={t("portfolio.ai.div_caption", {
                          positions: analysis.effective_positions.toFixed(2),
                          sectors: sectorEntries.length,
                        })}
                      />
                    </div>

                    {/* Metric tiles */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <MetricTile icon={Target} label={t("portfolio.ai.largest")} value={`${analysis.concentration_pct.toFixed(1)}%`} hint={t("portfolio.ai.largest_hint")} />
                      <MetricTile icon={Layers} label={t("portfolio.ai.effective")} value={analysis.effective_positions.toFixed(2)} hint={t("portfolio.ai.effective_hint", { count: analysis.position_count })} />
                      <MetricTile icon={Coins} label={t("portfolio.ai.buffer")} value={`${analysis.stablecoin_pct.toFixed(1)}%`} hint={t("portfolio.ai.buffer_hint")} />
                      <MetricTile icon={ShieldAlert} label={t("portfolio.ai.correlation")} value={analysis.correlation_risk.toUpperCase()} hint={t("portfolio.ai.correlation_hint")} />
                    </div>

                    {/* Sector breakdown */}
                    {sectorEntries.length > 0 && (
                      <div>
                        <h4 className="text-[12px] font-bold uppercase tracking-widest text-[var(--text-main)] mb-3">{t("portfolio.ai.sectors")}</h4>
                        <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
                          {sectorEntries.map(([name, pct], i) => (
                            <div
                              key={name}
                              style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                              title={`${name} ${pct}%`}
                            />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          {sectorEntries.map(([name, pct], i) => (
                            <div key={name} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-[11px] font-medium text-[var(--text-muted)]">{name}</span>
                              <span className="text-[11px] font-bold text-[var(--text-main)] tabular-nums">{pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Narrative */}
                    {analysis.ai_available ? (
                      <>
                        {analysis.summary && (
                          <div className="p-5 rounded-[16px] bg-[var(--accent-muted)] border border-[var(--accent-border)]">
                            <p className="text-[13.5px] text-[var(--text-main)] leading-relaxed">{analysis.summary}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InsightList title={t("portfolio.ai.strengths")} items={analysis.strengths} icon={CheckCircle2} color="var(--positive)" />
                          <InsightList title={t("portfolio.ai.risks")} items={analysis.risks} icon={AlertTriangle} color="var(--negative)" />
                        </div>

                        <InsightList title={t("portfolio.ai.recommendations")} items={analysis.recommendations} icon={Lightbulb} color="var(--accent)" />

                        {(analysis.best_position || analysis.worst_position) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {analysis.best_position && (
                              <div className="flex gap-3 p-4 rounded-[14px] bg-[var(--positive-muted)] border border-[var(--positive)]/20">
                                <TrendingUp size={16} className="text-[var(--positive)] shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--positive)] mb-1">{t("portfolio.ai.best")}</div>
                                  <p className="text-[12.5px] text-[var(--text-main)] leading-snug">{analysis.best_position}</p>
                                </div>
                              </div>
                            )}
                            {analysis.worst_position && (
                              <div className="flex gap-3 p-4 rounded-[14px] bg-[var(--negative-muted)] border border-[var(--negative)]/20">
                                <TrendingDown size={16} className="text-[var(--negative)] shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--negative)] mb-1">{t("portfolio.ai.worst")}</div>
                                  <p className="text-[12.5px] text-[var(--text-main)] leading-snug">{analysis.worst_position}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-3 p-4 rounded-[14px] bg-[var(--warning-muted)] border border-[var(--warning)]/20">
                        <AlertTriangle size={16} className="text-[var(--warning)] shrink-0 mt-0.5" />
                        <p className="text-[12.5px] text-[var(--text-main)] leading-relaxed">
                          {t("portfolio.ai.llm_down")}
                        </p>
                      </div>
                    )}

                    {!hasCostBasis && (
                      <p className="text-[11px] text-[var(--text-faint)] leading-relaxed border-t border-[var(--border-subtle)] pt-4">
                        {t("portfolio.ai.no_cost_basis")}
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
