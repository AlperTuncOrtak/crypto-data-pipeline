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
import { PricingSection } from '../components/ui/pricing';

import PromoCodeModal from '../components/ui/PromoCodeModal';

export default function Pricing({ onAuthOpen }: { onAuthOpen?: () => void }) {
  const { user, profile } = useAuth();
  const currentPlan = profile?.plan || 'free';
  const { t } = useTranslation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  
  const handleSubscribe = async (planId: string, isMonthly: boolean) => {
    if (!user) {
      if (onAuthOpen) onAuthOpen();
      return;
    }
    try {
      setLoadingPlan(planId);
      const { data } = await apiClient.post('/stripe/create-checkout-session', {
        plan: planId,
        billing: isMonthly ? 'monthly' : 'yearly'
      });
      if (data && data.url) {
        if (Capacitor.isNativePlatform()) {
          await Browser.open({ url: data.url });
        } else {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      console.error('Stripe error:', err);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const pricingPlans = PLANS.map((p) => ({
    name: p.id === 'free' ? 'Free' : p.id === 'pro' ? 'Pro' : 'Teams',
    price: p.price.monthly.toString(),
    yearlyPrice: p.price.yearly.toString(),
    period: 'month',
    features: p.features.filter(f => f.included).map(f => t(`pricing.features.${f.key}`)),
    description: p.id === 'free' ? 'Essential crypto tracking' : p.id === 'pro' ? 'Advanced AI tools & unlimited access' : 'For professional teams',
    buttonText: currentPlan === p.id ? 'Current Plan' : loadingPlan === p.id ? 'Loading...' : p.price.monthly === 0 ? 'Get Started' : 'Subscribe',
    href: '#',
    isPopular: p.badge_key === 'most_popular',
    onClick: (isMonthly: boolean) => {
      if (currentPlan === p.id) return;
      if (p.price.monthly === 0) return; // Free plan
      handleSubscribe(p.id, isMonthly);
    }
  }));

  return (
    <div className="relative min-h-[100dvh] bg-[var(--bg-base)] text-[var(--text-main)] overflow-x-hidden pt-24 pb-32">
      <PricingSection plans={pricingPlans} title="Find the Perfect Plan" description="Select the ideal package for your needs and start building today." />
      
      <div className="mt-12 flex justify-center">
        <button
          onClick={() => {
            if (!user) {
              if (onAuthOpen) onAuthOpen();
              return;
            }
            setIsPromoOpen(true);
          }}
          className="text-[var(--text-muted)] hover:text-[var(--text-main)] underline text-sm transition-colors"
        >
          Have a Promo Code or Free Trial?
        </button>
      </div>

      <PromoCodeModal isOpen={isPromoOpen} onClose={() => setIsPromoOpen(false)} />
    </div>
  );
}
