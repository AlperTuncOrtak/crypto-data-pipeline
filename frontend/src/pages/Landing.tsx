// ============================================================
// pages/Landing.jsx — v2
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  BarChart2,
  Wallet,
  Bell,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Check,
  Star,
} from "lucide-react";
import Reveal from "../components/ui/Reveal";

function Counter({ to, suffix = "", prefix = "", duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - start) / duration, 1);
          setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

const TICKERS = [
  { symbol: "BTC", price: 80734, change: -0.91, color: "#f7931a" },
  { symbol: "ETH", price: 2279, change: -2.29, color: "#627eea" },
  { symbol: "SOL", price: 134, change: +3.14, color: "#9945ff" },
  { symbol: "BNB", price: 598, change: +0.82, color: "#f3ba2f" },
  { symbol: "XRP", price: 2.14, change: +1.44, color: "#346aa9" },
  { symbol: "ADA", price: 0.712, change: -1.03, color: "#0033ad" },
  { symbol: "DOGE", price: 0.168, change: +5.21, color: "#c2a633" },
  { symbol: "AVAX", price: 22.4, change: +2.87, color: "#e84142" },
  { symbol: "LINK", price: 13.2, change: +1.92, color: "#375bd2" },
  { symbol: "DOT", price: 4.81, change: -0.44, color: "#e6007a" },
];

