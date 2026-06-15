import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../api/client";
import { Bot, Sparkles, AlertTriangle, CheckCircle, BarChart2 } from "lucide-react";

export default function AIAnalysisBox({ slug, coinName, symbol, brandColor }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
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
          background: "linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%)",
          border: "1px solid rgba(0, 240, 255, 0.3)",
          color: "var(--text-primary)",
          padding: "10px 20px",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          boxShadow: "0 0 20px rgba(0, 240, 255, 0.05)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 240, 255, 0.15)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 240, 255, 0.05)";
          e.currentTarget.style.transform = "none";
        }}
      >
        <Bot size={18} style={{ color: "#00f0ff" }} />
        {t("coin_detail.ai_analyze", "Deep AI Analysis")}
        <Sparkles size={14} style={{ color: "#8a2be2" }} />
      </button>
    );
  }

  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.2)",
        border: "1px solid rgba(0, 240, 255, 0.15)",
        borderRadius: 16,
        padding: "24px",
        marginTop: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -50, left: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(138,43,226,0.1) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
      
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, position: "relative", zIndex: 1 }}>
        <div style={{ background: "rgba(0, 240, 255, 0.1)", border: "1px solid rgba(0, 240, 255, 0.2)", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={20} color="#00f0ff" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>CryptoNeko AI Analyst</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Groq Powered Real-Time Analysis</div>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-muted)", fontSize: 14 }}>
          <div style={{ width: 16, height: 16, border: "2px solid rgba(0,240,255,0.3)", borderTopColor: "#00f0ff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          Analyzing {coinName} ({symbol}) market data, technicals, and momentum...
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
