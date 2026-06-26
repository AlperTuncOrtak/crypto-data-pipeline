import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Zap,
  BarChart2,
  Bell,
  Webhook,
  Palette,
  Sparkles,
  Terminal,
  ArrowRight,
  Check,
  Cpu,
  RefreshCw,
  FolderSync
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ── Theme Switcher Config ──────────────────────────────────────
const THEMES = [
  { id: "dark", label: "Linear Dark", bg: "#0a0a0a", border: "rgba(255, 255, 255, 0.08)", accent: "#5e6ad2", accentSoft: "rgba(94, 106, 210, 0.12)", text: "#e8e8f0", textMuted: "#8e8ea0" },
  { id: "purple", label: "Purple Mist", bg: "#0d071a", border: "rgba(139, 92, 246, 0.18)", accent: "#8b5cf6", accentSoft: "rgba(139, 92, 246, 0.12)", text: "#e9d5ff", textMuted: "#a78bfa" },
  { id: "forest", label: "Forest Glow", bg: "#040e08", border: "rgba(16, 185, 129, 0.18)", accent: "#10b981", accentSoft: "rgba(16, 185, 129, 0.12)", text: "#d1fae5", textMuted: "#34d399" },
  { id: "light", label: "Light Frost", bg: "#ffffff", border: "rgba(15, 23, 42, 0.09)", accent: "#5e6ad2", accentSoft: "rgba(94, 106, 210, 0.06)", text: "#0f172a", textMuted: "#64748b" }
];

// ── AI Simulator Prompts & Responses ──────────────────────────
const PROMPTS = {
  btc: "🤖 [BTC/USDT Analysis]\nTrend: Strong Bullish (Confidence: 89%)\nIndicators: RSI is at 62.4 (neutral-bullish), MACD crossover completed on 4h timeframe, Bollinger Bands expanding upwards.\nAltfins AI Signal: Bullish breakout pattern confirmed. Target: $105,000, Support: $94,200.",
  sentiment: "🤖 [Market Sentiment Summary]\nFear & Greed Index: 74 (Greed)\nSocial Volume: SOL mentions up 12% in 2h. Sentiment ratio 4.2x bullish to bearish.\nAI Assessment: High risk-appetite. Large whale transactions detected transferring USDC to decentralized markets.",
  anomalies: "🤖 [Volume Spike Anomalies]\nAlert: SOL volume spiked 420% above 24h moving average on Bybit.\nAlert: BNB price volatility increased to 8.2% on Gate.io (breakout support at $580).\nWhale Watch: $42M USDT deposited into exchange orderbook in the last 15 minutes."
};

// ── Feature Card ──────────────────────────────────────────────
interface BentoCardProps {
  icon: any;
  title: string;
  desc: string;
  accentColor: string;
}

