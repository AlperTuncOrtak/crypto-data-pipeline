"use client";

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";

import { Sparkles as SparklesComp } from "../components/ui/sparkles";

const TimelineContent = ({ children, className, as: Component = "div", ...props }: any) => {
  return <Component className={className} {...props}>{children}</Component>;
};

const VerticalCutReveal = ({ children, className, ...props }: any) => {
  return <div className={className} {...props}>{children}</div>;
};
import { cn } from "../lib/utils";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { apiClient } from "../api/client";

import {
  Check, X, Crown, Webhook, BarChart2, ArrowRight
} from "lucide-react";

// ─── DATA ──────────────────────────────────────────────────
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

// ─── SWITCH COMPONENT ──────────────────────────────────────
const PricingSwitch = ({ isYearly, onSwitch }: { isYearly: boolean, onSwitch: (val: boolean) => void }) => {
  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-full bg-black/60 backdrop-blur-xl border border-[var(--border-base)] p-1.5 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
        <button
          onClick={() => onSwitch(false)}
          className={cn(
            "relative z-10 w-fit h-10 rounded-full px-8 py-2 font-black tracking-widest uppercase transition-colors text-xs",
            !isYearly ? "text-[var(--text-main)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
          )}
        >
          {!isYearly && (
            <motion.span
              layoutId="pricing-switch"
              className="absolute inset-0 rounded-full bg-white/10 border border-white/20 shadow-md backdrop-blur-md"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly</span>
        </button>

        <button
          onClick={() => onSwitch(true)}
          className={cn(
            "relative z-10 w-fit h-10 flex-shrink-0 rounded-full px-8 py-2 font-black tracking-widest uppercase transition-colors text-xs",
            isYearly ? "text-[var(--text-main)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
          )}
        >
          {isYearly && (
            <motion.span
              layoutId="pricing-switch"
              className="absolute inset-0 rounded-full bg-white/10 border border-white/20 shadow-md backdrop-blur-md"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">Yearly</span>
        </button>
      </div>
    </div>
  );
};

// ─── MAIN PRICING PAGE ─────────────────────────────────────
export default function Pricing({ onAuthOpen }: { onAuthOpen?: () => void }) {
  const { t } = useTranslation();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  
  const { plan: currentPlan, user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      if (onAuthOpen) onAuthOpen();
      return;
    }
    
    try {
      setLoadingPlan(planId);
      const { data } = await apiClient.post('/stripe/create-checkout-session', {
        plan: planId,
        billing: isYearly ? 'yearly' : 'monthly'
      });
      
      if (data && data.url) {
        if (Capacitor.isNativePlatform()) {
          await Browser.open({ url: data.url });
        } else {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      console.error("Stripe error:", err);
      alert("Failed to start checkout process. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" },
    }),
    hidden: { filter: "blur(10px)", y: -20, opacity: 0 },
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] overflow-x-hidden pt-24 pb-32" ref={pricingRef}>
      
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40"><div className="w-[800px] h-[300px] bg-[var(--accent)] blur-[150px] rounded-[100%] opacity-30 absolute -top-[100px] left-[10%]"></div><div className="w-[600px] h-[250px] bg-[var(--accent-hover)] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div></div>

      {/* Background & Particles */}
      <TimelineContent
        animationNum={0}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute top-0 h-[600px] w-screen overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] pointer-events-none z-10"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:80px_80px]"></div>
        <SparklesComp
          density={1200}
          direction="bottom"
          speed={0.5}
          color="#8350e8"
          className="absolute inset-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </TimelineContent>

      <div className="max-w-[1200px] mx-auto px-6 relative z-20">
        
        {/* Header Section */}
        <article className="text-center mb-16 pt-16 max-w-2xl mx-auto space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-[var(--text-main)] tracking-tight drop-shadow-xl">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.1}
              staggerFrom="first"
              reverse={true}
              containerClassName="justify-center"
              transition={{ type: "spring", stiffness: 250, damping: 40 }}
            >
              Unlock CryptoNeko Pro
            </VerticalCutReveal>
          </h1>
          
          <TimelineContent as="p" animationNum={1} timelineRef={pricingRef} customVariants={revealVariants} className="text-[var(--text-muted)] text-lg md:text-xl font-medium drop-shadow-sm">
            Join the top 1% of traders with algorithmic signals, portfolio insights, and zero-delay execution.
          </TimelineContent>

          <TimelineContent as="div" animationNum={2} timelineRef={pricingRef} customVariants={revealVariants} className="pt-8">
            <PricingSwitch isYearly={isYearly} onSwitch={setIsYearly} />
          </TimelineContent>
        </article>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-32 relative z-30">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.price.yearly : plan.price.monthly;
            const isPrimary = plan.ctaVariant === "primary";

            return (
              <TimelineContent key={plan.id} as="div" animationNum={3 + index} timelineRef={pricingRef} customVariants={revealVariants}>
                <div className={cn(
                  "relative overflow-hidden rounded-[2.5rem] bg-[var(--bg-subtle)]/80 backdrop-blur-xl border p-8 flex flex-col h-full group transition-all duration-700",
                  isPrimary ? "border-[var(--accent)] shadow-[0_0_80px_-20px_var(--accent)]" : "border-[var(--border-base)] hover:border-white/20 shadow-2xl hover:shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                )}>
                  {/* Subtle hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Badge */}
                  {plan.badge_key && (
                    <div className="absolute top-0 inset-x-0 mx-auto w-fit bg-[var(--accent)] text-[var(--text-main)] text-[10px] font-black uppercase tracking-widest px-6 py-1.5 rounded-b-2xl shadow-lg drop-shadow-md">
                      {t(`pricing.badge.${plan.badge_key}`)}
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="flex items-center gap-4 mb-8 mt-4">
                    <div className="w-14 h-14 rounded-[32px] flex items-center justify-center border shadow-inner" style={{ backgroundColor: `${plan.accent}15`, borderColor: `${plan.accent}30` }}>
                      <Icon size={26} style={{ color: plan.accent }} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black drop-shadow-sm">{t(`pricing.${plan.id}.name`)}</h3>
                      {currentPlan === plan.id && <div className="text-[11px] font-black uppercase tracking-widest text-green-400 mt-1 drop-shadow-sm">Current Plan</div>}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    {price === 0 ? (
                      <div className="text-6xl font-black tracking-tighter drop-shadow-md">Free</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-[var(--text-muted)] text-3xl font-bold">$</span>
                        <NumberFlow value={price} className="text-6xl font-black font-mono tracking-tighter drop-shadow-md" />
                        <span className="text-[var(--text-muted)] text-sm font-bold ml-1 tracking-widest uppercase">/ mo</span>
                      </div>
                    )}
                    <div className="h-6 mt-3">
                      {isYearly && price > 0 && (
                        <span className="text-green-400 text-xs font-black uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-4 py-1.5 rounded-full shadow-sm">
                          Save ${(plan.price.monthly - price) * 12} a year
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-muted)] font-medium mb-10 leading-relaxed flex-1">
                    {t(`pricing.${plan.id}.desc`)}
                  </p>

                  {/* CTA Button */}
                  <button
                    disabled={currentPlan === plan.id || loadingPlan === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                    className={cn(
                      "w-full py-4 rounded-[32px] font-black text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 mb-10",
                      currentPlan === plan.id ? "bg-white/5 text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-base)]" :
                      isPrimary ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-main)] shadow-[0_0_30px_-10px_var(--accent)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:scale-[1.02]" :
                      "bg-white text-black hover:bg-gray-200 hover:scale-[1.02] shadow-[0_0_20px_var(--accent)]"
                    )}
                  >
                    {loadingPlan === plan.id ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : currentPlan === plan.id ? "Active" : "Upgrade Now"}
                    {currentPlan !== plan.id && loadingPlan !== plan.id && <ArrowRight size={16} />}
                  </button>

                  {/* Features List */}
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-base)] pb-3">Includes</div>
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        {f.included ? (
                          <Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5 drop-shadow-sm" />
                        ) : (
                          <X size={16} className="text-gray-600 shrink-0 mt-0.5" />
                        )}
                        <span className={cn("text-sm font-medium", f.included ? "text-gray-200" : "text-gray-600")}>
                          {t(`pricing.features.${f.key}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TimelineContent>
            );
          })}
        </div>

        {/* Comparison Matrix */}
        <TimelineContent as="div" animationNum={6} timelineRef={pricingRef} customVariants={revealVariants}>
          <ComparisonMatrix />
        </TimelineContent>

      </div>
    </div>
  );
}

// ─── MATRIX COMPONENT ──────────────────────────────────────
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

  const renderVal = (val: string, isPro?: boolean, isTeams?: boolean) => {
    if (val === "Check") return <Check size={18} className={isPro ? "text-[var(--accent)]" : isTeams ? "text-purple-400" : "text-green-400"} />;
    if (val === "X") return <X size={18} className="text-gray-600" />;
    return <span className="text-xs font-black tracking-widest uppercase text-gray-300">{val}</span>;
  };

  return (
    <div className="bg-[var(--bg-subtle)]/80 backdrop-blur-xl border border-[var(--border-base)] rounded-[2.5rem] overflow-hidden shadow-2xl">
      <div className="p-10 border-b border-[var(--border-base)] text-center bg-black/20">
        <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight drop-shadow-md">{t("pricing.matrix.title")}</h3>
        <p className="text-[var(--text-muted)] text-sm mt-3 font-medium">Detailed feature breakdown</p>
      </div>
      
      <div className="grid grid-cols-[3fr_1fr_1fr_1fr] p-6 border-b border-[var(--border-base)] bg-black/40 text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
        <div>Feature</div>
        <div className="text-center">Free</div>
        <div className="text-center text-[var(--accent)]">Pro</div>
        <div className="text-center text-purple-400">Teams</div>
      </div>

      {categories.map((cat, catIdx) => (
        <div key={catIdx}>
          <div className="bg-white/[0.02] px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-base)]">
            {cat.title}
          </div>
          {cat.items.map((item, itemIdx) => (
            <div key={itemIdx} className="grid grid-cols-[3fr_1fr_1fr_1fr] px-8 py-5 border-b border-[var(--border-base)] text-sm items-center hover:bg-white/[0.03] transition-colors">
              <div className="text-gray-300 font-bold">{item.name}</div>
              <div className="flex justify-center">{renderVal(item.free)}</div>
              <div className="flex justify-center">{renderVal(item.pro, true)}</div>
              <div className="flex justify-center">{renderVal(item.teams, false, true)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}



