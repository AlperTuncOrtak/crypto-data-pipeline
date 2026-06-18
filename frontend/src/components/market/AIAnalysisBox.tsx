import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../api/client";
import { Bot, Sparkles, AlertTriangle, CheckCircle, BarChart2 } from "lucide-react";

export default function AIAnalysisBox({ slug, coinName, symbol, brandColor }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
    "Initializing neural processing core...",
    `Fetching live on-chain metrics for ${symbol}...`,
    "Analyzing order book depth and momentum...",
    "Evaluating social sentiment and news...",
    "Generating final risk and signal report..."
  ];

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setStep(0);
    
    // Simulate agentic steps for UX
    for (let i = 0; i < steps.length; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 600)); // 600ms per step
    }

    try {
      const res = await apiClient.get(`/ai/analyze/${slug}`);
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        setData(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "AI analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const T = {
    bg: "var(--bg-surface)",
    border: "var(--border)",
    accent: "var(--accent)",
    text: "var(--text-primary)",
    muted: "var(--text-muted)",
  };

  if (!data && !loading && !error) {
    return (
      <button
        onClick={handleAnalyze}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-border)",
          color: "var(--text-primary)",
          padding: "10px 20px",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.background = "var(--accent-border)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.background = "var(--accent-soft)";
        }}
      >
        <Bot size={18} style={{ color: "var(--accent)" }} />
        {t("coin_detail.ai_analyze", "Deep AI Analysis")}
        <Sparkles size={14} style={{ color: "var(--secondary)" }} />
      </button>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "24px",
        marginTop: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, position: "relative", zIndex: 1 }}>
        <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={20} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>CryptoNeko AI Analyst</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Groq Powered Real-Time Analysis</div>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16, position: "relative", zIndex: 1 }}>
          {steps.map((s, index) => {
            const isCompleted = index < step;
            const isCurrent = index === step;
            if (index > step) return null; // hide future steps
            
            return (
              <div key={index} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 12, 
                color: isCompleted ? "var(--text-muted)" : "var(--accent)", 
                fontSize: 13,
                fontWeight: isCurrent ? 600 : 400,
                opacity: isCurrent ? 1 : 0.7
              }}>
                {isCompleted ? (
                  <CheckCircle size={14} color="var(--positive)" />
                ) : (
                  <div style={{ width: 14, height: 14, border: "2px solid var(--accent-border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                )}
                {s}
              </div>
            );
          })}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ color: "#ef4444", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {data && (
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
            {/* Signal */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Signal</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: data.signal?.includes("buy") ? "#10b981" : data.signal?.includes("sell") ? "#ef4444" : "#f5a623", textTransform: "capitalize" }}>
                {data.signal?.replace("_", " ")}
              </div>
            </div>
            {/* Confidence */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Confidence</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{data.confidence}%</div>
            </div>
            {/* Sentiment */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Sentiment</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: data.sentiment === "bullish" ? "#10b981" : data.sentiment === "bearish" ? "#ef4444" : "#f5a623", textTransform: "capitalize" }}>
                {data.sentiment}
              </div>
            </div>
            {/* Risk */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Risk Level</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: data.risk_level === "high" ? "#ef4444" : data.risk_level === "low" ? "#10b981" : "#f5a623", textTransform: "capitalize" }}>
                {data.risk_level}
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart2 size={16} color={brandColor || "#00f0ff"} /> AI Summary
            </h4>
            {data.summary}
          </div>
        </div>
      )}
    </div>
  );
}
