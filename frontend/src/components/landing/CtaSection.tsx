import React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { T, Reveal } from "./LandingHelpers";

interface CtaSectionProps {
  onAuthOpen?: (mode: string) => void;
}

export default function CtaSection({ onAuthOpen }: CtaSectionProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();

  return (
    <section style={{ padding: "0 clamp(20px,5vw,80px) 120px", maxWidth: 900, margin: "0 auto" }}>
      <Reveal>
        <div style={{ position: "relative", padding: "80px 60px", borderRadius: 36, background: "var(--accent-soft)", border: `1px solid ${T.borderFeat}`, textAlign: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, var(--accent-soft) 0%, transparent 60%)", filter: "blur(60px)", pointerEvents: "none" }} />
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
  );
}
