// ============================================================
// pages/Pricing.jsx
// ============================================================

import React, { useState } from "react";
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
    color: "rgba(255,255,255,0.02)",
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
    ],
    ctaVariant: "outline",
  },
  {
    id: "pro",
    icon: Crown,
    price: { monthly: 10, yearly: 7 },
    color: "rgba(94, 106, 210, 0.02)",
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
    ],
    ctaVariant: "primary",
  },
  {
    id: "teams",
    icon: Webhook,
    price: { monthly: 15, yearly: 12 },
    color: "rgba(124, 58, 237, 0.02)",
    accent: "var(--secondary)",
    badge_key: null,
    features: [
      { key: "all_pro", included: true },
      { key: "team_webhooks", included: true },
      { key: "shared_portfolios", included: true },
      { key: "api_keys", included: true },
      { key: "sso_security", included: true },
      { key: "priority_support", included: true },
    ],
    ctaVariant: "white",
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
        padding: "8px 0",
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
  const isWhite = plan.ctaVariant === "white";

  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });
  }

  const btnStyle = isWhite
    ? {
        background: "#ffffff",
        color: "#0b0b12",
        border: "none",
        boxShadow: "0 4px 20px rgba(255, 255, 255, 0.1)",
      }
    : isPrimary
      ? {
          background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
          color: "#ffffff",
          border: "none",
          boxShadow: "0 4px 20px rgba(94, 106, 210, 0.15)",
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
        border: `1px solid ${isPrimary ? "var(--accent-border)" : isWhite ? "var(--secondary-soft)" : "var(--border)"}`,
        borderRadius: 20,
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
        boxShadow: isHovered ? `0 10px 30px ${plan.id === 'pro' ? 'rgba(94, 106, 210, 0.05)' : plan.id === 'teams' ? 'rgba(124, 58, 237, 0.05)' : 'rgba(255, 255, 255, 0.01)'}` : "none",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mouse Spotlight Background */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, ${plan.id === 'pro' ? 'rgba(94, 106, 210, 0.06)' : plan.id === 'teams' ? 'rgba(124, 58, 237, 0.06)' : 'rgba(255, 255, 255, 0.02)'}, transparent 80%)`,
          }}
        />
      )}

      {/* Mouse Spotlight Border Glow */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            borderRadius: 20,
            border: `1px solid transparent`,
            backgroundImage: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, ${plan.id === 'pro' ? 'rgba(94, 106, 210, 0.4)' : plan.id === 'teams' ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255, 255, 255, 0.2)'}, transparent 100%)`,
            backgroundOrigin: "border-box",
            backgroundClip: "border-box",
            WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "destination-out",
            maskComposite: "exclude",
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Badge */}
        {plan.badge_key && (
          <div
            style={{
              position: "absolute",
              top: -44,
              left: "50%",
              transform: "translateX(-50%)",
              background: isPrimary
                ? "linear-gradient(135deg, var(--accent), #8B5CF6)"
                : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              color: "#ffffff",
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
            marginBottom: 16,
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
        <div style={{ marginBottom: 12 }}>
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
                {plan.id === "teams" ? `${t("pricing.mo")} / user` : t("pricing.mo")}
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
            color: "var(--text-secondary)",
            marginBottom: 24,
            lineHeight: 1.6,
            minHeight: 40,
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
            marginBottom: 24,
            transition: "all 0.2s ease",
            opacity: isCurrent ? 0.6 : 1,
            ...btnStyle,
          }}
          onMouseEnter={(e) => {
            if (!isCurrent && !isPrimary && !isWhite) {
              e.currentTarget.style.borderColor = "var(--text-muted)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
            } else if (isWhite) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isCurrent && !isPrimary && !isWhite) {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "transparent";
            } else if (isWhite) {
              e.currentTarget.style.background = "#ffffff";
            }
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
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {plan.features.map((f, i) => (
            <FeatureRow key={i} text={t(`pricing.features.${f.key}`)} included={f.included} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Matrix Renderer ───────────────────────────────────────────
function ComparisonMatrix() {
  const { t } = useTranslation();

  const categories = [
    {
      title: t("pricing.matrix.cat_data"),
      items: [
        { name: t("pricing.features.live_data"), free: "Check", pro: "Check", teams: "Check" },
        { name: t("pricing.features.top10"), free: "Check", pro: "Check", teams: "Check" },
        { name: t("pricing.features.coin_detail"), free: "Check", pro: "Check", teams: "Check" },
        { name: t("pricing.features.watchlist_10"), free: "10 coins", pro: "Unlimited", teams: "Unlimited" },
        { name: t("pricing.features.fg_index"), free: "Check", pro: "Check", teams: "Check" },
      ]
    },
    {
      title: t("pricing.matrix.cat_ai"),
      items: [
        { name: t("pricing.features.ai_ta"), free: "X", pro: "Check", teams: "Check" },
        { name: t("pricing.features.ai_portfolio"), free: "X", pro: "Check", teams: "Check" },
        { name: t("pricing.features.ai_signals"), free: "X", pro: "Check", teams: "Check" },
        { name: t("pricing.features.ai_market"), free: "X", pro: "Check", teams: "Check" },
        { name: t("pricing.features.vol_anomaly"), free: "X", pro: "Check", teams: "Check" },
      ]
    },
    {
      title: t("pricing.matrix.cat_collab"),
      items: [
        { name: t("pricing.features.alerts"), free: "Max 5", pro: "Unlimited", teams: "Unlimited" },
        { name: t("pricing.features.notifs"), free: "X", pro: "Check", teams: "Check" },
        { name: t("pricing.features.shared_portfolios"), free: "X", pro: "X", teams: "Check" },
        { name: t("pricing.features.team_webhooks"), free: "X", pro: "X", teams: "Check" },
      ]
    },
    {
      title: t("pricing.matrix.cat_enterprise"),
      items: [
        { name: t("pricing.features.api"), free: "X", pro: "Basic", teams: "100 req/s" },
        { name: t("pricing.features.sso_security"), free: "X", pro: "X", teams: "Check" },
        { name: t("pricing.features.priority_support"), free: "Email", pro: "Priority", teams: "24/7 Dedicated" },
      ]
    }
  ];

  return (
    <div style={{ marginTop: 80, marginBottom: 80 }}>
      <h3 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 32, letterSpacing: "-0.02em" }}>
        {t("pricing.matrix.title")}
      </h3>
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, background: "rgba(255,255,255,0.01)", overflow: "hidden" }}>
        {/* Table Header */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", fontWeight: 600, fontSize: 13, color: "var(--text-secondary)" }}>
          <div>Feature</div>
          <div style={{ textAlign: "center" }}>Free</div>
          <div style={{ textAlign: "center", color: "var(--accent)" }}>Pro</div>
          <div style={{ textAlign: "center", color: "var(--secondary)" }}>Teams</div>
        </div>
        {/* Table Body */}
        {categories.map((cat, catIdx) => (
          <div key={catIdx}>
            {/* Category title */}
            <div style={{ background: "rgba(255,255,255,0.01)", padding: "12px 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border-soft)" }}>
              {cat.title}
            </div>
            {/* Category items */}
            {cat.items.map((item, itemIdx) => (
              <div key={itemIdx} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "14px 24px", borderBottom: "1px solid var(--border-soft)", fontSize: 13, alignItems: "center" }}>
                <div style={{ color: "var(--text-primary)" }}>{item.name}</div>
                <div style={{ display: "flex", justifyContent: "center" }}>{renderVal(item.free)}</div>
                <div style={{ display: "flex", justifyContent: "center" }}>{renderVal(item.pro, true)}</div>
                <div style={{ display: "flex", justifyContent: "center" }}>{renderVal(item.teams, false, true)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderVal(val: string, isPro?: boolean, isTeams?: boolean) {
  if (val === "Check") {
    return <Check size={16} style={{ color: isPro ? "var(--accent)" : isTeams ? "var(--secondary)" : "#2ecc71" }} />;
  }
  if (val === "X") {
    return <X size={16} style={{ color: "var(--text-muted)", opacity: 0.3 }} />;
  }
  return <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{val}</span>;
}

// ── Main ──────────────────────────────────────────────────────
import PricingSection6 from "../components/ui/pricing-section-4";

export default function Pricing({ onAuthOpen }: { onAuthOpen?: () => void }) {
  return (
    <div className="w-full">
      <PricingSection6 />
    </div>
  );
}
