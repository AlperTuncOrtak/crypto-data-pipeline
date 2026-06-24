import React from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { T, Reveal, Card } from "./LandingHelpers";
import { useMarketStats } from "../../hooks/useMarket";

interface PricingSectionProps {
  onAuthOpen?: (mode: string) => void;
}

export default function PricingSection({ onAuthOpen }: PricingSectionProps) {
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

  return (
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
              {plan.featured && <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 60%)", filter: "blur(30px)", pointerEvents: "none" }} />}

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
                      <div style={{ width: 18, height: 18, borderRadius: 6, background: plan.featured ? "var(--accent-soft)" : T.greenBg, border: `1px solid ${plan.featured ? T.borderFeat : T.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
  );
}
