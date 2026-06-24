import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMarket, useMarketStats } from "../../hooks/useMarket";
import { useAuth } from "../../hooks/useAuth";
import { T, FLOATING_COINS, FloatingCoinCard, Counter } from "./LandingHelpers";

interface HeroSectionProps {
  onAuthOpen?: (mode: string) => void;
}

export default function HeroSection({ onAuthOpen }: HeroSectionProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const { data: marketData } = useMarket(50);
  const { coinsTracked, alertsSent } = useMarketStats();

  const coinsStr = coinsTracked >= 1000 
    ? (coinsTracked / 1000).toFixed(1).replace(".0", "") + "k+" 
    : String(coinsTracked);

  return (
    <>
      <style>{`
        @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes lp-grad { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      `}</style>
      <section style={{ position: "relative", padding: "130px clamp(20px,5vw,80px) 100px", textAlign: "center", maxWidth: 1100, margin: "0 auto" }}>
        {/* Background — Linear-inspired dot grid */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px", maskImage: "linear-gradient(to bottom, black 20%, transparent 80%)", WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent 80%)" }} />
        </div>

        {/* ── Floating Coins ── */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: "calc(-50vw + 50%)", right: "calc(-50vw + 50%)", pointerEvents: "none", overflow: "visible" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {FLOATING_COINS.map((c) => {
              const liveCoin = marketData?.find((m: any) => m.symbol === c.sym);
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
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(52,211,153,0.08)", border: `1px solid ${T.greenBorder}`, marginBottom: 32, animation: "lp-pulse 3s infinite" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.green, letterSpacing: "0.06em" }}>{t('landing.live_tracking', { count: coinsStr })}</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(44px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", margin: "0 0 24px" }}>
          <span style={{ color: T.textPrimary }}>{t('landing.hero_title_1')}<br /></span>
          <span style={{
            background: `linear-gradient(to bottom, #ffffff 0%, #a0a0a0 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {t('landing.hero_title_2')}
          </span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2.2vw, 20px)", color: T.textSecondary, maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7 }}>
          {t('landing.hero_subtitle')}
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 24, justifyContent: "center" }}>
          {!isLoggedIn && (
            <button
              onClick={() => onAuthOpen?.("signup")}
              className="btn-primary"
              style={{
                padding: "12px 28px", borderRadius: "12px", border: "none", cursor: "pointer",
                fontSize: 15, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
              }}
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
            { v: alertsSent, s: "+", p: "", l: t('landing.stats.alerts') },
            { v: 99.9, s: "%", p: "", l: t('landing.stats.uptime') },
            { v: 0, s: "ms", p: "<50", l: t('landing.stats.latency') }
          ].map((s, i) => (
            <div key={i} style={{ padding: "0 32px", borderRight: i < 3 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 900, color: T.textPrimary, letterSpacing: "-0.04em", fontFamily: "monospace" }}>
                {s.p && <span style={{ color: T.textMuted, marginRight: 2 }}>{s.p}</span>}
                <Counter to={s.v} />{s.s}
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, fontWeight: 500, letterSpacing: "0.02em" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
