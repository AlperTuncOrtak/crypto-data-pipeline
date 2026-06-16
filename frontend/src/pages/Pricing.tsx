// ============================================================
// pages/Pricing.jsx
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../api/client";
import {
  Check,
  X,
  Crown,
  Zap,
  TrendingUp,
  Bell,
  Brain,
  BarChart2,
  Webhook,
  FileText,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ── Plan verileri ─────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    icon: BarChart2,
    price: { monthly: 0, yearly: 0 },
    color: "rgba(255,255,255,0.1)",
    accent: "#888",
    badge_key: null,
    features: [
      { key: "live_data", included: true },
      { key: "top10", included: true },
      { key: "coin_detail", included: true },
      { key: "watchlist_10", included: true },
      { key: "fg_index", included: true },
      { key: "portfolio_50", included: false },
      { key: "tax_csv", included: false },
      { key: "ai_ta", included: false },
      { key: "alerts", included: false },
      { key: "notifs", included: false },
      { key: "api", included: false },
    ],
    ctaVariant: "outline",
  },
  {
    id: "pro",
    icon: Crown,
    price: { monthly: 10, yearly: 7 },
    color: "rgba(245,166,35,0.12)",
    accent: "var(--accent)",
    badge_key: "most_popular",
    features: [
      { key: "all_free", included: true },
      { key: "portfolio_unlimited", included: true },
      { key: "multi_csv", included: true },
      { key: "tax_pro", included: true },
      { key: "ai_portfolio", included: true },
      { key: "ai_signals", included: true },
      { key: "ai_market", included: true },
      { key: "watchlist_unlimited", included: true },
      { key: "alerts", included: true },
      { key: "vol_anomaly", included: true },
      { key: "priority_data", included: true },
      { key: "api", included: false },
    ],
    ctaVariant: "primary",
  },
];

// ── Components ────────────────────────────────────────────────
function FeatureRow({ text, included }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 0",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      {included ? (
        <Check size={14} style={{ color: "#2ecc71", flexShrink: 0 }} />
      ) : (
        <X
          size={14}
          style={{ color: "var(--border)", flexShrink: 0 }}
        />
      )}
      <span
        style={{
          fontSize: 13,
          color: included ? "var(--text-secondary)" : "var(--text-muted)",
        }}
      >
        {text}
      </span>
    </div>
  );
}

