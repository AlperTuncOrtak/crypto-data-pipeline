// ============================================================
// pages/Landing.tsx — Purple Design System v3
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useMarket, useMarketStats } from "../hooks/useMarket";
import { motion } from "framer-motion";
import {
  Brain, BarChart2, Wallet, Bell, Shield, ArrowRight,
  Check, ChevronDown, TrendingUp, Zap, Globe, Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCoinColor } from "../utils/colors";


// ─── THEME ───────────────────────────────────────────────────────
const T = {
  bg: "#0d0d0f",
  card: "#19191c",
  cardHov: "#1c1c1f",
  purple: "#3b82f6",        // accent = professional blue
  purpleLight: "#60a5fa",
  purpleDim: "rgba(59,130,246,0.10)",
  green: "#22c55e",
  greenBg: "rgba(34,197,94,0.08)",
  greenBorder: "rgba(34,197,94,0.18)",
  red: "#ef4444",
  redBg: "rgba(239,68,68,0.08)",
  textPrimary: "#ffffff",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  border: "rgba(255,255,255,0.08)",
  borderFeat: "rgba(59,130,246,0.20)",
};

// ─── FLOATING COIN CARDS (Uniswap style) ──────────────────────────
const FLOATING_COINS = [
  { sym: "BTC",  slug: "bitcoin",     name: "Bitcoin",  price: "$107,412", change: "+2.4%", up: true,  img: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",    top: "12%", left: "10%",   delay: 0,   dur: 7.0, size: 52 },
  { sym: "ETH",  slug: "ethereum",    name: "Ethereum", price: "$3,891",   change: "+1.8%", up: true,  img: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",  top: "55%", left: "14%",   delay: 1.5, dur: 7.4, size: 46 },
  { sym: "SOL",  slug: "solana",      name: "Solana",   price: "$182",     change: "-0.9%", up: false, img: "https://assets.coingecko.com/coins/images/4128/small/solana.png",   top: "18%", right: "10%",  delay: 0.8, dur: 6.4, size: 44 },
  { sym: "BNB",  slug: "binancecoin", name: "BNB",      price: "$724",     change: "+3.2%", up: true,  img: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", top: "62%", right: "12%", delay: 2.2, dur: 7.8, size: 42 },
  { sym: "XRP",  slug: "ripple",      name: "XRP",      price: "$2.18",    change: "+5.1%", up: true,  img: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", top: "78%", left: "16%", delay: 1.1, dur: 8.2, size: 38 },
  { sym: "DOGE", slug: "dogecoin",    name: "Dogecoin", price: "$0.38",    change: "+7.3%", up: true,  img: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",    top: "8%",  right: "16%",  delay: 3.0, dur: 6.6, size: 40 },
];

function FloatingCoinCard({ sym, name, price, change, up, img, top, left, right, delay, dur, size, onClick }: {
  sym: string; name: string; price: string; change: string; up: boolean;
  img: string; top: string; left?: string; right?: string; delay: number; dur: number; size: number;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const accentColor = up ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.4)";
  const isTopHalf = parseInt(top) < 30; // Check if the coin is near the top edge

  return (
    <div
      style={{
        position: "absolute",
        top, left: left ?? "auto", right: right ?? "auto",
        zIndex: 2,
        cursor: "pointer",
        pointerEvents: "auto", // Enable pointer events only for the coin cards
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <style>{`
        @keyframes fc-float-${sym} {
          0%, 100% { transform: translateY(0px); }
          45% { transform: translateY(-${9 + delay}px); }
          70% { transform: translateY(-${4 + delay * 0.5}px); }
        }
        .fc-wrap-${sym} { animation: fc-float-${sym} ${dur}s ease-in-out ${delay}s infinite; }
        @keyframes fc-reveal-up { from { opacity:0; transform:translateY(10px) scale(0.93); filter: blur(4px); } to { opacity:1; transform:translateY(0) scale(1); filter: blur(0); } }
        @keyframes fc-reveal-down { from { opacity:0; transform:translateY(-10px) scale(0.93); filter: blur(4px); } to { opacity:1; transform:translateY(0) scale(1); filter: blur(0); } }
      `}</style>

      <div className={`fc-wrap-${sym}`} style={{ position: "relative" }}>

        {/* ── Blurred circle icon ── */}
        <div style={{
          width: size, height: size,
          borderRadius: "50%",
          overflow: "hidden",
          border: `1px solid ${hovered ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.04)"}`,
          boxShadow: hovered
            ? `0 0 0 4px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5)`
            : "0 4px 20px rgba(0,0,0,0.5)",
          filter: hovered ? "blur(0px)" : "blur(4px)",
          opacity: hovered ? 1 : 0.4,
          transition: "all 300ms cubic-bezier(0.16,1,0.3,1)",
          transform: hovered ? "scale(1.12)" : "scale(1)",
          background: "rgba(0,0,0,0.6)",
        }}>
          <img src={img} alt={sym} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>

        {/* ── Reveal card on hover ── */}
        {hovered && (
          <div style={{
            position: "absolute",
            bottom: isTopHalf ? "auto" : `calc(100% + 14px)`,
            top: isTopHalf ? `calc(100% + 14px)` : "auto",
            left: right ? "auto" : "50%",
            right: right ? "50%" : "auto",
            transform: right ? "translateX(32px)" : "translateX(-32px)",
            background: "rgba(10,10,10,0.85)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: `1px solid rgba(255,255,255,0.1)`,
            borderRadius: 20,
            padding: "16px 20px",
            minWidth: 200,
            boxShadow: `0 30px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)`,
            animation: `${isTopHalf ? "fc-reveal-down" : "fc-reveal-up"} 200ms cubic-bezier(0.16,1,0.3,1) forwards`,
            zIndex: 20,
            pointerEvents: "none",
          }}>
            {/* Arrow */}
            <div style={{
              position: "absolute", 
              bottom: isTopHalf ? "auto" : -7, 
              top: isTopHalf ? -7 : "auto", 
              left: right ? "auto" : "26px", 
              right: right ? "26px" : "auto",
              width: 14, height: 7,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: isTopHalf ? "none" : `7px solid rgba(255,255,255,0.1)`,
              borderBottom: isTopHalf ? `7px solid rgba(255,255,255,0.1)` : "none",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <img src={img} alt={sym} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>{sym}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{name}</div>
              </div>
            </div>

            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontFamily: "monospace", letterSpacing: "-0.04em", marginBottom: 10 }}>
              {price}
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 100,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid rgba(255,255,255,0.08)`,
              width: "fit-content",
            }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: up ? "#34d399" : "#f43f5e", boxShadow: `0 0 8px ${up ? "#34d399" : "#f43f5e"}` }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: up ? "#34d399" : "#f43f5e", fontFamily: "monospace", letterSpacing: "0.02em" }}>
                {change} (24h)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



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
    <motion.div
      whileHover={{ y: -5 }}
      style={{
        background: featured ? "rgba(18,17,26,0.9)" : "rgba(10,10,10,0.5)",
        border: `1px solid ${hov ? (featured ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)") : (featured ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)")}`,
        borderRadius: 20,
        position: "relative",
        overflow: "hidden",
        transition: "border 200ms ease, background 200ms ease",
        boxShadow: "none",
        ...style,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </motion.div>
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
      <motion.polyline 
        points={pts} 
        fill="none" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
        strokeLinecap="round" 
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
      />
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
        border: `1px solid ${open ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
        background: open ? "rgba(255,255,255,0.03)" : "rgba(10,10,10,0.5)",
        transition: "all 200ms ease",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{q}</span>
        <ChevronDown size={16} style={{ color: "#fff", transition: "transform 200ms", transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 12 }} />
      </div>
      {open && (
        <div style={{ padding: "0 22px 20px", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{a}</div>
      )}
    </div>
  );
}

// ─── LIVE TICKER STRIP ───────────────────────────────────────────
function TickerStrip({ marketData }) {
  const coins = (marketData || []).slice(0, 12);
  if (coins.length === 0) return null;
  const items = [...coins, ...coins]; // duplicate for seamless infinite loop
  return (
    <div style={{
      overflow: "hidden",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      padding: "14px 0",
      background: "rgba(255,255,255,0.015)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      <div style={{ display: "flex", gap: 56, width: "max-content", animation: "lp-ticker 40s linear infinite" }}>
        {items.map((coin, i) => {
          const up = (coin.price_change_percentage_24h ?? 0) >= 0;
          const price = Number(coin.current_price);
          const priceStr = price >= 1000
            ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            : price >= 1
            ? `$${price.toFixed(2)}`
            : `$${price.toFixed(4)}`;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
              {coin.image_url && (
                <img src={coin.image_url} alt={coin.symbol} style={{ width: 16, height: 16, borderRadius: "50%", opacity: 0.8 }} />
              )}
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", letterSpacing: "0.08em" }}>
                {coin.symbol?.toUpperCase()}
              </span>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                {priceStr}
              </span>
              <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: up ? "#22c55e" : "#ef4444" }}>
                {up ? "+" : ""}{(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
              </span>
              <span style={{ color: "rgba(255,255,255,0.08)", fontSize: 14, marginLeft: 8 }}>·</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── HERO PRODUCT MOCKUP ─────────────────────────────────────────
function HeroMockup() {
  return (
    <div style={{
      perspective: 1000,
      maxWidth: 720,
      margin: "64px auto 0",
      position: "relative",
      zIndex: 2,
    }}>
      {/* Glow below the screen */}
      <div style={{
        position: "absolute",
        bottom: -60,
        left: "10%",
        right: "10%",
        height: 100,
        background: "radial-gradient(ellipse, rgba(94,106,210,0.35) 0%, transparent 70%)",
        filter: "blur(30px)",
        pointerEvents: "none",
      }} />
      {/* Screen */}
      <div style={{
        background: "rgba(8,8,12,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)",
        transform: "rotateX(4deg)",
        transformStyle: "preserve-3d",
      }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)", marginLeft: 8 }} />
        </div>
        {/* Content rows */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { sym: "BTC", price: "$107,412", chg: "+2.41%", up: true, w: 82 },
            { sym: "ETH", price: "$3,891",   chg: "+1.83%", up: true,  w: 71 },
            { sym: "SOL", price: "$182.40",  chg: "-0.92%", up: false, w: 45 },
            { sym: "BNB", price: "$724.10",  chg: "+3.21%", up: true,  w: 61 },
            { sym: "XRP", price: "$2.18",    chg: "+5.10%", up: true,  w: 55 },
          ].map((row, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr auto auto",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background: i === 1 ? "rgba(94,106,210,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${i === 1 ? "rgba(94,106,210,0.2)" : "rgba(255,255,255,0.04)"}`,
              transition: "all 200ms ease",
            }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `rgba(255,255,255,${0.04 + i * 0.01})`, border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>{row.sym[0]}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: "monospace" }}>{row.sym}</div>
                <div style={{ height: 3, width: `${row.w}%`, maxWidth: 80, borderRadius: 2, background: row.up ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.5)", marginTop: 5 }} />
              </div>
              <div style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{row.price}</div>
              <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: row.up ? "#22c55e" : "#ef4444", minWidth: 54, textAlign: "right" }}>{row.chg}</div>
            </div>
          ))}
        </div>
        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {["Market", "Portfolio", "Alerts", "AI Analysis"].map((item, i) => (
              <span key={i} style={{ fontSize: 10, color: i === 0 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)", fontWeight: i === 0 ? 700 : 400, letterSpacing: "0.06em" }}>{item}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[...Array(3)].map((_, i) => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BENTO GRID SECTION ──────────────────────────────────────────
function BentoGrid({ t }) {
  const [hov, setHov] = useState<number | null>(null);
  const cards = [
    { icon: "⚡", title: "Real-time Data",      desc: "Sub-second price updates across 2,500+ assets.",                  size: "large" },
    { icon: "🧠", title: "AI Signals",           desc: "Gemini-powered bullish/bearish analysis on demand.",              size: "small" },
    { icon: "🔔", title: "Smart Alerts",         desc: "Instant notifications for drops, pumps & whale moves.",          size: "small" },
    { icon: "📊", title: "Portfolio Tracker",    desc: "PnL, ROI, tax reports & CSV export. All in one place.",          size: "small" },
    { icon: "🌍", title: "Multi-language",       desc: "Available in 8+ languages including TR, EN, DE, FR.",            size: "small" },
    { icon: "🔒", title: "Non-custodial",        desc: "We never touch your keys. Read-only, always.",                   size: "large" },
  ];

  return (
    <section style={{ padding: "0 clamp(20px,5vw,80px) 120px", maxWidth: 1100, margin: "0 auto" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>BUILT DIFFERENT</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, letterSpacing: "-0.04em", margin: 0, color: "#fff", lineHeight: 1.1 }}>
            Every feature you need.<br /><span style={{ color: "rgba(255,255,255,0.35)" }}>Nothing you don't.</span>
          </h2>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridAutoRows: "160px",
          gap: 12,
        }}>
          {cards.map((card, i) => (
            <div
              key={i}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              style={{
                gridColumn: card.size === "large" ? "span 2" : "span 1",
                position: "relative",
                borderRadius: 20,
                padding: "28px 28px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${hov === i ? "rgba(94,106,210,0.4)" : "rgba(255,255,255,0.06)"}`,
                overflow: "hidden",
                cursor: "default",
                transition: "border-color 300ms ease, box-shadow 300ms ease, transform 300ms ease",
                boxShadow: hov === i ? "0 0 0 1px rgba(94,106,210,0.2), 0 20px 60px rgba(94,106,210,0.1)" : "none",
                transform: hov === i ? "translateY(-2px)" : "none",
              }}
            >
              {/* Hover glow blob */}
              {hov === i && (
                <div style={{
                  position: "absolute",
                  top: -40, right: -40,
                  width: 200, height: 200,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(94,106,210,0.18) 0%, transparent 70%)",
                  filter: "blur(30px)",
                  pointerEvents: "none",
                  transition: "opacity 300ms ease",
                }} />
              )}
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 24, marginBottom: 14 }}>{card.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em" }}>{card.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: 280 }}>{card.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────
export default function Landing({ onAuthOpen }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: stats } = useMarketStats();
  const { data: marketData } = useMarket(200);
  const { t } = useTranslation();
  


  let coinsTracked = 2500;
  let coinsStr = "2,500+";
  if (stats && stats.coin_count) {
    if (stats.coin_count >= 1000) {
      coinsTracked = Math.floor(stats.coin_count / 1000) * 1000;
      coinsStr = `${Math.floor(coinsTracked / 1000)},000+`;
    } else {
      coinsTracked = stats.coin_count;
      coinsStr = `${coinsTracked}+`;
    }
  }

  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const cards = featuresRef.current?.querySelectorAll('.feature-card');
      cards?.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        // Here we align with the `top` css property. The card sticks at calc(100px + i*24px)
        const topVal = 100 + i * 24;
        const overlap = topVal - rect.top;
        const progress = Math.min(Math.max(overlap / (card.clientHeight * 0.6), 0), 1);
        const el = card as HTMLElement;
        el.style.transform = `scale(${1 - progress * 0.04})`;
        el.style.opacity = String(1 - progress * 0.35);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      badge: t('landing.feat1.badge'),
      badgeColor: "#ffffff",
      icon: BarChart2,
      title: t('landing.feat1.title'),
      desc: t('landing.feat1.desc', { count: coinsStr }),
      points: [t('landing.feat1.p1'), t('landing.feat1.p2'), t('landing.feat1.p3')],
      mockupSide: "right",
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { sym: "BTC", price: "$107,412", change: "+2.4%", up: true, bar: 82, image_url: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
            { sym: "ETH", price: "$3,891", change: "+1.8%", up: true, bar: 71, image_url: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
            { sym: "SOL", price: "$182", change: "-0.9%", up: false, bar: 44, image_url: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
            { sym: "BNB", price: "$724", change: "+3.2%", up: true, bar: 60, image_url: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
            { sym: "AVAX", price: "$38", change: "-1.5%", up: false, bar: 35, image_url: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png" },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)` }}>
              {c.image_url ? (
                <img src={c.image_url} alt={c.sym} style={{ width: 32, height: 32, borderRadius: "50%" }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>{c.sym.slice(0,1)}</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{c.sym}</div>
                <div style={{ height: 3, width: 50, borderRadius: 2, background: "rgba(255,255,255,0.1)", marginTop: 4 }}>
                  <motion.div 
                    initial={{ width: 0 }} 
                    whileInView={{ width: `${c.bar}%` }} 
                    viewport={{ once: true }} 
                    transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 2, background: c.up ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }} 
                  />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{c.price}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.up ? "#34d399" : "#f43f5e", fontFamily: "monospace" }}>{c.change}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      badge: t('landing.feat2.badge'),
      badgeColor: "#ffffff",
      icon: Brain,
      title: t('landing.feat2.title'),
      desc: t('landing.feat2.desc'),
      points: [t('landing.feat2.p1'), t('landing.feat2.p2'), t('landing.feat2.p3')],
      mockupSide: "left",
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.08)` }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", fontWeight: 800, letterSpacing: ".15em", marginBottom: 8 }}>🤖 SYSTEM INTELLIGENCE</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: t('landing.feat2.mockup').replace('+18.4%', '<span style="color: #fff; font-weight: 700">+18.4%</span>').replace('15%', '<span style="color: #fff; font-weight: 700">15%</span>').replace('%18.4', '<span style="color: #fff; font-weight: 700">%18.4</span>').replace('%15', '<span style="color: #fff; font-weight: 700">%15</span>') }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { l: t('landing.feat2.m_score'), v: "87/100", c: "#fff" },
              { l: t('landing.feat2.m_risk'), v: t('landing.feat2.m_risk_val'), c: "rgba(255,255,255,0.7)" },
              { l: t('landing.feat2.m_corr'), v: "0.72", c: "rgba(255,255,255,0.7)" },
              { l: t('landing.feat2.m_sharpe'), v: "1.84", c: "#fff" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)` }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{s.l}</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: s.c, fontFamily: "monospace" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      badge: t('landing.feat3.badge'),
      badgeColor: "#ffffff",
      icon: Wallet,
      title: t('landing.feat3.title'),
      desc: t('landing.feat3.desc'),
      points: [t('landing.feat3.p1'), t('landing.feat3.p2'), t('landing.feat3.p3')],
      mockupSide: "right",
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>{t('landing.feat3.m_title')}</span>
            <span style={{ fontSize: 10, color: "#fff", fontWeight: 700, background: "rgba(255,255,255,0.1)", padding: "2px 10px", borderRadius: 100, border: `1px solid rgba(255,255,255,0.2)` }}>FY 2024</span>
          </div>
          {[
            { type: "BUY", asset: "BTC", amount: "+0.42", value: "$43,210", pnl: null },
            { type: "SELL", asset: "ETH", amount: "-2.5", value: "$8,340", pnl: "+$1,240" },
            { type: "SELL", asset: "SOL", amount: "-45", value: "$6,750", pnl: "+$3,100" },
            { type: "BUY", asset: "BNB", amount: "+8.2", value: "$4,120", pnl: null },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)` }}>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, color: t.type === "BUY" ? "#34d399" : "#f43f5e", background: t.type === "BUY" ? "rgba(52,211,153,0.1)" : "rgba(244,63,94,0.1)", letterSpacing: ".08em" }}>{t.type}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{t.asset} <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{t.amount}</span></div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>{t.value}</div>
              </div>
              {t.pnl && <span style={{ fontSize: 12, fontWeight: 800, color: "#34d399", fontFamily: "monospace" }}>{t.pnl}</span>}
            </div>
          ))}
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t('landing.feat3.m_total')}</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>+$4,340</span>
          </div>
        </div>
      ),
    },
    {
      badge: "ALERTS",
      badgeColor: "#ffffff",
      icon: Bell,
      title: "Smart Alerts & Automations",
      desc: "Never miss a critical market movement. Set dynamic price alerts, track large whale wallet transactions, and get instant notifications straight to your devices.",
      points: ["Dynamic price threshold alerts", "Whale wallet movement tracking", "Instant mobile & web notifications"],
      mockupSide: "left",
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)`, display: "flex", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <TrendingUp size={16} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Price Target Hit</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>BTC has crossed above <strong style={{color:"#fff"}}>$105,000</strong> on high volume.</div>
            </div>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.15)`, display: "flex", gap: 12, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 2, background: "#fff", boxShadow: "0 0 8px #fff" }} />
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Globe size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Whale Movement</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>15,000 ETH transferred from <strong style={{color:"#fff"}}>Binance</strong> to unknown wallet.</div>
            </div>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)`, display: "flex", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Zap size={16} color="#f43f5e" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Volatility Spike</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>SOL volatility index increased by 42% in 5m.</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const plans = [
    {
      name: t('landing.pricing.free'),
      price: "$0",
      sub: t('landing.pricing.free_sub'),
      featured: false,
      cta: t('landing.pricing.free_cta'),
      perks: [
        t('landing.pricing.f1', { count: coinsStr }),
        t('landing.pricing.f2'),
        t('landing.pricing.f3'),
        t('landing.pricing.f4'),
        t('landing.pricing.f5'),
        t('landing.pricing.f6'),
      ],
    },
    {
      name: "Pro",
      price: "$10",
      sub: t('landing.pricing.pro_sub'),
      featured: true,
      cta: t('landing.pricing.pro_cta'),
      perks: [
        t('landing.pricing.p1'),
        t('landing.pricing.p2'),
        t('landing.pricing.p3'),
        t('landing.pricing.p4'),
        t('landing.pricing.p5'),
        t('landing.pricing.p6'),
        t('landing.pricing.p7'),
      ],
    },
  ];

  const faqs = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1', { count: coinsStr }) },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2', { count: coinsStr }) },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
    { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
  ];

  return (
    <div className="mesh-hero" style={{ background: T.bg, color: T.textPrimary, fontFamily: "Inter, sans-serif", overflowX: "clip" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes lp-ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes lp-grad { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes system-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; text-shadow: 0 0 12px rgba(255,255,255,0.8); } }
        @keyframes aurora1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(60px,-40px) scale(1.15);} }
        @keyframes aurora2 { 0%,100%{transform:translate(0,0) scale(1.05);} 50%{transform:translate(-50px,50px) scale(0.92);} }
        @keyframes aurora3 { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(30px,25px) scale(1.1);} 66%{transform:translate(-25px,-15px) scale(0.95);} }
        @keyframes hero-float { 0%,100%{transform:rotateX(4deg) translateY(0px);} 50%{transform:rotateX(4deg) translateY(-8px);} }
        .hero-screen { animation: hero-float 6s ease-in-out infinite; }
      `}</style>

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "130px clamp(20px,5vw,80px) 100px", textAlign: "center", maxWidth: 1100, margin: "0 auto" }}>
        {/* Background — Aurora + dot grid */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {/* Aurora blob 1 — Indigo */}
          <div style={{ position: "absolute", top: -200, left: -150, width: 750, height: 750, borderRadius: "50%", background: "radial-gradient(circle, rgba(94,106,210,0.18) 0%, transparent 60%)", filter: "blur(80px)", animation: "aurora1 14s ease-in-out infinite" }} />
          {/* Aurora blob 2 — Violet */}
          <div style={{ position: "absolute", top: -100, right: -200, width: 650, height: 650, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 60%)", filter: "blur(80px)", animation: "aurora2 18s ease-in-out infinite" }} />
          {/* Aurora blob 3 — deep indigo, bottom */}
          <div style={{ position: "absolute", bottom: -100, left: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(94,106,210,0.09) 0%, transparent 60%)", filter: "blur(100px)", animation: "aurora3 22s ease-in-out infinite" }} />
          {/* Subtle dot grid on top */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "32px 32px", maskImage: "linear-gradient(to bottom, black 20%, transparent 80%)", WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent 80%)" }} />
          {/* Top white glow */}
          <div style={{ position: "absolute", top: -300, left: "50%", transform: "translateX(-50%)", width: 800, height: 600, background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>

        {/* ── Floating Coins ── */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: "calc(-50vw + 50%)", right: "calc(-50vw + 50%)", pointerEvents: "none", overflow: "visible" }}>
          {/* Inner wrapper must also have pointerEvents: 'none' so it doesn't block clicks beneath it */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {FLOATING_COINS.map((c) => {
              const liveCoin = marketData?.find((m) => m.symbol === c.sym);
              const livePrice = liveCoin 
                ? `$${Number(liveCoin.current_price).toLocaleString(undefined, { minimumFractionDigits: liveCoin.current_price < 1 ? 2 : 0, maximumFractionDigits: liveCoin.current_price < 1 ? 6 : 2 })}` 
                : c.price;
              const liveChange = liveCoin 
                ? `${liveCoin.price_change_percentage_24h > 0 ? '+' : ''}${liveCoin.price_change_percentage_24h.toFixed(1)}%` 
                : c.change;
              const liveUp = liveCoin ? liveCoin.price_change_percentage_24h >= 0 : c.up;
              
              return (
                <FloatingCoinCard 
                  key={c.sym} 
                  {...c} 
                  price={livePrice} 
                  change={liveChange} 
                  up={liveUp} 
                  onClick={() => navigate(`/coin/${c.slug}`)} 
                />
              );
            })}
          </div>
        </div>


        {/* Live badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 32, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff", animation: "system-pulse 2s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.15em" }}>[ SYSTEM ONLINE ]</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(44px, 7vw, 84px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.06em", margin: "0 0 24px" }}>
          <span style={{ color: "#fff" }}>{t('landing.hero_title_1')}<br /></span>
          <span style={{
            background: "linear-gradient(90deg, #5e6ad2, #7c3aed, #a78bfa, #5e6ad2)",
            backgroundSize: "300% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "lp-grad 5s linear infinite",
          }}>
            {t('landing.hero_title_2')}
          </span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2.2vw, 20px)", color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7, fontWeight: 500 }}>
          {t('landing.hero_subtitle')}
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
          {!isLoggedIn && (
            <button
              onClick={() => onAuthOpen?.("signup")}
              style={{
                padding: "14px 32px", borderRadius: "100px", border: "none", cursor: "pointer",
                fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
                background: "#fff", color: "#000",
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s ease",
                boxShadow: "0 8px 32px rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.1)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.1)"; }}
            >
              {t('landing.cta_primary')} <ArrowRight size={16} />
            </button>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "14px 32px", borderRadius: "100px", cursor: "pointer",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
              border: "1px solid transparent",
              transition: "all 0.2s ease",
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
          >
            {isLoggedIn ? t('nav.dashboard') : t('landing.cta_secondary')} {isLoggedIn && <ArrowRight size={16} />}
          </button>
        </div>

        {/* Hero product mockup */}
        <HeroMockup />

        {/* Stat row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginTop: 80, flexWrap: "wrap" }}>
          {[
            { v: coinsTracked, s: "+", p: "", l: t('landing.stats.coins') },
            { v: 5, s: "+", p: "", l: t('landing.stats.ai') },
            { v: 99, s: "%", p: "", l: t('landing.stats.uptime') },
            { v: 0, s: "", p: "$", l: t('landing.stats.start') },
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

      {/* ─── LIVE TICKER ─────────────────────────────────────── */}
      <TickerStrip marketData={marketData} />

      {/* ─── FEATURE STICKY CARDS ────────────────────────────── */}
      <section style={{ padding: "0 clamp(20px,5vw,80px)", maxWidth: 1200, margin: "0 auto 160px" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <Reveal>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{t('landing.features_header.badge')}</div>
            <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, letterSpacing: "-0.04em", margin: 0, lineHeight: 1.1 }}>
              {t('landing.features_header.title')}<br />
              <span style={{ color: "rgba(255,255,255,0.4)" }}>{t('landing.features_header.subtitle')}</span>
            </h2>
          </Reveal>
        </div>

        <div ref={featuresRef} style={{ position: "relative", userSelect: "none", WebkitUserSelect: "none" }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            const isRight = f.mockupSide === "right";
            return (
              <div
                key={i}
                className="feature-card"
                style={{
                  position: "sticky",
                  top: `calc(100px + ${i * 24}px)`,
                  marginBottom: 24,
                  zIndex: i + 5,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 60,
                  alignItems: "center",
                  padding: "72px 72px",
                  borderRadius: 36,
                  background: `rgba(10,10,10,0.85)`,
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  boxShadow: "0 40px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
                  overflow: "hidden",
                  transition: "transform 0.3s ease, opacity 0.3s ease",
                  transformOrigin: "top center",
                }}
              >
                {/* bg glow */}
                <div style={{ position: "absolute", top: "-40%", left: isRight ? "-10%" : "auto", right: isRight ? "auto" : "-10%", width: "60%", height: "180%", background: `radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 55%)`, filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />

                {/* Text */}
                <div style={{ position: "relative", zIndex: 1, order: isRight ? 1 : 2 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", borderRadius: 100, background: `rgba(255,255,255,0.05)`, border: `1px solid rgba(255,255,255,0.1)`, color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: ".12em", marginBottom: 28, boxShadow: "none" }}>
                    <Icon size={14} />{f.badge}
                  </div>
                  <h3 style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 900, color: "#fff", margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>{f.title}</h3>
                  <p style={{ fontSize: "clamp(15px,1.8vw,18px)", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 460 }}>{f.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {f.points.map((pt, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 6, background: `rgba(255,255,255,0.05)`, border: `1px solid rgba(255,255,255,0.1)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={10} color="#fff" />
                        </div>
                        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mockup panel */}
                <div style={{ position: "relative", zIndex: 1, order: isRight ? 2 : 1 }}>
                  {f.mockup}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── BENTO GRID ──────────────────────────────────────── */}
      <BentoGrid t={t} />

      {/* ─── PRICING ─────────────────────────────────────────── */}
      <section style={{ padding: "0 clamp(20px,5vw,80px) 120px", maxWidth: 900, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{t('landing.pricing.badge')}</div>
            <h2 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, letterSpacing: "-0.04em", margin: 0, color: "#fff" }}>{t('landing.pricing.title')}<br /><span style={{ color: "rgba(255,255,255,0.4)" }}>{t('landing.pricing.subtitle')}</span></h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "center" }}>
            {plans.map((plan) => (
              <Card key={plan.name} featured={plan.featured} style={{ padding: plan.featured ? "48px 40px" : "36px 32px" }}>
                {plan.featured && (
                  <div style={{ position: "absolute", top: 24, right: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", padding: "6px 16px", borderRadius: 100, background: "#fff", color: "#000", boxShadow: "0 4px 14px rgba(255,255,255,0.25)" }}>
                      {t('landing.pricing.most_popular')}
                    </div>
                  </div>
                )}
                {/* Corner glow */}
                {plan.featured && <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)", filter: "blur(30px)", pointerEvents: "none" }} />}

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: plan.featured ? "#fff" : "rgba(255,255,255,0.4)", marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 32 }}>
                    {plan.featured ? (
                      <span style={{ fontSize: 52, fontWeight: 900, background: "linear-gradient(to right, #ffffff, #888888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.04em", lineHeight: 1 }}>{plan.price}</span>
                    ) : (
                      <span style={{ fontSize: 52, fontWeight: 900, color: "rgba(255,255,255,0.4)", letterSpacing: "-0.04em", lineHeight: 1 }}>{plan.price}</span>
                    )}
                    <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{plan.sub}</span>
                  </div>

                  <button
                    onClick={() => onAuthOpen?.("signup")}
                    style={{
                      width: "100%", padding: "14px", borderRadius: 12, cursor: "pointer",
                      border: plan.featured ? "none" : `1px solid rgba(255,255,255,0.1)`,
                      background: plan.featured ? "linear-gradient(180deg, #ffffff 0%, #e0e0e0 100%)" : "transparent",
                      color: plan.featured ? "#000" : "rgba(255,255,255,0.5)",
                      fontSize: 15, fontWeight: 800,
                      transition: "all 200ms ease",
                      marginBottom: 32,
                      boxShadow: plan.featured ? "0 4px 14px rgba(255,255,255,0.1)" : "none",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = plan.featured ? "translateY(-2px)" : "none"; e.currentTarget.style.color = plan.featured ? "#000" : "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; e.currentTarget.style.color = plan.featured ? "#000" : "rgba(255,255,255,0.5)"; }}
                  >
                    {plan.cta}
                  </button>

                  <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 32 }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {plan.perks.map((perk, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: plan.featured ? 1 : 0.5 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.1)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={12} color="#fff" />
                        </div>
                        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{perk}</span>
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
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{t('landing.faq.badge')}</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.04em", margin: 0, color: "#fff" }}>{t('landing.faq.title')}</h2>
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
          <div style={{ position: "relative", padding: "80px 60px", borderRadius: 36, background: "rgba(10,10,10,0.85)", border: `1px solid rgba(255,255,255,0.08)`, textAlign: "center", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 60%)", filter: "blur(60px)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>{t('landing.cta.badge')}</div>
              <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 16px", color: "#fff" }}>{t('landing.cta.title')}</h2>
              <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", margin: "0 0 48px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
                {t('landing.cta.desc')}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                {!isLoggedIn ? (
                  <button
                    onClick={() => onAuthOpen?.("signup")}
                    style={{ padding: "14px 36px", borderRadius: 14, border: "none", cursor: "pointer", background: "#fff", color: "#000", fontSize: 15, fontWeight: 800, boxShadow: "none", transition: "all 200ms" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
                  >
                    {t('landing.cta.btn1')}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/dashboard")}
                    style={{ padding: "14px 36px", borderRadius: 14, border: "none", cursor: "pointer", background: "#fff", color: "#000", fontSize: 15, fontWeight: 800, boxShadow: "none", transition: "all 200ms", display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
                  >
                    {t('nav.dashboard')} <ArrowRight size={16} color="#000" />
                  </button>
                )}
                <button
                  onClick={() => navigate("/market")}
                  style={{ padding: "14px 32px", borderRadius: 14, cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 600, border: `1px solid rgba(255,255,255,0.2)`, transition: "all 200ms" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                >
                  {t('landing.cta.btn2')}
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

    </div>
  );
}

