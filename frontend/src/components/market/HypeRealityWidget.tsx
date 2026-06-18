import React, { useMemo } from "react";
import { AlertCircle, Activity, MessageCircle, Info } from "lucide-react";

export interface HypeRealityData {
  socialHypeScore: number;
  onChainActivityScore: number;
  aiVerdict: string;
}

// Simulated mock generator based on symbol
const generateMockData = (symbol: string): HypeRealityData => {
  // Deterministic mock generation based on string length and char codes
  const seed = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Some coins intentionally rigged for testing warning state (e.g., DOGE, SHIB)
  const isMeme = ["DOGE", "SHIB", "PEPE", "FLOKI"].includes(symbol.toUpperCase());
  const isSolid = ["BTC", "ETH", "SOL", "LINK"].includes(symbol.toUpperCase());
  
  let socialHypeScore = (seed % 60) + 40; // 40-100
  let onChainActivityScore = ((seed * 13) % 70) + 30; // 30-100

  if (isMeme) {
    socialHypeScore = 92;
    onChainActivityScore = 25;
  } else if (isSolid) {
    socialHypeScore = 85;
    onChainActivityScore = 88;
  }

  const diff = socialHypeScore - onChainActivityScore;
  let aiVerdict = "";

  if (diff > 30) {
    aiVerdict = "High social volume but flat on-chain growth. High risk of a synthetic pump driven by retail sentiment.";
  } else if (onChainActivityScore >= socialHypeScore) {
    aiVerdict = "Strong fundamental adoption backing social mentions. Healthy and sustainable growth profile.";
  } else {
    aiVerdict = "Social hype outpaces on-chain metrics slightly, but remains within normal retail cyclical bounds.";
  }

  return { socialHypeScore, onChainActivityScore, aiVerdict };
};

interface HypeRealityWidgetProps {
  symbol?: string;
}

export default function HypeRealityWidget({ symbol = "BTC" }: HypeRealityWidgetProps) {
  const data = useMemo(() => generateMockData(symbol), [symbol]);
  
  const diff = data.socialHypeScore - data.onChainActivityScore;
  const isWarning = diff > 30;
  const isHealthy = data.onChainActivityScore >= data.socialHypeScore;

  // Colors aligned with the professional dark theme (Zerion/Uniswap style)
  const themeAccent = isWarning ? "var(--negative)" : isHealthy ? "var(--positive)" : "var(--accent)";
  const themeBg = isWarning ? "var(--negative-soft)" : isHealthy ? "var(--positive-soft)" : "var(--accent-soft)";

  return (
    <div className="glass-card" style={{ padding: "24px", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Activity size={18} color="var(--text-secondary)" />
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Hype vs. Reality
          </h3>
        </div>
        {isWarning && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: themeAccent, background: themeBg, padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <AlertCircle size={14} />
            <span>Bubble Risk</span>
          </div>
        )}
      </div>

      {/* Bars Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Social Hype Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px", color: "var(--text-secondary)", fontWeight: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageCircle size={15} /> <span>Social Hype</span>
            </div>
            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", fontSize: "14px" }}>{data.socialHypeScore}<span style={{color: "var(--text-muted)", fontSize: "11px"}}>/100</span></span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${data.socialHypeScore}%`, height: "100%", background: isWarning ? "var(--negative)" : "var(--accent)", borderRadius: "4px", transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }} />
          </div>
        </div>

        {/* On-Chain Reality Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px", color: "var(--text-secondary)", fontWeight: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={15} /> <span>On-Chain Reality</span>
            </div>
            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", fontSize: "14px" }}>{data.onChainActivityScore}<span style={{color: "var(--text-muted)", fontSize: "11px"}}>/100</span></span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${data.onChainActivityScore}%`, height: "100%", background: isWarning ? "var(--text-muted)" : "var(--positive)", borderRadius: "4px", transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }} />
          </div>
        </div>
      </div>

      {/* AI Verdict */}
      <div style={{ background: "var(--bg-surface)", borderRadius: "10px", padding: "16px", borderLeft: `3px solid ${themeAccent}`, marginTop: "4px" }}>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <Info size={18} color={themeAccent} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span><strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>AI Verdict:</strong> {data.aiVerdict}</span>
        </p>
      </div>
    </div>
  );
}
