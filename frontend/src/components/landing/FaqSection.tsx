import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { T, Reveal } from "./LandingHelpers";
import { useMarketStats } from "../../hooks/useMarket";

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        borderRadius: 16,
        border: `1px solid ${open ? T.borderFeat : T.border}`,
        background: open ? "var(--accent-soft)" : T.card,
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

export default function FaqSection() {
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

  const faqs = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1', { count: coinsStr }) },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2', { count: coinsStr }) },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
    { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
  ];

  return (
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
  );
}