function FaqList() {
  const [open, setOpen] = useState(null);
  const faqs = [
    {
      q: "How does the AI analysis work?",
      a: "We combine Altfins pre-computed signals (150+ technical indicators across 2,500+ coins) with Groq Llama 3.3 to generate market assessments. The AI processes RSI, MACD, Bollinger Bands, Stochastic, EMA, Fear & Greed Index and news sentiment — then produces a bullish/bearish/neutral signal with confidence score.",
    },
    {
      q: "Is CryptoNeko really free?",
      a: "Yes. The free plan includes live market data for 2,500+ coins, market heatmap, coin comparison, watchlist (up to 10 coins) and basic price alerts — forever. No credit card required. Pro plan ($10/mo) unlocks AI analysis, portfolio tracker, tax reports and unlimited alerts.",
    },
    {
      q: "Is my data safe and private?",
      a: "Completely. Your portfolio and trade data never leaves your browser — CSV files are parsed locally in JavaScript. We never store, sell or transmit your financial information. Only your email address is stored for authentication via Supabase.",
    },
    {
      q: "Which exchanges are supported for portfolio import?",
      a: "We support CSV exports from Binance, Bybit, OKX, Coinbase and Kraken. Simply export your trade history from your exchange and drag & drop the file into the Portfolio Tracker. P&L and tax calculations happen instantly in your browser.",
    },
    {
      q: "Is this financial advice?",
      a: "No. CryptoNeko is a technical analysis tool only. All signals, scores and analysis are based on technical indicators and are for informational purposes only. Never make investment decisions based solely on this tool. Always do your own research and consult a financial advisor.",
    },
    {
      q: "How often is the market data updated?",
      a: "Live prices are streamed via WebSocket from multiple exchanges and update every few seconds. The AI analysis uses Altfins signals which are refreshed continuously. Fear & Greed Index is updated daily from Alternative.me.",
    },
    {
      q: "Can I cancel my Pro subscription anytime?",
      a: "Yes, you can cancel at any time. Your Pro access continues until the end of your billing period, then automatically reverts to the free plan — no questions asked.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {faqs.map((faq, i) => (
        <div
          key={i}
          style={{
            borderRadius: 14,
            border: `1px solid ${open === i ? "rgba(245,166,35,.25)" : "rgba(255,255,255,.07)"}`,
            background:
              open === i ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,.02)",
            overflow: "hidden",
            transition: "all .2s",
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 22px",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color:
                  open === i ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.7)",
                lineHeight: 1.4,
              }}
            >
              {faq.q}
            </span>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background:
                  open === i ? "rgba(245,166,35,.15)" : "rgba(255,255,255,.06)",
                border: `1px solid ${open === i ? "rgba(245,166,35,.3)" : "rgba(255,255,255,.1)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all .2s",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  color: open === i ? "var(--accent)" : "rgba(255,255,255,.4)",
                  lineHeight: 1,
                  transform: open === i ? "rotate(45deg)" : "rotate(0)",
                  display: "block",
                  transition: "transform .2s",
                }}
              >
                +
              </span>
            </div>
          </button>
          {open === i && (
            <div style={{ padding: "0 22px 18px" }}>
              <div
                style={{
                  height: 1,
                  background: "rgba(255,255,255,.06)",
                  marginBottom: 14,
                }}
              />
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,.45)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {faq.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Landing({ onAuthOpen }) {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div
      style={{
        background: "var(--bg-base)",
        color: "#f0f0f0",
        minHeight: "100vh",
        overflowX: "clip",
      }}
    >
      <style>{`
        @keyframes tickerScroll { from{transform:translateX(0)} to{transform:translateX(-33.33%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes glow { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes floatY { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
        @keyframes floatY2 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-20px)} }
        @keyframes floatY3 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        .lp-primary { transition:all .2s ease !important }
        .lp-primary:hover { transform:translateY(-2px) !important; box-shadow:0 16px 48px rgba(0,240,255,.35) !important }
        .lp-ghost:hover { border-color:rgba(0,240,255,.4) !important; color:rgba(255,255,255,.85) !important; background:rgba(0,240,255,.05) !important }
        .feat:hover { transform:translateY(-5px) !important; }
        .fcoin { transition: filter .35s ease, transform .35s ease, box-shadow .35s ease !important; }
        .fcoin:hover { filter: blur(0px) !important; transform: scale(1.12) !important; box-shadow: 0 0 32px var(--fcoin-glow) !important; }
        .fcoin:hover .fcoin-label { opacity:1 !important; transform:translateX(0) !important; pointer-events:none; }
        @media (max-width: 640px) {
          .lp-fcoin { display: none !important; }
          .lp-hero-ctas { flex-direction: column !important; align-items: stretch !important; }
          .lp-hero-ctas button { width: 100% !important; justify-content: center !important; }
          .lp-stats-row { flex-wrap: wrap !important; gap: 0 !important; }
          .lp-stats-row > div { flex: 0 0 50% !important; padding: 12px 0 !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,.07) !important; }
          .lp-workflow-grid { grid-template-columns: 1fr !important; }
          .lp-workflow-line { display: none !important; }
          .lp-bignums-grid { grid-template-columns: 1fr 1fr !important; }
          .lp-pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(16px, 4vw, 48px)",
          height: 58,
          background: scrollY > 30 ? "rgba(2, 6, 23, .94)" : "transparent",
          backdropFilter: scrollY > 30 ? "blur(20px)" : "none",
          borderBottom:
            scrollY > 30 ? "1px solid rgba(255,255,255,.06)" : "none",
          transition: "all .3s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              overflow: "hidden"
            }}
          >
            <img src="/logo.png" alt="CryptoNeko Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span
            style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            <span style={{ color: "var(--accent)" }}>Crypto</span>Neko
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onAuthOpen?.("login")}
            className="lp-ghost"
            style={{
              padding: "7px 18px",
              borderRadius: 9,
              background: "transparent",
              border: "1px solid rgba(255,255,255,.1)",
              color: "rgba(255,255,255,.5)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all .2s",
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => onAuthOpen?.("signup")}
            className="lp-primary"
            style={{
              padding: "7px 20px",
              borderRadius: 9,
              background: "linear-gradient(135deg,var(--accent),#8B5CF6)",
              color: "#111",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(245,166,35,.3)",
            }}
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* TICKER */}
      <div
        style={{
          paddingTop: 58,
          overflow: "hidden",
          background: "rgba(0,0,0,.5)",
          borderBottom: "1px solid rgba(255,255,255,.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            animation: "tickerScroll 40s linear infinite",
            width: "max-content",
            padding: "7px 0",
          }}
        >
          {[...TICKERS, ...TICKERS, ...TICKERS].map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 20px",
                borderRight: "1px solid rgba(255,255,255,.04)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: t.color,
                  fontFamily: "monospace",
                }}
              >
                {t.symbol}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,.5)",
                }}
              >
                $
                {t.price < 1
                  ? t.price.toFixed(3)
                  : t.price < 100
                    ? t.price.toFixed(2)
                    : t.price.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: t.change >= 0 ? "#2ecc71" : "#e74c3c",
                  fontWeight: 700,
                }}
              >
                {t.change >= 0 ? "▲" : "▼"}
                {Math.abs(t.change)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FLOATING COINS HERO LAYER */}
      <section
        style={{
          position: "relative",
          padding: "88px clamp(16px, 5vw, 48px) 64px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* ── FLOATING COIN ORBS ─────────────────────────────────────────── */}
        {[
          { slug: "bitcoin",  sym: "BTC", change: -0.91, color: "#f7931a", img: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",        top: "12%", left: "6%",  size: 58, anim: "floatY 6s ease-in-out infinite",              delay: "0s"    },
          { slug: "ethereum", sym: "ETH", change: -2.29, color: "#627eea", img: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",      top: "55%", left: "3%",  size: 48, anim: "floatY2 7.5s ease-in-out infinite",            delay: "1.2s"  },
          { slug: "solana",   sym: "SOL", change: +3.14, color: "#9945ff", img: "https://assets.coingecko.com/coins/images/4128/small/solana.png",       top: "78%", left: "12%", size: 44, anim: "floatY3 5.5s ease-in-out infinite",            delay: "0.4s"  },
          { slug: "binancecoin", sym: "BNB", change: +0.82, color: "#f3ba2f", img: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", top: "22%", left: "88%", size: 54, anim: "floatY 8s ease-in-out infinite",               delay: "0.8s"  },
          { slug: "ripple",  sym: "XRP", change: +1.44, color: "#346aa9", img: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", top: "60%", left: "91%", size: 44, anim: "floatY2 6.5s ease-in-out infinite",       delay: "2s"    },
          { slug: "dogecoin", sym: "DOGE", change: +5.21, color: "#c2a633", img: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",        top: "82%", left: "82%", size: 42, anim: "floatY3 7s ease-in-out infinite",              delay: "1.6s"  },
          { slug: "cardano", sym: "ADA", change: -1.03, color: "#0033ad",  img: "https://assets.coingecko.com/coins/images/975/small/cardano.png",        top: "38%", left: "93%", size: 38, anim: "floatY 5s ease-in-out infinite",               delay: "0.6s"  },
          { slug: "avalanche-2", sym: "AVAX", change: +2.87, color: "#e84142", img: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png", top: "14%", left: "82%", size: 46, anim: "floatY2 9s ease-in-out infinite", delay: "1s" },
        ].map((coin) => (
          <div
            key={coin.slug}
            className="fcoin lp-fcoin"
            onClick={() => navigate(`/coin/${coin.slug}`)}
            style={{
              position:  "absolute",
              top:       coin.top,
              left:      coin.left,
              width:     coin.size,
              height:    coin.size,
              borderRadius: "50%",
              cursor:    "pointer",
              filter:    "blur(3px)",
              animation: coin.anim,
              animationDelay: coin.delay,
              zIndex:    2,
              "--fcoin-glow": `${coin.color}66`,
            }}
          >
            {/* Logo bubble */}
            <img
              src={coin.img}
              alt={coin.sym}
              style={{
                width:  "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${coin.color}44`,
                boxShadow: `0 0 18px ${coin.color}33`,
                display: "block",
                backgroundColor: "rgba(255,255,255,.05)",
              }}
              onError={(e) => { e.target.style.display = "none"; }}
            />

            {/* Hover label — slides in from right */}
            <div
              className="fcoin-label"
              style={{
                position:   "absolute",
                top:        "50%",
                left:       "calc(100% + 10px)",
                transform:  "translateX(-8px)",
                opacity:    0,
                transition: "opacity .3s ease, transform .3s ease",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                display:    "flex",
                alignItems: "center",
                gap:        6,
                marginTop:  "-16px",
              }}
            >
              <span style={{
                fontSize:   12,
                fontWeight: 800,
                color:      coin.color,
                fontFamily: "monospace",
                letterSpacing: ".04em",
              }}>{coin.sym}</span>
              <span style={{
                fontSize:   11,
                fontWeight: 700,
                color:      coin.change >= 0 ? "#2ecc71" : "#e74c3c",
                fontFamily: "monospace",
              }}>
                {coin.change >= 0 ? "▲" : "▼"}
                {Math.abs(coin.change)}%
              </span>
            </div>
          </div>
        ))}

        {/* AMBIENT GLOW ORBS (Simplified for flat style) */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {/* Grid Pattern */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,.02) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)"
          }} />
          
          {/* Subtle Center Glow */}
          <div style={{
            position: "absolute", top: "10%", left: "30%", transform: "translateX(-50%)",
            width: 800, height: 500,
            background: "radial-gradient(ellipse, rgba(0,240,255,.08) 0%, transparent 60%)",
            filter: "blur(60px)",
            borderRadius: "50%"
          }} />
          <div style={{
            position: "absolute", top: "20%", left: "70%", transform: "translateX(-50%)",
            width: 800, height: 500,
            background: "radial-gradient(ellipse, rgba(176,38,255,.08) 0%, transparent 60%)",
            filter: "blur(60px)",
            borderRadius: "50%"
          }} />
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 20,
            background: "rgba(46,204,113,.08)",
            border: "1px solid rgba(46,204,113,.2)",
            marginBottom: 30,
            animation: "fadeUp .5s ease both",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#2ecc71",
              boxShadow: "0 0 8px #2ecc71",
              animation: "glow 2s infinite",
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,.5)",
              fontWeight: 600,
            }}
          >
            Live · 2,500+ coins tracked in real-time
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(48px, 7vw, 88px)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            margin: "0 auto 24px",
            maxWidth: 900,
            position: "relative",
            zIndex: 10,
            animation: "fadeUp .6s cubic-bezier(0.16, 1, 0.3, 1) .1s both",
          }}
        >
          <span style={{ color: "rgba(255,255,255,.98)", textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
            The smartest way
            <br />
            to analyze{" "}
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #5EEAD4 30%, #00C3FF 70%, var(--accent) 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
              animation: "gradShift 6s linear infinite",
              filter: "drop-shadow(0 4px 16px rgba(245,166,35,0.3))"
            }}
          >
            crypto markets.
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "rgba(255,255,255,.6)",
            maxWidth: 580,
            margin: "0 auto 40px",
            lineHeight: 1.6,
            position: "relative",
            zIndex: 10,
            animation: "fadeUp .6s cubic-bezier(0.16, 1, 0.3, 1) .2s both",
          }}
        >
          Real-time data, AI-driven technical analysis, and portfolio tracking —
          all in one blazing fast platform.
        </p>

        <div
          className="lp-hero-ctas"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            position: "relative",
            zIndex: 10,
            animation: "fadeUp .6s cubic-bezier(0.16, 1, 0.3, 1) .3s both",
            padding: "0 16px",
          }}
        >
          <button
            onClick={() => onAuthOpen?.("signup")}
            className="lp-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 36px",
              borderRadius: 100,
              background: "var(--accent)",
              color: "#111",
              fontSize: 16,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all .2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            Start for Free <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="lp-ghost"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "15px 32px",
              borderRadius: 100,
              background: "rgba(255,255,255,.04)",
              color: "rgba(255,255,255,.8)",
              fontSize: 15,
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,.08)",
              cursor: "pointer",
              transition: "all .2s",
            }}
          >
            View Live Demo <ChevronRight size={15} />
          </button>
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 12,
            color: "rgba(255,255,255,.2)",
            animation: "fadeUp .55s ease .32s both",
          }}
        >
          No credit card required · Free plan available forever
        </div>

        <div
          className="lp-stats-row"
          style={{
            marginTop: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeUp .55s ease .4s both",
          }}
        >
          {[
            { value: 2500, suffix: "+", prefix: "", label: "Coins Tracked" },
            { value: 5, suffix: "+", prefix: "", label: "AI Indicators" },
            { value: 99, suffix: "%", prefix: "", label: "Uptime" },
            { value: 0, suffix: "", prefix: "$", label: "To Get Started" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                padding: "0 clamp(12px, 3vw, 36px)",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,.07)" : "none",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(26px,3vw,38px)",
                  fontWeight: 900,
                  color: "var(--accent)",
                  fontFamily: "monospace",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                <Counter to={s.value} suffix={s.suffix} prefix={s.prefix} />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,.28)",
                  marginTop: 5,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section
        style={{ padding: `0 clamp(16px, 4vw, 48px) 80px`, maxWidth: 1100, margin: "0 auto" }}
      >
        <Reveal direction="up" delay={0.2} threshold={0.2}>
          <div
            style={{
              position: "relative",
              animation: "fadeUp .7s ease .5s both",
            }}
          >
          <div
            style={{
              position: "absolute",
              inset: -32,
              background: "radial-gradient(ellipse at center, rgba(245,166,35,.15) 0%, rgba(139,92,246,.1) 30%, transparent 70%)",
              pointerEvents: "none",
              filter: "blur(30px)",
              animation: "glow 8s ease-in-out infinite alternate"
            }}
          />
          <div
            style={{
              position: "relative",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,.12)",
              boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
              background: "rgba(12,12,22,0.8)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              transform: "translateZ(0)"
            }}
          >
            <div
              style={{
                background: "#0e0e18",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid rgba(255,255,255,.05)",
              }}
            >
              {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: c,
                  }}
                />
              ))}
              <div
                style={{
                  flex: 1,
                  marginLeft: 8,
                  height: 20,
                  borderRadius: 5,
                  background: "rgba(255,255,255,.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 10, color: "rgba(255,255,255,.18)" }}>
                  cryptoneko.app · AI Technical Analysis
                </span>
              </div>
            </div>
            <div style={{ background: "#0c0c16", padding: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    padding: "20px 24px",
                    borderRadius: 14,
                    background: "rgba(46,204,113,.07)",
                    border: "1px solid rgba(46,204,113,.18)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -30,
                      right: -30,
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      background: "rgba(46,204,113,.08)",
                      filter: "blur(30px)",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: "rgba(46,204,113,.5)",
                      letterSpacing: ".18em",
                      marginBottom: 6,
                    }}
                  >
                    TECHNICAL OUTLOOK
                  </div>
                  <div
                    style={{
                      fontSize: 44,
                      fontWeight: 900,
                      color: "#2ecc71",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    BULLISH
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,.3)",
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>Bitcoin</span>
                    <span
                      style={{
                        color: "rgba(255,255,255,.5)",
                        fontFamily: "monospace",
                        fontWeight: 600,
                      }}
                    >
                      $80,734
                    </span>
                    <span style={{ color: "#2ecc71", fontFamily: "monospace" }}>
                      +2.14%
                    </span>
                  </div>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      flex: 1,
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,.3)",
                        letterSpacing: ".1em",
                      }}
                    >
                      CONFIDENCE
                    </span>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 900,
                        color: "#2ecc71",
                        fontFamily: "monospace",
                      }}
                    >
                      79%
                    </span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,.3)",
                        letterSpacing: ".1em",
                      }}
                    >
                      RISK LEVEL
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: "var(--accent)",
                      }}
                    >
                      MEDIUM
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(min(80px,100%),1fr))",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {[
                  {
                    label: "RSI",
                    val: 67,
                    color: "var(--accent)",
                    status: "Neutral",
                  },
                  {
                    label: "MACD",
                    val: 80,
                    color: "#2ecc71",
                    status: "Bullish",
                  },
                  { label: "BB", val: 45, color: "#3498db", status: "Middle" },
                  {
                    label: "Stoch",
                    val: 72,
                    color: "var(--accent)",
                    status: "Neutral",
                  },
                  {
                    label: "EMA",
                    val: 90,
                    color: "#2ecc71",
                    status: "Bullish",
                  },
                ].map((ind) => (
                  <div
                    key={ind.label}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,.025)",
                      border: "1px solid rgba(255,255,255,.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{ fontSize: 9, color: "rgba(255,255,255,.3)" }}
                      >
                        {ind.label}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: ind.color,
                          fontWeight: 700,
                        }}
                      >
                        {ind.status}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 3,
                        borderRadius: 2,
                        background: "rgba(255,255,255,.06)",
                      }}
                    >
                      <div
                        style={{
                          width: `${ind.val}%`,
                          height: "100%",
                          background: `linear-gradient(90deg,${ind.color}70,${ind.color})`,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: ind.color,
                        fontWeight: 700,
                        marginTop: 4,
                        fontFamily: "monospace",
                      }}
                    >
                      {ind.val}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(min(100px,100%),1fr))",
                  gap: 8,
                }}
              >
                {[
                  {
                    label: "Fear & Greed",
                    value: "48",
                    sub: "Neutral",
                    color: "var(--accent)",
                  },
                  {
                    label: "7-Day Trend",
                    value: "+0.2%",
                    sub: "Sideways",
                    color: "#3498db",
                  },
                  {
                    label: "Stop Loss",
                    value: "$74,374",
                    sub: "−8% from entry",
                    color: "#e74c3c",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,.02)",
                      border: "1px solid rgba(255,255,255,.05)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,.3)",
                        marginBottom: 4,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: item.color,
                        fontFamily: "monospace",
                      }}
                    >
                      {item.value}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "rgba(255,255,255,.25)" }}
                    >
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      <section
        style={{ padding: `60px clamp(16px, 4vw, 48px)`, maxWidth: 1220, margin: "0 auto" }}
      >
        <Reveal direction="up" threshold={0.2}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 14px",
              borderRadius: 20,
              background: "rgba(245,166,35,.08)",
              border: "1px solid rgba(245,166,35,.2)",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--accent)", letterSpacing: ".22em", textTransform: "uppercase" }}>
              Everything you need
            </span>
          </div>
          <h2
            style={{
              fontSize: "clamp(30px,4vw,54px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              margin: 0,
            }}
          >
            Professional tools.
            <br />
            <span style={{
              background: "linear-gradient(135deg, rgba(255,255,255,.5) 0%, rgba(255,255,255,.15) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Zero complexity.
            </span>
          </h2>
        </div>

        <div className="relative mx-auto mt-32 pb-40" style={{ maxWidth: 1100 }}>
          {[
            {
              badge: "LIVE DATA",
              title: "Real-Time Market Tracking",
              desc: "Track 2,500+ cryptocurrencies with blazing fast updates. Never miss a volume spike or a whale movement again with our interactive heatmap.",
              color: "#00f0ff",
              icon: BarChart2,
            },
            {
              badge: "NEKO AI",
              title: "AI Portfolio Manager",
              desc: "Get deep insights powered by Groq Llama 3.3. Our AI agent analyzes your holdings, detects correlation risks, and gives actionable rebalancing recommendations.",
              color: "#b026ff",
              icon: Brain,
            },
            {
              badge: "TAX & REPORTS",
              title: "Automated Tax Calculation",
              desc: "Connect your Ethereum wallets or import Binance CSVs. We automatically calculate your FIFO P&L and generate exportable tax reports in seconds.",
              color: "#2ecc71",
              icon: Wallet,
            }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                style={{
                  position: "sticky",
                  top: `calc(120px + ${i * 40}px)`,
                  minHeight: "60vh",
                  marginBottom: i === 2 ? 0 : "80vh",
                  padding: "80px",
                  borderRadius: "40px",
                  background: "rgba(2, 6, 23, 0.95)",
                  backdropFilter: "blur(60px)",
                  WebkitBackdropFilter: "blur(60px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: `0 40px 100px rgba(0,0,0,0.9), inset 0 2px 0 0 rgba(255,255,255,0.05), inset 0 0 0 1px ${feature.color}30`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 32,
                  zIndex: i + 10,
                  transformOrigin: "top center",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "-20%", right: "-10%",
                  width: "80%", height: "140%",
                  background: `radial-gradient(circle, ${feature.color}15 0%, transparent 60%)`,
                  borderRadius: "50%",
                  filter: "blur(60px)",
                  pointerEvents: "none",
                  zIndex: 0,
                }} />

                <div style={{
                  position: "relative",
                  zIndex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 24px",
                  borderRadius: 100,
                  background: `${feature.color}15`,
                  border: `1px solid ${feature.color}40`,
                  color: feature.color,
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: ".15em",
                  width: "max-content",
                  boxShadow: `0 0 30px ${feature.color}30`
                }}>
                  <Icon size={20} />
                  {feature.badge}
                </div>
                
                <h3 style={{
                  position: "relative",
                  zIndex: 1,
                  fontSize: "clamp(48px, 6vw, 72px)",
                  fontWeight: 900,
                  color: "white",
                  margin: 0,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1
                }}>
                  {feature.title}
                </h3>
                
                <p style={{
                  position: "relative",
                  zIndex: 1,
                  fontSize: "clamp(20px, 2.5vw, 28px)",
                  color: "rgba(255, 255, 255, 0.6)",
                  lineHeight: 1.6,
                  maxWidth: "900px",
                  margin: 0
                }}>
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
        </Reveal>
      </section>



      {/* HOW IT WORKS */}
      <section
        style={{
          padding: `60px clamp(16px, 4vw, 48px)`,
          maxWidth: 860,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <Reveal direction="up" threshold={0.2}>
          <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "var(--accent)",
            letterSpacing: ".22em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Simple workflow
        </div>
        <h2
          style={{
            fontSize: "clamp(24px,3.5vw,42px)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            marginBottom: 56,
          }}
        >
          From data to decision
          <br />
          <span style={{ color: "rgba(255,255,255,.22)" }}>in seconds.</span>
        </h2>
        <div
          className="lp-workflow-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 24,
            position: "relative",
          }}
        >
          <div
            className="lp-workflow-line"
            style={{
              position: "absolute",
              top: 30,
              left: "17%",
              right: "17%",
              height: 1,
              background:
                "linear-gradient(to right,transparent,rgba(0,240,255,.2),transparent)",
              pointerEvents: "none",
            }}
          />
          {[
            {
              step: "01",
              Icon: BarChart2,
              color: "#3498db",
              title: "Pick a coin",
              desc: "Search from 2,500+ live cryptocurrencies with real-time prices.",
            },
            {
              step: "02",
              Icon: Brain,
              color: "#9b59b6",
              title: "Run AI analysis",
              desc: "AI processes 5+ indicators, news sentiment and Fear & Greed Index instantly.",
            },
            {
              step: "03",
              Icon: Zap,
              color: "var(--accent)",
              title: "Act with confidence",
              desc: "Clear signal, stop-loss level and personalized advice for your position.",
            },
          ].map((s, i) => (
            <div key={i} style={{ padding: "0 16px" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: `${s.color}12`,
                  border: `1px solid ${s.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <s.Icon size={22} style={{ color: s.color }} />
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: `${s.color}55`,
                  letterSpacing: ".15em",
                  marginBottom: 8,
                }}
              >
                STEP {s.step}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "rgba(255,255,255,.9)",
                  marginBottom: 8,
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "rgba(255,255,255,.3)",
                  lineHeight: 1.65,
                }}
              >
                {s.desc}
              </div>
            </div>
          ))}
        </div>
        </Reveal>
      </section>

      {/* STATS */}
      <section
        style={{ padding: `60px clamp(16px, 4vw, 48px)`, maxWidth: 1060, margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--accent)",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            By the numbers
          </div>
          <h2
            style={{
              fontSize: "clamp(24px,3.5vw,42px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            Built for serious traders
          </h2>
        </div>
        <div
          className="lp-bignums-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 14,
          }}
        >
          {[
            {
              value: 2500,
              suffix: "+",
              prefix: "",
              label: "Coins Tracked",
              desc: "Real-time prices, 24h changes, volume & market cap",
              color: "var(--accent)",
              Icon: BarChart2,
            },
            {
              value: 5,
              suffix: "+",
              prefix: "",
              label: "AI Indicators",
              desc: "RSI, MACD, Bollinger Bands, Stochastic & EMA",
              color: "#9b59b6",
              Icon: Brain,
            },
            {
              value: 99,
              suffix: "%",
              prefix: "",
              label: "Uptime",
              desc: "Always-on live data pipeline with Redis caching",
              color: "#3498db",
              Icon: Zap,
            },
            {
              value: 5,
              suffix: "",
              prefix: "",
              label: "Exchanges Supported",
              desc: "Binance, Bybit, OKX, Coinbase & Kraken CSV import",
              color: "#2ecc71",
              Icon: Globe,
            },
            {
              value: 0,
              suffix: "",
              prefix: "$",
              label: "To Get Started",
              desc: "Full free plan — no credit card required",
              color: "#1abc9c",
              Icon: Star,
            },
            {
              value: 100,
              suffix: "%",
              prefix: "",
              label: "Private by Design",
              desc: "Trade data never leaves your browser — zero servers",
              color: "#e74c3c",
              Icon: Shield,
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                padding: "28px 24px",
                borderRadius: 16,
                background: "rgba(255,255,255,.02)",
                border: "1px solid rgba(255,255,255,.06)",
                animation: `fadeUp .6s ease ${0.05 + i * 0.07}s both`,
                transition: "all .3s ease",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${s.color}30`;
                e.currentTarget.style.background = `${s.color}05`;
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,.06)";
                e.currentTarget.style.background = "rgba(255,255,255,.02)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `${s.color}08`,
                  filter: "blur(20px)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 13,
                  background: `${s.color}12`,
                  border: `1px solid ${s.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <s.Icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "clamp(22px,2.5vw,32px)",
                    fontWeight: 900,
                    color: s.color,
                    fontFamily: "monospace",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  <Counter to={s.value} suffix={s.suffix} prefix={s.prefix} />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(255,255,255,.75)",
                    marginBottom: 3,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,.28)",
                    lineHeight: 1.4,
                  }}
                >
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section
        style={{ padding: `60px clamp(16px, 4vw, 48px)`, maxWidth: 820, margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--accent)",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Pricing
          </div>
          <h2
            style={{
              fontSize: "clamp(24px,3.5vw,42px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            Start free, upgrade when ready
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,.28)",
              marginTop: 10,
            }}
          >
            No credit card required. Cancel anytime.
          </p>
        </div>
        <div
          className="lp-pricing-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <div
            style={{
              padding: "30px",
              borderRadius: 20,
              background: "rgba(255,255,255,.025)",
              border: "1px solid rgba(255,255,255,.07)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,.3)",
                textTransform: "uppercase",
                letterSpacing: ".12em",
                marginBottom: 14,
              }}
            >
              Free
            </div>
            <div
              style={{
                fontSize: 46,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                marginBottom: 6,
              }}
            >
              Free
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,.28)",
                marginBottom: 26,
                lineHeight: 1.5,
              }}
            >
              Everything you need to explore crypto markets.
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 26,
              }}
            >
              {[
                "Live market data — 2,500+ coins",
                "Market heatmap & coin compare",
                "Watchlist (up to 10 coins)",
                "Basic price alerts",
              ].map((f, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 9 }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.09)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check
                      size={9}
                      style={{ color: "rgba(255,255,255,.35)" }}
                    />
                  </div>
                  <span
                    style={{ fontSize: 13, color: "rgba(255,255,255,.42)" }}
                  >
                    {f}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onAuthOpen?.("signup")}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 11,
                background: "rgba(255,255,255,.05)",
                color: "rgba(255,255,255,.5)",
                fontWeight: 700,
                fontSize: 14,
                border: "1px solid rgba(255,255,255,.08)",
                cursor: "pointer",
                transition: "all .2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.09)";
                e.currentTarget.style.color = "rgba(255,255,255,.75)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.05)";
                e.currentTarget.style.color = "rgba(255,255,255,.5)";
              }}
            >
              Get Started Free
            </button>
          </div>
          <div
            style={{
              padding: "30px",
              borderRadius: 20,
              background:
                "linear-gradient(135deg,rgba(245,166,35,.1),rgba(245,158,11,0.04))",
              border: "1px solid rgba(245,166,35,.28)",
              position: "relative",
              boxShadow: "0 0 60px rgba(245,166,35,.07)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                fontSize: 9,
                fontWeight: 900,
                padding: "3px 10px",
                borderRadius: 20,
                background: "var(--accent)",
                color: "#111",
                letterSpacing: ".1em",
              }}
            >
              MOST POPULAR
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: ".12em",
                marginBottom: 14,
              }}
            >
              Pro
            </div>
            <div style={{ marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 46,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                }}
              >
                $10
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,.28)",
                  marginLeft: 4,
                }}
              >
                /month
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,.32)",
                marginBottom: 26,
                lineHeight: 1.5,
              }}
            >
              Unlock AI analysis, portfolio tracking and unlimited features.
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 26,
              }}
            >
              {[
                "Everything in Free",
                "AI Technical Analysis (unlimited)",
                "Portfolio Tracker & Tax Reports",
                "Unlimited watchlist & alerts",
                "News sentiment analysis",
                "Priority support",
              ].map((f, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 9 }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "rgba(245,166,35,.14)",
                      border: "1px solid rgba(245,166,35,.28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={9} style={{ color: "var(--accent)" }} />
                  </div>
                  <span
                    style={{ fontSize: 13, color: "rgba(255,255,255,.62)" }}
                  >
                    {f}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/pricing")}
              className="lp-primary"
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 11,
                background: "linear-gradient(135deg,var(--accent),#8B5CF6)",
                color: "#111",
                fontWeight: 800,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(245,166,35,.3)",
              }}
            >
              Start Pro Trial →
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        style={{ padding: "60px 48px", maxWidth: 760, margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--accent)",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            FAQ
          </div>
          <h2
            style={{
              fontSize: "clamp(24px,3.5vw,42px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            Common questions
          </h2>
        </div>
        <FaqList />
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          padding: "80px 48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 600,
            height: 300,
            background:
              "radial-gradient(ellipse,rgba(245,166,35,.07) 0%,transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--accent)",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Get started today
          </div>
          <h2
            style={{
              fontSize: "clamp(28px,5vw,58px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              marginBottom: 16,
              lineHeight: 1.05,
            }}
          >
            Ready to trade
            <br />
            smarter?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,.28)",
              maxWidth: 400,
              margin: "0 auto 40px",
              lineHeight: 1.65,
            }}
          >
            Free account. No credit card. Upgrade to Pro when you're ready.
          </p>
          <button
            onClick={() => onAuthOpen?.("signup")}
            className="lp-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "16px 38px",
              borderRadius: 14,
              background: "linear-gradient(135deg,var(--accent),#8B5CF6)",
              color: "#111",
              fontSize: 16,
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(245,166,35,.35)",
            }}
          >
            Create Free Account <ArrowRight size={17} />
          </button>
          <div
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "rgba(255,255,255,.2)",
            }}
          >
            Free forever · No credit card required
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: "24px 48px",
          borderTop: "1px solid rgba(255,255,255,.05)",
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: "linear-gradient(135deg,var(--accent),#8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 900,
                color: "#111",
              }}
            >
              N
            </div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: "var(--accent)" }}>Crypto</span>Neko
            </span>
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,.15)",
                marginLeft: 6,
              }}
            >
              &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,.16)",
              maxWidth: 360,
              textAlign: "center",
            }}
          >
            Technical analysis tools only. Not financial advice.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Terms of Use", "Contact"].map((link) => (
              <span
                key={link}
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,.2)",
                  cursor: "pointer",
                  transition: "color .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,.6)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,.2)")
                }
              >
                {link}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