function BentoCard({ icon: Icon, title, desc, accentColor }: BentoCardProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });
  }

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "24px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)"
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mouse Spotlight Background */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background: `radial-gradient(300px circle at ${coords.x}px ${coords.y}px, rgba(94, 106, 210, 0.05), transparent 80%)`
          }}
        />
      )}

      {/* Mouse Spotlight Border Glow */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            borderRadius: 16,
            border: `1px solid transparent`,
            backgroundImage: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, ${accentColor || "var(--accent)"}, transparent 100%)`,
            backgroundOrigin: "border-box",
            backgroundClip: "border-box",
            WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "destination-out",
            maskComposite: "exclude"
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${accentColor || "var(--accent)"}15`,
            border: `1px solid ${accentColor || "var(--accent)"}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8
          }}
        >
          <Icon size={20} style={{ color: accentColor || "var(--accent)" }} />
        </div>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</h4>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function Pro() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);

  // Tema Switcher State
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);

  // AI Simulator State
  const [simulatedText, setSimulatedText] = useState("");
  const [typing, setTyping] = useState(false);
  const [activePrompt, setActivePrompt] = useState("");
  const timerRef = useRef<number | null>(null);

  function startAISimulator(promptKey: keyof typeof PROMPTS) {
    if (typing) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setTyping(true);
    setActivePrompt(promptKey);
    setSimulatedText("");
    
    const fullText = PROMPTS[promptKey];
    let index = 0;
    
    timerRef.current = window.setInterval(() => {
      if (index < fullText.length) {
        setSimulatedText((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        setTyping(false);
      }
    }, 20); // typing speed ms
  }

  useEffect(() => {
    // Start with BTC simulation on mount
    startAISimulator("btc");
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleScrollToFeatures() {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div
      style={{
        position: "relative",
        color: "var(--text-primary)",
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 24px 80px",
        overflow: "hidden"
      }}
    >
      {/* Background Aurora Blobs */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: "5%",
          width: 450,
          height: 450,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          opacity: 0.08,
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 600,
          right: "5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--secondary) 0%, transparent 70%)",
          opacity: 0.06,
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* HERO SECTION */}
        <div style={{ textAlign: "center", marginBottom: 72, marginTop: 48 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
              marginBottom: 16
            }}
          >
            <Crown size={12} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
              {t("pro_page.hero_badge")}
            </span>
          </div>

          <h1
            style={{
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              marginBottom: 16,
              lineHeight: 1.1
            }}
          >
            {t("pro_page.hero_title1")}
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              {t("pro_page.hero_title2")}
            </span>
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              maxWidth: 580,
              margin: "0 auto 36px",
              lineHeight: 1.6
            }}
          >
            {t("pro_page.hero_desc")}
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/pricing")}
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(94, 106, 210, 0.15)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {t("pro_page.cta_upgrade")} <ArrowRight size={14} />
            </button>
            <button
              onClick={handleScrollToFeatures}
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                background: "transparent",
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: 14,
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--text-muted)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {t("pro_page.cta_pricing")}
            </button>
          </div>
        </div>

        {/* BENTO GRID SHOWCASE */}
        <div ref={featuresRef} style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 36,
              letterSpacing: "-0.02em"
            }}
          >
            {t("pro_page.features_title")}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20
            }}
          >
            <BentoCard
              icon={Cpu}
              title={t("pro_page.feature_ai_title")}
              desc={t("pro_page.feature_ai_desc")}
              accentColor="rgba(94, 106, 210, 0.4)"
            />
            <BentoCard
              icon={Bell}
              title={t("pro_page.feature_alerts_title")}
              desc={t("pro_page.feature_alerts_desc")}
              accentColor="rgba(139, 92, 246, 0.4)"
            />
            <BentoCard
              icon={FolderSync}
              title={t("pro_page.feature_portfolio_title")}
              desc={t("pro_page.feature_portfolio_desc")}
              accentColor="rgba(16, 185, 129, 0.4)"
            />
          </div>
        </div>

        {/* THEME SWITCHER MODUL (RAYCAST THEMES) */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.01)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "40px",
            marginBottom: 80,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 40,
            alignItems: "center"
          }}
        >
          <div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.02em" }}>
              {t("pro_page.themes_title")}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: 24
              }}
            >
              {t("pro_page.themes_subtitle")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: selectedTheme.id === theme.id ? "rgba(255, 255, 255, 0.04)" : "transparent",
                    border: `1px solid ${selectedTheme.id === theme.id ? "var(--border-mid)" : "transparent"}`,
                    cursor: "pointer",
                    textAlign: "left",
                    color: selectedTheme.id === theme.id ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: 13,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTheme.id !== theme.id) e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTheme.id !== theme.id) e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: theme.accent }} />
                    {theme.label}
                  </div>
                  {selectedTheme.id === theme.id && <Check size={14} style={{ color: theme.accent }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mockup Box */}
          <div
            style={{
              background: selectedTheme.bg,
              border: `1px solid ${selectedTheme.border}`,
              borderRadius: 16,
              padding: "24px",
              minHeight: 250,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              transition: "all 0.3s ease",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", borderBottom: `1px solid ${selectedTheme.border}`, paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: selectedTheme.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Palette size={12} style={{ color: selectedTheme.accent }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: selectedTheme.text }}>Preview Workspace</span>
              </div>
              <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "red" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "yellow" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "green" }} />
              </div>
            </div>

            {/* Simulated Widget Content */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.01)", border: `1px solid ${selectedTheme.border}`, borderRadius: 10, padding: 12 }}>
                <span style={{ fontSize: 10, color: selectedTheme.textMuted, fontWeight: 600 }}>BTC / USDT</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: selectedTheme.text, marginTop: 4 }}>$103,450</div>
                <span style={{ fontSize: 9, color: "#2ecc71", fontWeight: 700 }}>+3.2%</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.01)", border: `1px solid ${selectedTheme.border}`, borderRadius: 10, padding: 12 }}>
                <span style={{ fontSize: 10, color: selectedTheme.textMuted, fontWeight: 600 }}>ETH / USDT</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: selectedTheme.text, marginTop: 4 }}>$3,620</div>
                <span style={{ fontSize: 9, color: "#2ecc71", fontWeight: 700 }}>+1.5%</span>
              </div>
            </div>

            {/* Mock Chat input */}
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${selectedTheme.border}`, borderRadius: 8, padding: "8px 12px" }}>
              <Sparkles size={12} style={{ color: selectedTheme.accent }} />
              <span style={{ fontSize: 11, color: selectedTheme.textMuted }}>Ask AI about the crypto market...</span>
            </div>
          </div>
        </div>

        {/* AI SIMULATOR TERMINAL */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.01)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "40px",
            marginBottom: 80
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>
              {t("pro_page.simulator_title")}
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {t("pro_page.simulator_subtitle")}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: 24,
              alignItems: "stretch"
            }}
          >
            {/* Command prompts list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => startAISimulator("btc")}
                disabled={typing}
                style={{
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: activePrompt === "btc" ? "var(--accent-soft)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${activePrompt === "btc" ? "var(--accent-border)" : "var(--border)"}`,
                  color: activePrompt === "btc" ? "var(--text-primary)" : "var(--text-secondary)",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: typing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s"
                }}
              >
                <span>📈 BTC Technical Analysis</span>
                {activePrompt === "btc" && typing && <RefreshCw size={12} className="animate-spin" style={{ color: "var(--accent)" }} />}
              </button>

              <button
                onClick={() => startAISimulator("sentiment")}
                disabled={typing}
                style={{
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: activePrompt === "sentiment" ? "var(--accent-soft)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${activePrompt === "sentiment" ? "var(--accent-border)" : "var(--border)"}`,
                  color: activePrompt === "sentiment" ? "var(--text-primary)" : "var(--text-secondary)",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: typing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s"
                }}
              >
                <span>🧠 AI Sentiment Analyzer</span>
                {activePrompt === "sentiment" && typing && <RefreshCw size={12} className="animate-spin" style={{ color: "var(--accent)" }} />}
              </button>

              <button
                onClick={() => startAISimulator("anomalies")}
                disabled={typing}
                style={{
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: activePrompt === "anomalies" ? "var(--accent-soft)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${activePrompt === "anomalies" ? "var(--accent-border)" : "var(--border)"}`,
                  color: activePrompt === "anomalies" ? "var(--text-primary)" : "var(--text-secondary)",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: typing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s"
                }}
              >
                <span>⚡ Volume Anomalies Radar</span>
                {activePrompt === "anomalies" && typing && <RefreshCw size={12} className="animate-spin" style={{ color: "var(--accent)" }} />}
              </button>
            </div>

            {/* Chat Simulator Console output */}
            <div
              style={{
                background: "#000000",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "24px",
                fontFamily: "'Geist Mono', 'Fira Code', Courier, monospace",
                fontSize: 13,
                color: "#10b981",
                minHeight: 200,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 10, marginBottom: 12 }}>
                <Terminal size={14} style={{ color: "#a855f7" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>cryptoneko-intelligence-shell</span>
              </div>
              <div style={{ flex: 1, whiteSpace: "pre-line", lineHeight: 1.6 }}>
                {simulatedText}
                {typing && <span style={{ display: "inline-block", width: 8, height: 14, background: "#10b981", marginLeft: 4, animation: "pulse 1s infinite" }}>|</span>}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CALL TO ACTION */}
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "linear-gradient(135deg, rgba(94, 106, 210, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
            border: "1px solid var(--accent-border)",
            borderRadius: 20
          }}
        >
          <Crown size={32} style={{ color: "var(--accent)", marginBottom: 16 }} />
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>
            Ready to unleash precision trading?
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            Join thousands of traders using Pro analytics. Try it free for 7 days.
          </p>
          <button
            onClick={() => navigate("/pricing")}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(94, 106, 210, 0.15)"
            }}
          >
            Start Your Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}
