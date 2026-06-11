// ============================================================
// pages/Landing.tsx — Purple Design System v3
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Brain, BarChart2, Wallet, Bell, Shield, ArrowRight,
  Check, ChevronDown, TrendingUp, Zap, Globe, Star,
} from "lucide-react";

// ─── THEME ───────────────────────────────────────────────────────
const T = {
  bg: "#020617",
  card: "#0b1227",
  cardHov: "#0f172a",
  purple: "#00f0ff",        // accent = cyan, T.purple kullanılan yerlerde artık cyan
  purpleLight: "#00ffff",
  purpleDim: "rgba(0,240,255,0.12)",
  green: "#2dd4bf",
  greenBg: "rgba(45,212,191,0.1)",
  greenBorder: "rgba(45,212,191,0.2)",
  red: "#f43f5e",
  redBg: "rgba(244,63,94,0.1)",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  border: "rgba(255,255,255,0.06)",
  borderFeat: "rgba(0,240,255,0.25)",
};

// ─── COUNTER ─────────────────────────────────────────────────────
function Counter({ to, suffix = "", prefix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / 1800, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.disconnect();
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── REVEAL ──────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ─── CARD ────────────────────────────────────────────────────────
function Card({ children, style = {}, featured = false }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        background: featured ? "rgba(0,240,255,0.04)" : T.card,
        border: `1px solid ${hov ? (featured ? "rgba(0,240,255,0.4)" : "rgba(0,240,255,0.15)") : (featured ? T.borderFeat : T.border)}`,
        borderRadius: 20,
        position: "relative",
        overflow: "hidden",
        transition: "all 200ms ease",
        boxShadow: hov && featured ? "0 0 40px rgba(0,240,255,0.08)" : "none",
        ...style,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </div>
  );
}

// ─── FAKE SPARKLINE ──────────────────────────────────────────────
function Sparkline({ up = true }) {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const v = up ? i * 3.5 + Math.sin(i * 1.3) * 6 : (16 - i) * 3.5 + Math.sin(i * 1.3) * 6;
    return `${(i / 15) * 80},${36 - Math.min(36, Math.max(0, v - 10))}`;
  }).join(" ");
  const color = up ? T.green : T.red;
  return (
    <svg width={80} height={36} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────
function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        borderRadius: 16,
        border: `1px solid ${open ? T.borderFeat : T.border}`,
        background: open ? "rgba(0,240,255,0.04)" : T.card,
        transition: "all 200ms ease",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: T.textPrimary }}>{q}</span>
        <ChevronDown size={16} style={{ color: T.purple, transition: "transform 200ms", transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 12 }} />
      </div>
      {open && (
        <div style={{ padding: "0 22px 20px", fontSize: 14, color: T.textSecondary, lineHeight: 1.7 }}>{a}</div>
      )}
    </div>
  );
}