function PlanCard({
  plan,
  billing,
  currentPlan,
  onSelect,
  isLoggedIn,
  checkoutLoading,
}) {
  const { t } = useTranslation();
  const Icon = plan.icon;
  const price = billing === "yearly" ? plan.price.yearly : plan.price.monthly;
  const isCurrent = currentPlan === plan.id;
  const isPrimary = plan.ctaVariant === "primary";
  const isPurple = plan.ctaVariant === "gray";

  const btnStyle = isPrimary
    ? {
        background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
        color: "#111",
        border: "none",
        boxShadow: "none",
      }
    : isPurple
      ? {
          background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
          color: "var(--text-primary)",
          border: "none",
          boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
        }
      : {
          background: "transparent",
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
        };

  return (
    <div
      style={{
        position: "relative",
        background: plan.color,
        border: `1px solid ${isPrimary ? "rgba(245,166,35,0.35)" : isPurple ? "rgba(139,92,246,0.3)" : "var(--border)"}`,
        borderRadius: 20,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s",
        boxShadow: "none",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "translateY(-4px)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {/* Badge */}
      {plan.badge_key && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: isPrimary
              ? "linear-gradient(135deg, var(--accent), #8B5CF6)"
              : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            color: "var(--text-primary)",
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 14px",
            borderRadius: 999,
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          {t(`pricing.badge.${plan.badge_key}`)}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: `${plan.accent}18`,
            border: `1px solid ${plan.accent}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} style={{ color: plan.accent }} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{t(`pricing.${plan.id}.name`)}</div>
          {isCurrent && (
            <div style={{ fontSize: 10, color: plan.accent, fontWeight: 600 }}>
              {t("pricing.current_plan")}
            </div>
          )}
        </div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: 8 }}>
        {price === 0 ? (
          <div style={{ fontSize: 40, fontWeight: 900 }}>{t("pricing.free_text")}</div>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}
            >
              $
            </span>
            <span
              style={{
                fontSize: 42,
                fontWeight: 900,
                letterSpacing: "-0.02em",
              }}
            >
              {price}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {t("pricing.mo")}
            </span>
          </div>
        )}
        {billing === "yearly" && price > 0 && (
          <div
            style={{
              fontSize: 11,
              color: "#2ecc71",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {t("pricing.save_year", { amount: (plan.price.monthly - price) * 12 })}
          </div>
        )}
      </div>

      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        {t(`pricing.${plan.id}.desc`)}
      </p>

      {/* CTA */}
      <button
        onClick={() => onSelect(plan)}
        disabled={isCurrent || checkoutLoading}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: isCurrent ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 20,
          transition: "all 0.2s",
          opacity: isCurrent ? 0.6 : 1,
          ...btnStyle,
        }}
        onMouseEnter={(e) => {
          if (!isCurrent && !isPrimary)
            e.currentTarget.style.borderColor = "var(--text-muted)";
        }}
        onMouseLeave={(e) => {
          if (!isCurrent && !isPrimary)
            e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        {isCurrent
          ? t("pricing.current_plan")
          : checkoutLoading && plan.id === "pro"
            ? t("pricing.redirecting")
            : t(`pricing.${plan.id}.cta`)}
        {!isCurrent && !checkoutLoading && <ArrowRight size={14} />}
      </button>

      {/* Features */}
      <div>
        {plan.features.map((f, i) => (
          <FeatureRow key={i} text={t(`pricing.features.${f.key}`)} included={f.included} />
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Pricing({ onAuthOpen }) {
  const { t } = useTranslation();
  const { isLoggedIn, isPro, plan: currentPlan } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const faqs = t("pricing.faq", { returnObjects: true });

  async function handleSelect(plan) {
    if (plan.id === "free") {
      if (!isLoggedIn) onAuthOpen?.();
      else navigate("/");
      return;
    }
    if (!isLoggedIn) {
      onAuthOpen?.();
      return;
    }
    // Stripe Checkout
    try {
      setCheckoutLoading(true);
      const resp = await apiClient.post("/create-checkout-session", {
        plan: plan.id,
        billing,
      });
      window.location.href = resp.data.url;
    } catch (e) {
      alert(
        t("pricing.payment_error"),
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div
      style={{ color: "var(--text-primary)", maxWidth: 1100, margin: "0 auto" }}
    >
      {/* HERO */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            borderRadius: 999,
            background: "rgba(245,166,35,0.08)",
            border: "1px solid rgba(245,166,35,0.2)",
            marginBottom: 16,
          }}
        >
          <Zap size={12} style={{ color: "var(--accent)" }} />
          <span
            style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}
          >
            {t("pricing.hero_badge")}
          </span>
        </div>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            marginBottom: 12,
          }}
        >
          {t("pricing.hero_title1")}
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("pricing.hero_title2")}
          </span>
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-muted)",
            maxWidth: 480,
            margin: "0 auto 28px",
          }}
        >
          {t("pricing.hero_desc")}
        </p>

        {/* Billing toggle */}
        <div
          style={{
            display: "inline-flex",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 4,
            gap: 4,
          }}
        >
          {["monthly", "yearly"].map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: "8px 20px",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background:
                  billing === b ? "var(--bg-elevated)" : "transparent",
                color:
                  billing === b ? "var(--text-primary)" : "var(--text-muted)",
                transition: "all 0.2s",
              }}
            >
              {b === "monthly" ? t("pricing.monthly") : t("pricing.yearly")}
              {b === "yearly" && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    color: "#2ecc71",
                    fontWeight: 700,
                  }}
                >
                  -35%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* PLAN CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
          marginBottom: 64,
        }}
      >
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={billing}
            currentPlan={currentPlan}
            onSelect={handleSelect}
            isLoggedIn={isLoggedIn}
            checkoutLoading={checkoutLoading}
          />
        ))}
      </div>

      {/* TRUST BADGES */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          flexWrap: "wrap",
          marginBottom: 64,
        }}
      >
        {[
          { icon: Shield, key: "ssl" },
          { icon: TrendingUp, key: "uptime" },
          { icon: Bell, key: "alerts" },
          { icon: Brain, key: "ai" },
          { icon: FileText, key: "cancel" },
        ].map(({ icon: Icon, key }) => (
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Icon size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {t(`pricing.trust.${key}`)}
            </span>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {t("pricing.faq_title")}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.isArray(faqs) && faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {faq.q}
                </span>
                <span
                  style={{
                    fontSize: 18,
                    color: "var(--text-muted)",
                    transform: openFaq === i ? "rotate(45deg)" : "rotate(0)",
                    transition: "transform 0.2s",
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
              </button>
              {openFaq === i && (
                <div
                  style={{
                    padding: "0 20px 16px",
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.7,
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div
        style={{
          textAlign: "center",
          marginTop: 64,
          padding: "40px 24px",
          background:
            "linear-gradient(135deg, rgba(245,166,35,0.08), rgba(245,166,35,0.03))",
          border: "1px solid rgba(245,166,35,0.2)",
          borderRadius: 20,
        }}
      >
        <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          {t("pricing.still_not_sure")}
        </h3>
        <p
          style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}
        >
          {t("pricing.start_free_desc")}
        </p>
        <button
          onClick={() => (isLoggedIn ? navigate("/") : onAuthOpen?.())}
          style={{
            padding: "12px 28px",
            borderRadius: 12,
            background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
            color: "#111",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            boxShadow: "none",
          }}
        >
          {t("pricing.get_started_free")}
        </button>
      </div>
    </div>
  );
}
