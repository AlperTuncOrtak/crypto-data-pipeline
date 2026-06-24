import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// ─── THEME ───────────────────────────────────────────────────────
export const T = {
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
export const FLOATING_COINS = [
  { sym: "BTC",  slug: "bitcoin",     name: "Bitcoin",  price: "$107,412", change: "+2.4%", up: true,  img: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",    top: "12%", left: "10%",   delay: 0,   dur: 7.0, size: 52 },
  { sym: "ETH",  slug: "ethereum",    name: "Ethereum", price: "$3,891",   change: "+1.8%", up: true,  img: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",  top: "55%", left: "14%",   delay: 1.5, dur: 7.4, size: 46 },
  { sym: "SOL",  slug: "solana",      name: "Solana",   price: "$182",     change: "-0.9%", up: false, img: "https://assets.coingecko.com/coins/images/4128/small/solana.png",   top: "18%", right: "10%",  delay: 0.8, dur: 6.4, size: 44 },
  { sym: "BNB",  slug: "binancecoin", name: "BNB",      price: "$724",     change: "+3.2%", up: true,  img: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", top: "62%", right: "12%", delay: 2.2, dur: 7.8, size: 42 },
  { sym: "XRP",  slug: "ripple",      name: "XRP",      price: "$2.18",    change: "+5.1%", up: true,  img: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", top: "78%", left: "16%", delay: 1.1, dur: 8.2, size: 38 },
  { sym: "DOGE", slug: "dogecoin",    name: "Dogecoin", price: "$0.38",    change: "+7.3%", up: true,  img: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",    top: "8%",  right: "16%",  delay: 3.0, dur: 6.6, size: 40 },
];

export function FloatingCoinCard({ sym, name, price, change, up, img, top, left, right, delay, dur, size, onClick }: {
  sym: string; name: string; price: string; change: string; up: boolean;
  img: string; top: string; left?: string; right?: string; delay: number; dur: number; size: number;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const accentColor = up ? "rgba(45,212,191,0.6)" : "rgba(244,63,94,0.6)";
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
        @keyframes fc-reveal-up { from { opacity:0; transform:translateY(10px) scale(0.93); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fc-reveal-down { from { opacity:0; transform:translateY(-10px) scale(0.93); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>

      <div className={`fc-wrap-${sym}`} style={{ position: "relative" }}>

        {/* ── Blurred circle icon ── */}
        <div style={{
          width: size, height: size,
          borderRadius: "50%",
          overflow: "hidden",
          border: `1px solid ${hovered ? accentColor : "rgba(255,255,255,0.07)"}`,
          boxShadow: hovered
            ? `0 0 0 4px ${up ? "rgba(45,212,191,0.15)" : "rgba(244,63,94,0.15)"}, 0 8px 32px rgba(0,0,0,0.5)`
            : "0 4px 20px rgba(0,0,0,0.5)",
          filter: hovered ? "blur(0px)" : "blur(3px)",
          opacity: hovered ? 1 : 0.55,
          transition: "all 300ms cubic-bezier(0.16,1,0.3,1)",
          transform: hovered ? "scale(1.12)" : "scale(1)",
          background: "rgba(11,18,39,0.6)",
        }}>
          <img src={img} alt={sym} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>

        {/* ── Reveal card on hover ── */}
        {hovered && (
          <div style={{
            position: "absolute",
            bottom: isTopHalf ? "auto" : `calc(100% + 10px)`,
            top: isTopHalf ? `calc(100% + 10px)` : "auto",
            left: right ? "auto" : "50%",
            right: right ? "50%" : "auto",
            transform: right ? "translateX(32px)" : "translateX(-32px)",
            background: "rgba(18,17,26,0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: `1px solid rgba(255,255,255,0.07)`,
            borderRadius: 16,
            padding: "16px 18px",
            minWidth: 190,
            boxShadow: `0 28px 64px rgba(0,0,0,0.8), 0 0 0 1px ${up ? "rgba(45,212,191,0.08)" : "rgba(244,63,94,0.08)"}`,
            animation: `${isTopHalf ? "fc-reveal-down" : "fc-reveal-up"} 180ms cubic-bezier(0.16,1,0.3,1) forwards`,
            zIndex: 20,
            pointerEvents: "none",
          }}>
            <div style={{
              position: "absolute", 
              bottom: isTopHalf ? "auto" : -6, 
              top: isTopHalf ? -6 : "auto", 
              left: right ? "auto" : "26px", 
              right: right ? "26px" : "auto",
              width: 12, height: 6,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: isTopHalf ? "none" : `6px solid ${up ? "rgba(45,212,191,0.3)" : "rgba(244,63,94,0.3)"}`,
              borderBottom: isTopHalf ? `6px solid ${up ? "rgba(45,212,191,0.3)" : "rgba(244,63,94,0.3)"}` : "none",
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <img src={img} alt={sym} style={{ width: 34, height: 34, borderRadius: "50%", boxShadow: `0 0 12px ${up ? "rgba(45,212,191,0.4)" : "rgba(244,63,94,0.4)"}` }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>{sym}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{name}</div>
              </div>
            </div>

            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "monospace", letterSpacing: "-0.03em", marginBottom: 8 }}>
              {price}
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 10px", borderRadius: 8,
              background: up ? "rgba(45,212,191,0.08)" : "rgba(244,63,94,0.08)",
              border: `1px solid ${up ? "rgba(45,212,191,0.2)" : "rgba(244,63,94,0.2)"}`,
              width: "fit-content",
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: up ? T.green : T.red, boxShadow: `0 0 6px ${up ? T.green : T.red}` }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: up ? T.green : T.red, fontFamily: "monospace" }}>
                {change} (24h)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Counter({ to, suffix = "", prefix = "" }: { to: number, suffix?: string, prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
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

export function Reveal({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
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

export function Card({ children, style = {}, featured = false }: { children: React.ReactNode, style?: React.CSSProperties, featured?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        background: featured ? "var(--accent-soft)" : T.card,
        border: `1px solid ${hov ? (featured ? "var(--accent-border)" : "var(--accent-soft)") : (featured ? T.borderFeat : T.border)}`,
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

export function Sparkline({ up = true }: { up?: boolean }) {
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
