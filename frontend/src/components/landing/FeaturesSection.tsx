import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, Brain, Wallet, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { T, Reveal } from "./LandingHelpers";
import { getCoinColor } from "../../utils/colors";
import { useMarketStats } from "../../hooks/useMarket";

export default function FeaturesSection() {
  const { t } = useTranslation();
  const { data: stats } = useMarketStats();
  
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

  const featuresRef = useRef<HTMLDivElement>(null);

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
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--accent-soft)", border: `1px solid ${T.borderFeat}` }}>
            <div style={{ fontSize: 9, color: T.purple, fontWeight: 800, letterSpacing: ".15em", marginBottom: 8 }}>🤖 NEKO AI</div>
            <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: t('landing.feat2.mockup').replace('+18.4%', '<span style="color: #00c6ff; font-weight: 700">+18.4%</span>').replace('15%', '<span style="color: var(--accent); font-weight: 700">15%</span>').replace('%18.4', '<span style="color: #00c6ff; font-weight: 700">%18.4</span>').replace('%15', '<span style="color: var(--accent); font-weight: 700">%15</span>') }} />
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

  return (
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
                background: `rgba(18,17,26,0.7)`,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: `1px solid rgba(255,255,255,0.07)`,
                boxShadow: "0 40px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.03)",
                overflow: "hidden",
                transition: "transform 0.3s ease, opacity 0.3s ease",
                transformOrigin: "top center",
              }}
            >
              {/* bg glow */}
              <div style={{ position: "absolute", top: "-40%", left: isRight ? "-10%" : "auto", right: isRight ? "auto" : "-10%", width: "60%", height: "180%", background: `radial-gradient(circle, ${f.badgeColor}10 0%, transparent 55%)`, filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />

              {/* Text */}
              <div style={{ position: "relative", zIndex: 1, order: isRight ? 1 : 2 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", borderRadius: 100, background: `${f.badgeColor}12`, border: `1px solid ${f.badgeColor}35`, color: f.badgeColor, fontSize: 12, fontWeight: 800, letterSpacing: ".12em", marginBottom: 28, boxShadow: "none" }}>
                  <Icon size={14} />{f.badge}
                </div>
                <h3 style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 900, color: T.textPrimary, margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>{f.title}</h3>
                <p style={{ fontSize: "clamp(15px,1.8vw,18px)", color: T.textSecondary, lineHeight: 1.7, margin: "0 0 32px", maxWidth: 460 }}>{f.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {f.points.map((pt: string, j: number) => (
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
              <div style={{ position: "relative", zIndex: 1, order: isRight ? 2 : 1 }}>
                {f.mockup}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
