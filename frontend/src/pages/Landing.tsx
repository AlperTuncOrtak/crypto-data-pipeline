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
import MotoGameModal from "../components/game/MotoGameModal";

// ─── THEME ───────────────────────────────────────────────────────
const T = {
  bg: "#000000",
  card: "#09090b",
  cardHov: "#18181b",
  purple: "#ffffff",
  purpleLight: "#e4e4e7",
  purpleDim: "rgba(255,255,255,0.1)",
  green: "#22c55e",
  greenBg: "rgba(34,197,94,0.1)",
  greenBorder: "rgba(34,197,94,0.2)",
  red: "#ef4444",
  redBg: "rgba(239,68,68,0.1)",
  textPrimary: "#ffffff",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  border: "var(--border)",
  borderFeat: "rgba(255,255,255,0.25)",
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
        boxShadow: "none",
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
function DashboardMockup({ coinsStr, t, marketData }: { coinsStr: string, t: any, marketData?: any[] }) {
  let coins = [
    { sym: "BTC", price: "$107,412", change: "+2.4%", up: true, image_url: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
    { sym: "ETH", price: "$3,891", change: "+1.8%", up: true, image_url: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
    { sym: "SOL", price: "$182", change: "-0.9%", up: false, image_url: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
    { sym: "BNB", price: "$724", change: "+3.2%", up: true, image_url: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  ];
  
  let mcapStr = "$3.42T";
  let btcDomStr = "54.2%";
  
  if (marketData && marketData.length >= 4) {
    const btc = marketData.find(c => c.symbol?.toLowerCase() === 'btc') || marketData[0];
    const eth = marketData.find(c => c.symbol?.toLowerCase() === 'eth') || marketData[1];
    const sol = marketData.find(c => c.symbol?.toLowerCase() === 'sol') || marketData[2];
    const bnb = marketData.find(c => c.symbol?.toLowerCase() === 'bnb') || marketData[3];
    
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
    
    coins = [
      { sym: btc.symbol?.toUpperCase(), price: formatCurrency(btc.current_price), change: (btc.price_change_percentage_24h > 0 ? "+" : "") + Number(btc.price_change_percentage_24h).toFixed(1) + "%", up: btc.price_change_percentage_24h >= 0, image_url: btc.image },
      { sym: eth.symbol?.toUpperCase(), price: formatCurrency(eth.current_price), change: (eth.price_change_percentage_24h > 0 ? "+" : "") + Number(eth.price_change_percentage_24h).toFixed(1) + "%", up: eth.price_change_percentage_24h >= 0, image_url: eth.image },
      { sym: sol.symbol?.toUpperCase(), price: formatCurrency(sol.current_price), change: (sol.price_change_percentage_24h > 0 ? "+" : "") + Number(sol.price_change_percentage_24h).toFixed(1) + "%", up: sol.price_change_percentage_24h >= 0, image_url: sol.image },
      { sym: bnb.symbol?.toUpperCase(), price: formatCurrency(bnb.current_price), change: (bnb.price_change_percentage_24h > 0 ? "+" : "") + Number(bnb.price_change_percentage_24h).toFixed(1) + "%", up: bnb.price_change_percentage_24h >= 0, image_url: bnb.image },
    ];

    const totalMcap = marketData.reduce((sum, c) => sum + (Number(c.market_cap) || 0), 0);
    if (totalMcap > 0) {
      mcapStr = "$" + (totalMcap / 1e12).toFixed(2) + "T";
      const btcDom = ((Number(btc.market_cap) || 0) / totalMcap) * 100;
      btcDomStr = btcDom.toFixed(1) + "%";
    }
  }
  return (
    <div style={{ background: T.card, border: `1px solid ${T.borderFeat}`, borderRadius: 24, overflow: "hidden", boxShadow: "none" }}>
      {/* Browser bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
        {["#ff5f57","#febc2e","#28c840"].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        <div style={{ flex: 1, marginLeft: 8, height: 22, borderRadius: 6, background: "var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 10, color: T.textMuted }}>www.cryptoneko.online/dashboard</span>
        </div>
      </div>

      <div style={{ padding: "20px 20px" }}>
        {/* Stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { l: "Market Cap", v: mcapStr },
            { l: "BTC Dom", v: btcDomStr },
            { l: "Coins", v: coinsStr },
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
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {c.image_url && <img src={c.image_url} alt={c.sym} style={{ width: 24, height: 24, borderRadius: "50%" }} />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: getCoinColor(c.sym) }}>{c.sym}</div>
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: T.textPrimary, fontWeight: 600 }}>{c.price}</div>
                  </div>
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
  const { data: stats } = useMarketStats();
  const { data: marketData } = useMarket(200);
  const { t } = useTranslation();
  
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);

  const handleSecretClick = () => {
    setSecretClickCount((prev) => {
      if (prev + 1 >= 5) {
        setIsGameOpen(true);
        return 0;
      }
      return prev + 1;
    });
  };

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
      badgeColor: "#00c6ff",
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
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: T.bg, border: `1px solid ${T.border}` }}>
              {c.image_url ? (
                <img src={c.image_url} alt={c.sym} style={{ width: 32, height: 32, borderRadius: "50%" }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,198,255,0.1)", border: "1px solid rgba(0,198,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#00c6ff" }}>{c.sym.slice(0,1)}</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: getCoinColor(c.sym) }}>{c.sym}</div>
                <div style={{ height: 3, width: 50, borderRadius: 2, background: T.border, marginTop: 4 }}>
                  <motion.div 
                    initial={{ width: 0 }} 
                    whileInView={{ width: `${c.bar}%` }} 
                    viewport={{ once: true }} 
                    transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 2, background: c.up ? T.green : T.red }} 
                  />
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
      badge: t('landing.feat2.badge'),
      badgeColor: T.purple,
      icon: Brain,
      title: t('landing.feat2.title'),
      desc: t('landing.feat2.desc'),
      points: [t('landing.feat2.p1'), t('landing.feat2.p2'), t('landing.feat2.p3')],
      mockupSide: "left",
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,240,255,0.06)", border: `1px solid ${T.borderFeat}` }}>
            <div style={{ fontSize: 9, color: T.purple, fontWeight: 800, letterSpacing: ".15em", marginBottom: 8 }}>🤖 NEKO AI</div>
            <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: t('landing.feat2.mockup').replace('+18.4%', '<span style="color: #00c6ff; font-weight: 700">+18.4%</span>').replace('15%', '<span style="color: #00f0ff; font-weight: 700">15%</span>').replace('%18.4', '<span style="color: #00c6ff; font-weight: 700">%18.4</span>').replace('%15', '<span style="color: #00f0ff; font-weight: 700">%15</span>') }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { l: t('landing.feat2.m_score'), v: "87/100", c: T.green },
              { l: t('landing.feat2.m_risk'), v: t('landing.feat2.m_risk_val'), c: "#f59e0b" },
              { l: t('landing.feat2.m_corr'), v: "0.72", c: T.purple },
              { l: t('landing.feat2.m_sharpe'), v: "1.84", c: "#00c6ff" },
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
      badge: t('landing.feat3.badge'),
      badgeColor: T.green,
      icon: Wallet,
      title: t('landing.feat3.title'),
      desc: t('landing.feat3.desc'),
      points: [t('landing.feat3.p1'), t('landing.feat3.p2'), t('landing.feat3.p3')],
      mockupSide: "right",
      mockup: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>{t('landing.feat3.m_title')}</span>
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
            <span style={{ fontSize: 12, color: T.textMuted }}>{t('landing.feat3.m_total')}</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: T.green, fontFamily: "monospace" }}>+$4,340</span>
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
          <span style={{ fontSize: 12, fontWeight: 700, color: T.green, letterSpacing: "0.06em" }}>{t('landing.live_tracking', { count: coinsStr })}</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(44px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", margin: "0 0 24px" }}>
          <span style={{ color: T.textPrimary }}>{t('landing.hero_title_1')}<br /></span>
          <span style={{
            background: `linear-gradient(135deg, #00f0ff 0%, #00ffff 40%, #38bdf8 100%)`,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "lp-grad 6s linear infinite",
          }}>
            {t('landing.hero_title_2')}
          </span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2.2vw, 20px)", color: T.textSecondary, maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7 }}>
          {t('landing.hero_subtitle')}
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
                boxShadow: "none",
                transition: "all 200ms ease",
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
            >
              {t('landing.cta_primary')} <ArrowRight size={16} />
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
              boxShadow: "none",
              display: "flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {isLoggedIn ? t('nav.dashboard') : t('landing.cta_secondary')} {isLoggedIn && <ArrowRight size={16} />}
          </button>
        </div>
        {!isLoggedIn && <div style={{ fontSize: 12, color: T.textMuted }}>{t('landing.no_credit_card')}</div>}

        {/* Stat row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginTop: 64, flexWrap: "wrap" }}>
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

      {/* ─── DASHBOARD PREVIEW ───────────────────────────────── */}
      <section style={{ padding: "0 clamp(20px,5vw,80px) 80px", maxWidth: 1000, margin: "0 auto" }}>
        <Reveal>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: -40, background: `radial-gradient(ellipse at center, rgba(0,240,255,0.12) 0%, transparent 60%)`, filter: "blur(40px)", pointerEvents: "none" }} />
            <DashboardMockup coinsStr={coinsStr} t={t} marketData={marketData} />
          </div>
        </Reveal>
      </section>



      {/* ─── FEATURE STICKY CARDS ────────────────────────────── */}
      <section style={{ padding: "0 clamp(20px,5vw,80px)", maxWidth: 1200, margin: "0 auto 160px" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <Reveal>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.purple, marginBottom: 16 }}>{t('landing.features_header.badge')}</div>
            <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1 }}>
              {t('landing.features_header.title')}<br />
              <span style={{ color: T.textMuted }}>{t('landing.features_header.subtitle')}</span>
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
                  background: `rgba(15,15,26,0.98)`,
                  border: `1px solid ${T.border}`,
                  boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 var(--border-soft)",
                  overflow: "hidden",
                  transition: "transform 0.3s ease, opacity 0.3s ease",
                  transformOrigin: "top center",
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
                    <div style={{ flex: 1, marginLeft: 6, height: 18, borderRadius: 5, background: "var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 9, color: T.textMuted }}>www.cryptoneko.online</span>
                    </div>
                  </div>
                  {f.mockup}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────── */}
      <section style={{ padding: "0 clamp(20px,5vw,80px) 120px", maxWidth: 900, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.purple, marginBottom: 16 }}>{t('landing.pricing.badge')}</div>
            <h2 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>{t('landing.pricing.title')}<br /><span style={{ color: T.textMuted }}>{t('landing.pricing.subtitle')}</span></h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {plans.map((plan) => (
              <Card key={plan.name} featured={plan.featured} style={{ padding: "40px 36px" }}>
                {plan.featured && (
                  <div style={{ position: "absolute", top: 0, left: "50%", transform: "translate(-50%, -50%)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", padding: "4px 16px", borderRadius: 100, background: T.purple, color: "white" }}>{t('landing.pricing.most_popular')}</div>
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
                      boxShadow: "none",
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
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.purple, marginBottom: 16 }}>{t('landing.faq.badge')}</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>{t('landing.faq.title')}</h2>
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
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: T.purple, marginBottom: 20 }}>{t('landing.cta.badge')}</div>
              <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px" }}>{t('landing.cta.title')}</h2>
              <p style={{ fontSize: 18, color: T.textSecondary, margin: "0 0 48px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
                {t('landing.cta.desc')}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                {!isLoggedIn ? (
                  <button
                    onClick={() => onAuthOpen?.("signup")}
                    style={{ padding: "14px 36px", borderRadius: 14, border: "none", cursor: "pointer", background: T.purple, color: "white", fontSize: 15, fontWeight: 800, boxShadow: "none", transition: "all 200ms" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
                  >
                    {t('landing.cta.btn1')}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/dashboard")}
                    style={{ padding: "14px 36px", borderRadius: 14, border: "none", cursor: "pointer", background: T.purple, color: "white", fontSize: 15, fontWeight: 800, boxShadow: "none", transition: "all 200ms", display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
                  >
                    {t('nav.dashboard')} <ArrowRight size={16} />
                  </button>
                )}
                <button
                  onClick={() => navigate("/market")}
                  style={{ padding: "14px 32px", borderRadius: 14, cursor: "pointer", background: "transparent", color: T.textSecondary, fontSize: 15, fontWeight: 600, border: `1px solid ${T.border}`, transition: "all 200ms" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderFeat; e.currentTarget.style.color = T.textPrimary; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}
                >
                  {t('landing.cta.btn2')}
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
              { l: t('landing.footer.terms'), p: "/terms" },
              { l: t('landing.footer.privacy'), p: "/privacy" },
              { l: t('landing.footer.docs'), p: "/docs" },
              { l: t('landing.footer.pricing'), p: "/pricing" },
            ].map(link => (
              <span key={link.l} onClick={() => navigate(link.p)} style={{ fontSize: 13, color: T.textMuted, cursor: "pointer", transition: "color 150ms" }}
                onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
                onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
                {link.l}
              </span>
            ))}
          </div>
          <div 
            style={{ fontSize: 12, color: T.textMuted, cursor: "pointer", userSelect: "none" }}
            onClick={handleSecretClick}
          >
            {t('landing.footer.disclaimer')}
          </div>
        </div>
      </footer>
      
      {isGameOpen && <MotoGameModal onClose={() => setIsGameOpen(false)} />}
    </div>
  );
}

