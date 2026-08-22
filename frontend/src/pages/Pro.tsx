import React, { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Cpu, Palette, Cloud, Terminal, Search, MessageSquare, Zap, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";

const BackgroundGlows = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--accent)]/10 blur-[120px] mix-blend-screen" />
    <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#8B5CF6]/10 blur-[100px] mix-blend-screen" />
    <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px] mix-blend-screen" />
  </div>
);

const BentoCard = ({ icon: Icon, title, desc, delay = 0 }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.04] overflow-hidden hover:bg-white/[0.04] transition-colors duration-500"
    >
      <div className="absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="relative z-10 flex flex-col items-start">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.05] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[var(--accent)]/10 transition-all duration-500">
          <Icon size={22} className="text-white/90 group-hover:text-[var(--accent)] transition-colors duration-500" />
        </div>
        <h3 className="text-[19px] font-semibold text-white mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-[15px] text-white/50 leading-relaxed">
          {desc}
        </p>
      </div>
    </motion.div>
  );
};

const HeroMockup = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);

  return (
    <div ref={containerRef} className="relative w-full max-w-[800px] mx-auto mt-24 mb-12 perspective-[1000px]">
      <motion.div 
        style={{ y, scale }}
        className="relative z-10 rounded-[24px] border border-white/[0.08] bg-black/60 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden"
      >
        <div className="flex items-center gap-4 px-6 py-5 border-b border-white/[0.06]">
          <Search size={22} className="text-white/40" />
          <div className="flex-1 text-[22px] font-normal text-white/90 tracking-tight">
            Analyze BTC trends...
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.08] text-white/60 text-[12px]">
            <kbd className="font-sans">⌘</kbd> <kbd className="font-sans">K</kbd>
          </div>
        </div>

        <div className="flex flex-col gap-1 p-3">
          <div className="px-3 pt-2 pb-1 text-[12px] font-medium text-white/30 uppercase tracking-widest">
            AI Commands
          </div>
          
          <div className="flex items-center gap-4 p-3 rounded-[12px] bg-white/[0.06] border border-white/[0.02]">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="text-[15px] font-medium text-white">Analyze BTC Technicals</div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[13px] text-[var(--accent)] font-medium">Pro</span>
              <kbd className="px-1.5 py-0.5 rounded text-[12px] bg-white/10 text-white/60 min-w-[20px] text-center font-sans">↵</kbd>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-[12px] hover:bg-white/[0.04] transition-colors cursor-pointer">
            <div className="p-1.5 rounded-lg bg-white/10">
              <MessageSquare size={16} className="text-white/80" />
            </div>
            <div className="text-[15px] font-medium text-white/60">Summarize Market Sentiment</div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-[12px] hover:bg-white/[0.04] transition-colors cursor-pointer">
            <div className="p-1.5 rounded-lg bg-white/10">
              <Zap size={16} className="text-white/80" />
            </div>
            <div className="text-[15px] font-medium text-white/60">Check Whale Alert Anomalies</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function Pro() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#020817] text-white selection:bg-[var(--accent)]/30 font-sans overflow-x-hidden">
      <BackgroundGlows />
      
      <div className="relative z-10 max-w-[1000px] mx-auto px-6">
        
        {/* HERO SECTION */}
        <div className="pt-40 pb-24 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] mb-8 backdrop-blur-md"
          >
            <Sparkles size={14} className="text-[var(--accent)]" />
            <span className="text-[13px] font-medium text-white/90 tracking-wide">
              {t("pro_page.badge") || "Introducing CryptoNeko Pro"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[56px] md:text-[80px] font-bold tracking-tight leading-[1.05] mb-6 max-w-[900px]"
          >
            Unlock a new level of
            <br />
            <span className="bg-gradient-to-b from-white to-white/40 text-transparent bg-clip-text">
              crypto intelligence.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-[21px] text-white/50 max-w-[580px] mx-auto mb-12 leading-relaxed tracking-tight font-normal"
          >
            {t("pro_page.hero_desc") || "Supercharge your workflow with predictive AI, custom themes, and lightning-fast real-time data integrations."}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4"
          >
            <button
              onClick={() => navigate("/pricing")}
              className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black font-semibold text-[15px] hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_-8px_rgba(255,255,255,0.4)]"
            >
              Get Pro <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="px-7 py-3.5 rounded-full bg-white/[0.03] text-white font-medium text-[15px] border border-white/10 hover:bg-white/[0.08] transition-colors"
            >
              View Pricing
            </button>
          </motion.div>
        </div>

        {/* HERO MOCKUP */}
        <HeroMockup />

        {/* BENTO GRID FEATURES */}
        <div className="mt-[200px]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-20"
          >
            <h2 className="text-[44px] font-bold tracking-tight mb-4">
              Everything you need.
            </h2>
            <p className="text-[20px] text-white/40">
              Powerful features engineered for professional traders.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
            <BentoCard
              icon={Cpu}
              title={t("pro_page.feature_ai_title") || "Advanced AI"}
              desc={t("pro_page.feature_ai_desc") || "Access advanced trading models and deep sentiment analysis right from the command bar."}
              delay={0}
            />
            <BentoCard
              icon={Palette}
              title={t("pro_page.themes_title") || "Custom Themes"}
              desc={t("pro_page.themes_subtitle") || "Make it yours with custom color palettes, specific to your trading environment."}
              delay={0.1}
            />
            <BentoCard
              icon={Cloud}
              title="Cloud Sync"
              desc="Seamlessly sync your portfolios, alerts, and settings across all your devices securely."
              delay={0.2}
            />
            <BentoCard
              icon={Terminal}
              title="Unlimited APIs"
              desc="Connect to unlimited exchange APIs with zero rate limits on our platform."
              delay={0.3}
            />
          </div>
        </div>

        {/* BOTTOM CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-[200px] mb-20 text-center px-10 py-[100px] rounded-[32px] bg-gradient-to-b from-white/[0.02] to-transparent border-t border-white/[0.04] overflow-hidden"
        >
          {/* Subtle glow in CTA */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_70%)] blur-[60px] pointer-events-none" />
          
          <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-gradient-to-b from-[#282828] to-[#141414] border border-white/[0.08] flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
             <Lock size={28} className="text-white/90" />
          </div>

          <h2 className="text-[40px] font-bold tracking-tight mb-4">
            Ready to become a Pro?
          </h2>
          <p className="text-[18px] text-white/40 max-w-[500px] mx-auto mb-10">
            Join thousands of traders leveraging our tools.
          </p>
          <button
            onClick={() => navigate("/pricing")}
            className="px-8 py-3.5 rounded-full bg-white text-black font-semibold text-[15px] hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_-8px_rgba(255,255,255,0.4)]"
          >
            Start Your Free Trial
          </button>
        </motion.div>

      </div>
    </div>
  );
}