// ─── MINI DASHBOARD MOCKUP ───────────────────────────────────────
function DashboardMockup() {
  const coins = [
    { sym: "BTC", price: "$107,412", change: "+2.4%", up: true },
    { sym: "ETH", price: "$3,891", change: "+1.8%", up: true },
    { sym: "SOL", price: "$182", change: "-0.9%", up: false },
    { sym: "BNB", price: "$724", change: "+3.2%", up: true },
  ];
  return (
    <div style={{ background: T.card, border: `1px solid ${T.borderFeat}`, borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,240,255,0.08)" }}>
      {/* Browser bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
        {["#ff5f57","#febc2e","#28c840"].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        <div style={{ flex: 1, marginLeft: 8, height: 22, borderRadius: 6, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 10, color: T.textMuted }}>cryptoneko.app/dashboard</span>
        </div>
      </div>

      <div style={{ padding: "20px 20px" }}>
        {/* Stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { l: "Market Cap", v: "$3.42T" },
            { l: "BTC Dom", v: "54.2%" },
            { l: "Coins", v: "2,500+" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRadius: 12, background: T.bg, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary, fontFamily: "monospace" }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* 2x2 coin grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {coins.map((c, i) => (
            <div key={c.sym} style={{
              padding: "14px 16px", borderRadius: 14,
              background: i === 0 ? "rgba(0,240,255,0.05)" : T.bg,
              border: `1px solid ${i === 0 ? T.borderFeat : T.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{c.sym}</div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: T.textPrimary, fontWeight: 600 }}>{c.price}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8,
                  color: c.up ? T.green : T.red,
                  background: c.up ? T.greenBg : T.redBg,
                  fontFamily: "monospace",
                }}>{c.change}</span>
              </div>
              <Sparkline up={c.up} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────
export default function Landing({ onAuthOpen }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const features = [
    {
      badge: "LIVE DATA",
      badgeColor: "#00c6ff",
      icon: BarChart2,
      title: "Real-Time Market Tracking",
      desc: "Track 2,500+ cryptocurrencies with instant updates. Interactive heatmap, whale alerts, and volume spike detection — all in one place.",
      points: ["Live WebSocket price feeds", "Interactive market heatmap", "Volume anomaly detection"],
      mockupSide: "right",
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { sym: "BTC", price: "$107,412", change: "+2.4%", up: true, bar: 82 },
            { sym: "ETH", price: "$3,891", change: "+1.8%", up: true, bar: 71 },
            { sym: "SOL", price: "$182", change: "-0.9%", up: false, bar: 44 },
            { sym: "BNB", price: "$724", change: "+3.2%", up: true, bar: 60 },
            { sym: "AVAX", price: "$38", change: "-1.5%", up: false, bar: 35 },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: T.bg, border: `1px solid ${T.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,198,255,0.1)", border: "1px solid rgba(0,198,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#00c6ff" }}>{c.sym.slice(0,1)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{c.sym}</div>
                <div style={{ height: 3, width: 50, borderRadius: 2, background: T.border, marginTop: 4 }}>
                  <div style={{ width: `${c.bar}%`, height: "100%", borderRadius: 2, background: c.up ? T.green : T.red }} />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, fontFamily: "monospace" }}>{c.price}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.up ? T.green : T.red, fontFamily: "monospace" }}>{c.change}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      badge: "NEKO AI",
      badgeColor: T.purple,
      icon: Brain,
      title: "AI Portfolio Manager",
      desc: "Powered by Groq Llama 3.3. Neko AI analyzes your full portfolio, detects correlation risks, and gives actionable rebalancing suggestions.",
      points: ["150+ technical indicators analyzed", "MACD, RSI, Bollinger, EMA signals", "Natural language insights"],
      mockupSide: "left",
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,240,255,0.06)", border: `1px solid ${T.borderFeat}` }}>
            <div style={{ fontSize: 9, color: T.purple, fontWeight: 800, letterSpacing: ".15em", marginBottom: 8 }}>🤖 NEKO AI</div>
            <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>Your BTC is up <span style={{ color: "#00c6ff", fontWeight: 700 }}>+18.4%</span>. Consider taking <span style={{ color: T.purple, fontWeight: 700 }}>15% profits</span> to rebalance ETH allocation.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { l: "Portfolio Score", v: "87/100", c: T.green },
              { l: "Risk Level", v: "Medium", c: "#f59e0b" },
              { l: "Correlation", v: "0.72", c: T.purple },
              { l: "Sharpe Ratio", v: "1.84", c: "#00c6ff" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: T.bg, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 4 }}>{s.l}</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: s.c, fontFamily: "monospace" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      badge: "TAX & REPORTS",
      badgeColor: T.green,
      icon: Wallet,
      title: "Automated Tax Calculation",
      desc: "Import from Binance, Bybit, OKX, Coinbase or Kraken. FIFO P&L calculated instantly in your browser. Export ready tax reports in seconds.",
      points: ["Browser-only — data never leaves device", "FIFO P&L calculation", "CSV export for tax filing"],
      mockupSide: "right",
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Transaction History</span>
            <span style={{ fontSize: 10, color: T.green, fontWeight: 700, background: T.greenBg, padding: "2px 10px", borderRadius: 100, border: `1px solid ${T.greenBorder}` }}>FY 2024</span>
          </div>
          {[
            { type: "BUY", asset: "BTC", amount: "+0.42", value: "$43,210", pnl: null },
            { type: "SELL", asset: "ETH", amount: "-2.5", value: "$8,340", pnl: "+$1,240" },
            { type: "SELL", asset: "SOL", amount: "-45", value: "$6,750", pnl: "+$3,100" },
            { type: "BUY", asset: "BNB", amount: "+8.2", value: "$4,120", pnl: null },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: T.bg, border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, color: t.type === "BUY" ? T.green : T.red, background: t.type === "BUY" ? T.greenBg : T.redBg, letterSpacing: ".08em" }}>{t.type}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{t.asset} <span style={{ color: T.textMuted, fontSize: 11 }}>{t.amount}</span></div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: T.textMuted }}>{t.value}</div>
              </div>
              {t.pnl && <span style={{ fontSize: 12, fontWeight: 800, color: T.green, fontFamily: "monospace" }}>{t.pnl}</span>}
            </div>
          ))}
          <div style={{ padding: "12px 16px", borderRadius: 12, background: T.greenBg, border: `1px solid ${T.greenBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Total Realized P&L</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: T.green, fontFamily: "monospace" }}>+$4,340</span>
          </div>
        </div>
      ),
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      sub: "forever",
      featured: false,
      cta: "Get Started",
      perks: [
        "Live prices for 2,500+ coins",
        "Market heatmap",
        "Watchlist (up to 10 coins)",
        "Basic price alerts",
        "Coin comparison tool",
        "Correlation matrix",
      ],
    },
    {
      name: "Pro",
      price: "$10",
      sub: "/ month",
      featured: true,
      cta: "Start Pro",
      perks: [
        "Everything in Free",
        "AI Technical Analysis",
        "Portfolio tracker & P&L",
        "Automated tax reports (CSV)",
        "Unlimited price alerts",
        "Volume spike radar",
        "Priority data access",
      ],
    },
  ];

  const faqs = [
    { q: "How does AI analysis work?", a: "We combine Altfins pre-computed signals (150+ technical indicators across 2,500+ coins) with Groq Llama 3.3 to generate market assessments. The AI processes RSI, MACD, Bollinger Bands, Stochastic, EMA — and produces bullish/bearish/neutral signals with confidence scores." },
    { q: "Is CryptoNeko really free?", a: "Yes. The free plan includes live data for 2,500+ coins, heatmap, coin comparison, watchlist (up to 10), and basic alerts — forever. No credit card needed. Pro ($10/mo) unlocks AI analysis, portfolio tracker, tax reports, and unlimited alerts." },
    { q: "Is my data safe?", a: "Completely. Your portfolio and trade data never leaves your browser — CSV files are parsed locally in JavaScript. We never store, sell or transmit your financial data. Only your email is stored via Supabase for authentication." },
    { q: "Which exchanges are supported?", a: "CSV imports from Binance, Bybit, OKX, Coinbase and Kraken. Export your trade history and drag & drop into Portfolio Tracker. P&L and tax calculations happen instantly in your browser." },
    { q: "Can I cancel anytime?", a: "Yes. Your Pro access continues until end of billing period, then reverts to free — no questions asked." },
  ];

  return (
    <div style={{ background: T.bg, color: T.textPrimary, fontFamily: "Inter, sans-serif", overflowX: "clip" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes lp-ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes lp-grad { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      `}</style>

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "130px clamp(20px,5vw,80px) 100px", textAlign: "center", maxWidth: 1100, margin: "0 auto" }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "10%", left: "15%", width: 500, height: 500, background: "radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 60%)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", top: "30%", right: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(0,198,255,0.08) 0%, transparent 60%)", filter: "blur(60px)" }} />
          {/* Dot grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "36px 36px", maskImage: "linear-gradient(to bottom, black 40%, transparent 90%)", WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 90%)" }} />
        </div>

        {/* Live badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(52,211,153,0.08)", border: `1px solid ${T.greenBorder}`, marginBottom: 32, animation: "lp-pulse 3s infinite" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.green, letterSpacing: "0.06em" }}>Live · 2,500+ coins tracked</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(44px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", margin: "0 0 24px" }}>
          <span style={{ color: T.textPrimary }}>The smartest way to<br />analyze </span>
          <span style={{
            background: `linear-gradient(135deg, #00f0ff 0%, #00ffff 40%, #38bdf8 100%)`,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "lp-grad 6s linear infinite",
          }}>
            crypto markets.
          </span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2.2vw, 20px)", color: T.textSecondary, maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7 }}>
          Real-time data, AI-driven technical analysis, and portfolio tracking — all in one blazing fast platform.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
          {!isLoggedIn && (
            <button
              onClick={() => onAuthOpen?.("signup")}
              style={{
                padding: "14px 32px", borderRadius: 14, border: "none", cursor: "pointer",
                background: T.purple, color: "white",
                fontSize: 15, fontWeight: 800,
                boxShadow: `0 0 32px rgba(0,240,255,0.35)`,
                transition: "all 200ms ease",
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 48px rgba(0,240,255,0.5)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 32px rgba(0,240,255,0.35)"; e.currentTarget.style.transform = ""; }}
            >
              Get Started Free <ArrowRight size={16} />
            </button>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "14px 32px", borderRadius: 14, cursor: "pointer",
              background: isLoggedIn ? T.purple : "transparent",
              color: isLoggedIn ? "white" : T.textSecondary,
              fontSize: 15, fontWeight: isLoggedIn ? 800 : 600,
              border: isLoggedIn ? "none" : `1px solid ${T.border}`,
              transition: "all 200ms ease",
              boxShadow: isLoggedIn ? "0 0 32px rgba(0,240,255,0.35)" : "none",
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {isLoggedIn ? "Go to Dashboard" : "View Dashboard →"} {isLoggedIn && <ArrowRight size={16} />}
          </button>
        </div>
        {!isLoggedIn && <div style={{ fontSize: 12, color: T.textMuted }}>No credit card required · Free plan available forever</div>}

        {/* Stat row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginTop: 64, flexWrap: "wrap" }}>
          {[
            { v: 2500, s: "+", p: "", l: "Coins Tracked" },
            { v: 5, s: "+", p: "", l: "AI Indicators" },
            { v: 99, s: "%", p: "", l: "Uptime" },
            { v: 0, s: "", p: "$", l: "To Get Started" },
          ].map((st, i) => (
            <div key={i} style={{ padding: "0 clamp(20px,4vw,48px)", borderRight: i < 3 ? `1px solid ${T.border}` : "none", textAlign: "center" }}>
              <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: T.purple, fontFamily: "monospace", letterSpacing: "-0.02em", lineHeight: 1 }}>
                <Counter to={st.v} suffix={st.s} prefix={st.p} />
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{st.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DASHBOARD PREVIEW ───────────────────────────────── */}
      <section style={{ padding: "0 clamp(20px,5vw,80px) 80px", maxWidth: 1000, margin: "0 auto" }}>
        <Reveal>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: -40, background: `radial-gradient(ellipse at center, rgba(0,240,255,0.12) 0%, transparent 60%)`, filter: "blur(40px)", pointerEvents: "none" }} />
            <DashboardMockup />
          </div>
        </Reveal>
      </section>



      {/* ─── FEATURE STICKY CARDS ────────────────────────────── */}
      <section style={{ padding: "0 clamp(20px,5vw,80px)", maxWidth: 1200, margin: "0 auto 160px" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <Reveal>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.purple, marginBottom: 16 }}>◆ Features</div>
            <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1 }}>
              Professional tools.<br />
              <span style={{ color: T.textMuted }}>Zero complexity.</span>
            </h2>
          </Reveal>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 100, position: "relative" }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            const isRight = f.mockupSide === "right";
            return (
              <Reveal key={i} delay={0.1}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 60,
                    alignItems: "center",
                    padding: "72px 72px",
                    borderRadius: 36,
                    background: `rgba(15,15,26,0.98)`,
                    border: `1px solid ${T.border}`,
                    boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* bg glow */}
                  <div style={{ position: "absolute", top: "-40%", left: isRight ? "-10%" : "auto", right: isRight ? "auto" : "-10%", width: "60%", height: "180%", background: `radial-gradient(circle, ${f.badgeColor}10 0%, transparent 55%)`, filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />

                {/* Text */}
                <div style={{ position: "relative", zIndex: 1, order: isRight ? 1 : 2 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", borderRadius: 100, background: `${f.badgeColor}12`, border: `1px solid ${f.badgeColor}35`, color: f.badgeColor, fontSize: 12, fontWeight: 800, letterSpacing: ".12em", marginBottom: 28, boxShadow: `0 0 20px ${f.badgeColor}20` }}>
                    <Icon size={14} />{f.badge}
                  </div>
                  <h3 style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 900, color: T.textPrimary, margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>{f.title}</h3>
                  <p style={{ fontSize: "clamp(15px,1.8vw,18px)", color: T.textSecondary, lineHeight: 1.7, margin: "0 0 32px", maxWidth: 460 }}>{f.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {f.points.map((pt, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 6, background: `${f.badgeColor}15`, border: `1px solid ${f.badgeColor}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={10} style={{ color: f.badgeColor }} />
                        </div>
                        <span style={{ fontSize: 14, color: T.textSecondary }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mockup panel */}
                <div style={{ position: "relative", zIndex: 1, order: isRight ? 2 : 1, background: "rgba(10,10,15,0.8)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                    {["#ff5f57","#febc2e","#28c840"].map((c,idx) => <div key={idx} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
                    <div style={{ flex: 1, marginLeft: 6, height: 18, borderRadius: 5, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 9, color: T.textMuted }}>cryptoneko.app</span>
                    </div>
                  </div>
                  {f.mockup}
                </div>
              </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────── */}
      <section style={{ padding: "0 clamp(20px,5vw,80px) 120px", maxWidth: 900, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.purple, marginBottom: 16 }}>◆ Pricing</div>
            <h2 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Start free.<br /><span style={{ color: T.textMuted }}>Upgrade when ready.</span></h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {plans.map((plan) => (
              <Card key={plan.name} featured={plan.featured} style={{ padding: "40px 36px" }}>
                {plan.featured && (
                  <div style={{ position: "absolute", top: 0, left: "50%", transform: "translate(-50%, -50%)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", padding: "4px 16px", borderRadius: 100, background: T.purple, color: "white" }}>MOST POPULAR</div>
                  </div>
                )}
                {/* Corner glow */}
                {plan.featured && <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, rgba(0,240,255,0.15) 0%, transparent 60%)", filter: "blur(30px)", pointerEvents: "none" }} />}

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: plan.featured ? T.purple : T.textMuted, marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 32 }}>
                    <span style={{ fontSize: 52, fontWeight: 900, color: T.textPrimary, letterSpacing: "-0.04em", lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 16, color: T.textMuted, marginBottom: 8 }}>{plan.sub}</span>
                  </div>

                  <button
                    onClick={() => onAuthOpen?.("signup")}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 12, cursor: "pointer",
                      border: plan.featured ? "none" : `1px solid ${T.borderFeat}`,
                      background: plan.featured ? T.purple : "transparent",
                      color: plan.featured ? "white" : T.purple,
                      fontSize: 14, fontWeight: 700,
                      transition: "all 200ms ease",
                      marginBottom: 32,
                      boxShadow: plan.featured ? "0 0 24px rgba(0,240,255,0.3)" : "none",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                  >
                    {plan.cta}
                  </button>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {plan.perks.map((perk, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 6, background: plan.featured ? "rgba(0,240,255,0.12)" : T.greenBg, border: `1px solid ${plan.featured ? T.borderFeat : T.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={10} style={{ color: plan.featured ? T.purple : T.green }} />
                        </div>
                        <span style={{ fontSize: 13, color: T.textSecondary }}>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────── */}
      <section style={{ padding: "0 clamp(20px,5vw,80px) 120px", maxWidth: 740, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.purple, marginBottom: 16 }}>◆ FAQ</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Common questions</h2>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {faqs.map((faq, i) => <Faq key={i} {...faq} />)}
          </div>
        </Reveal>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────── */}
      <section style={{ padding: "0 clamp(20px,5vw,80px) 120px", maxWidth: 900, margin: "0 auto" }}>
        <Reveal>
          <div style={{ position: "relative", padding: "80px 60px", borderRadius: 36, background: "rgba(0,240,255,0.05)", border: `1px solid ${T.borderFeat}`, textAlign: "center", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(0,240,255,0.15) 0%, transparent 60%)", filter: "blur(60px)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.purple, marginBottom: 20 }}>◆ Get Started</div>
              <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px" }}>Ready to analyze smarter?</h2>
              <p style={{ fontSize: 18, color: T.textSecondary, margin: "0 0 48px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
                Join thousands of traders using CryptoNeko to stay ahead of the market.
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                {!isLoggedIn ? (
                  <button
                    onClick={() => onAuthOpen?.("signup")}
                    style={{ padding: "14px 36px", borderRadius: 14, border: "none", cursor: "pointer", background: T.purple, color: "white", fontSize: 15, fontWeight: 800, boxShadow: "0 0 32px rgba(0,240,255,0.35)", transition: "all 200ms" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 48px rgba(0,240,255,0.5)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 32px rgba(0,240,255,0.35)"; e.currentTarget.style.transform = ""; }}
                  >
                    Create Free Account
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/dashboard")}
                    style={{ padding: "14px 36px", borderRadius: 14, border: "none", cursor: "pointer", background: T.purple, color: "white", fontSize: 15, fontWeight: 800, boxShadow: "0 0 32px rgba(0,240,255,0.35)", transition: "all 200ms", display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 48px rgba(0,240,255,0.5)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 32px rgba(0,240,255,0.35)"; e.currentTarget.style.transform = ""; }}
                  >
                    Go to Dashboard <ArrowRight size={16} />
                  </button>
                )}
                <button
                  onClick={() => navigate("/market")}
                  style={{ padding: "14px 32px", borderRadius: 14, cursor: "pointer", background: "transparent", color: T.textSecondary, fontSize: 15, fontWeight: 600, border: `1px solid ${T.border}`, transition: "all 200ms" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderFeat; e.currentTarget.style.color = T.textPrimary; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}
                >
                  Explore Markets
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "40px clamp(20px,5vw,80px)", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: T.purple, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src="/logo.png" alt="CryptoNeko" style={{ width: "100%", borderRadius: 8 }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary }}>CryptoNeko</span>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { l: "Terms", p: "/terms" },
              { l: "Privacy", p: "/privacy" },
              { l: "Docs", p: "/docs" },
              { l: "Pricing", p: "/pricing" },
            ].map(link => (
              <span key={link.l} onClick={() => navigate(link.p)} style={{ fontSize: 13, color: T.textMuted, cursor: "pointer", transition: "color 150ms" }}
                onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
                onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
                {link.l}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>© 2025 CryptoNeko. Not financial advice.</div>
        </div>
      </footer>
    </div>
  );
}
