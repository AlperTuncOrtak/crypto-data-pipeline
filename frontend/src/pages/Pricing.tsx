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

// ── Plan verileri ─────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: BarChart2,
    price: { monthly: 0, yearly: 0 },
    color: "rgba(255,255,255,0.1)",
    accent: "#888",
    badge: null,
    desc: "Perfect for getting started with crypto analytics.",
    features: [
      { text: "Live market data (Gate.io, Bybit, OKX)", included: true },
      { text: "Top 10 by market cap + Heatmap", included: true },
      { text: "Coin detail pages", included: true },
      { text: "Watchlist (up to 10 coins)", included: true },
      { text: "Fear & Greed index", included: true },
      { text: "Portfolio tracker (up to 50 trades)", included: false },
      { text: "Tax reporting (CSV export)", included: false },
      { text: "AI Technical Analysis (Altfins)", included: false },
      { text: "Custom price & volume alerts", included: false },
      { text: "Telegram / webhook notifications", included: false },
      { text: "API access", included: false },
    ],
    cta: "Get Started Free",
    ctaVariant: "outline",
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    price: { monthly: 10, yearly: 7 },
    color: "rgba(245,166,35,0.12)",
    accent: "var(--accent)",
    badge: "Most Popular",
    desc: "For serious traders who want an edge.",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Portfolio tracker (unlimited trades)", included: true },
      {
        text: "Multi-exchange CSV import (Binance, Bybit, OKX, Coinbase, Kraken)",
        included: true,
      },
      { text: "Tax report — FIFO P&L, short/long term", included: true },
      { text: "AI portfolio analysis (risk score, rebalance)", included: true },
      { text: "Altfins AI signals (150+ indicators)", included: true },
      { text: "Gemini AI market analysis", included: true },
      { text: "Unlimited watchlist", included: true },
      { text: "Custom price & volume alerts", included: true },
      { text: "Volume anomaly detection", included: true },
      { text: "Priority data updates", included: true },
      { text: "API access", included: false },
    ],
    cta: "Upgrade to Pro",
    ctaVariant: "primary",
  },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from your account settings. You keep access until the end of your billing period.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan gives you permanent access to core features. Pro features can be tried for 7 days free when you first upgrade.",
  },
  {
    q: "How does the AI analysis work?",
    a: "We combine Altfins pre-computed signals (150+ technical indicators across 2,200+ coins) with Gemini AI to generate plain-English market assessments and personalized trade advice.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards and debit cards via Stripe. Crypto payments (USDT/USDC) are also available on request.",
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
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {included ? (
        <Check size={14} style={{ color: "#2ecc71", flexShrink: 0 }} />
      ) : (
        <X
          size={14}
          style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }}
        />
      )}
      <span
        style={{
          fontSize: 13,
          color: included ? "var(--text-secondary)" : "rgba(255,255,255,0.25)",
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
          color: "#fff",
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
      {plan.badge && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: isPrimary
              ? "linear-gradient(135deg, var(--accent), #8B5CF6)"
              : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 14px",
            borderRadius: 999,
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          {plan.badge}
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
          <div style={{ fontSize: 17, fontWeight: 700 }}>{plan.name}</div>
          {isCurrent && (
            <div style={{ fontSize: 10, color: plan.accent, fontWeight: 600 }}>
              CURRENT PLAN
            </div>
          )}
        </div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: 8 }}>
        {price === 0 ? (
          <div style={{ fontSize: 40, fontWeight: 900 }}>Free</div>
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
              /mo
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
            Save ${(plan.price.monthly - price) * 12}/year
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
        {plan.desc}
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
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
        }}
        onMouseLeave={(e) => {
          if (!isCurrent && !isPrimary)
            e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        {isCurrent
          ? "Current Plan"
          : checkoutLoading && plan.id === "pro"
            ? "Redirecting..."
            : plan.cta}
        {!isCurrent && !checkoutLoading && <ArrowRight size={14} />}
      </button>

      {/* Features */}
      <div>
        {plan.features.map((f, i) => (
          <FeatureRow key={i} {...f} />
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Pricing({ onAuthOpen }) {
  const { isLoggedIn, isPro, plan: currentPlan } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
        "Payment error. Please try again or contact hello@cryptoanalytics.com",
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
            Simple, transparent pricing
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
          Invest smarter.
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Pay less than a coffee a day.
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
          Professional crypto analytics used by thousands of traders worldwide.
          Start free, upgrade when ready.
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
              {b === "monthly" ? "Monthly" : "Yearly"}
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
          { icon: Shield, text: "SSL encrypted" },
          { icon: TrendingUp, text: "99.9% uptime" },
          { icon: Bell, text: "Real-time alerts" },
          { icon: Brain, text: "AI-powered signals" },
          { icon: FileText, text: "Cancel anytime" },
        ].map(({ icon: Icon, text }) => (
          <div
            key={text}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Icon size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {text}
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
          Frequently asked questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQS.map((faq, i) => (
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
          Still not sure?
        </h3>
        <p
          style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}
        >
          Start with the free plan — no credit card required.
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
          Get started for free →
        </button>
      </div>
    </div>
  );
}
