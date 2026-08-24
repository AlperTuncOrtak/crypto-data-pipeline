import React, { useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import AnimatedLogo from "../components/layout/AnimatedLogo";
import { ArrowRight, Activity, Cpu, Copy, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Landing({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const opacityBg = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);
  const yHero = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-[200vh] bg-[#020817] text-white font-sans selection:bg-[var(--accent)]/30 overflow-x-hidden relative">
      
      {/* BACKGROUND NOISE & GRADIENT */}
      <motion.div 
        style={{ opacity: opacityBg }}
        className="fixed inset-0 pointer-events-none z-0"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--accent)]/10 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#8B5CF6]/10 blur-[120px] mix-blend-screen" />
      </motion.div>

      {/* NAVBAR */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between backdrop-blur-md bg-[#020817]/40 border-b border-white/5">
        <AnimatedLogo />
        <div className="flex items-center gap-4">
          {loading ? null : user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-[14px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Enter Terminal
            </button>
          ) : (
            <button
              onClick={() => onAuthOpen && onAuthOpen("login")}
              className="px-6 py-2.5 rounded-full bg-[var(--accent)] text-white font-semibold text-[14px] hover:bg-[var(--accent-hover)] hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
            >
              Launch App
            </button>
          )}
        </div>
      </div>

      {/* HERO SECTION */}
      <motion.section 
        style={{ y: yHero, opacity: opacityHero }}
        className="relative z-10 flex flex-col items-center justify-center min-h-[95vh] px-6 text-center pt-20"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-[12px] font-medium text-[var(--accent)] tracking-wide uppercase">New: Copy Trading Live</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[48px] sm:text-[64px] lg:text-[80px] font-black tracking-tight leading-[1.05] max-w-[1000px] mb-6"
        >
          Crypto Intelligence, <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-white to-white/40 text-transparent bg-clip-text">Engineered for Alpha.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[18px] sm:text-[21px] text-white/50 max-w-[700px] mb-12 leading-relaxed"
        >
          Seamlessly execute DEX swaps, track whale anomalies, auto-rebalance portfolios with AI, and copy trade top performers in a single sleek terminal.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => user ? navigate("/dashboard") : onAuthOpen && onAuthOpen("signup")}
            className="group flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--accent)] text-white font-bold text-[15px] hover:scale-105 transition-all shadow-[0_8px_30px_rgba(99,102,241,0.4)]"
          >
            Start Trading <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </motion.section>

      {/* SHOWCASE SECTION (THE NEKO & FEATURES) */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 py-32 flex flex-col items-center">
        
        {/* The Cyberpunk Neko Image */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[900px] rounded-[32px] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] mb-32 group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent z-10 opacity-60" />
          <motion.img 
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="/neko.jpg" 
            alt="CryptoNeko Cyberpunk Cat" 
            className="w-full h-auto object-cover relative z-0"
          />
          <div className="absolute bottom-8 left-8 z-20">
            <h3 className="text-3xl font-bold tracking-tight mb-2">Luck meets Logic.</h3>
            <p className="text-white/60 text-lg max-w-[400px]">The next evolution of crypto trading algorithms.</p>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[1000px]">
          
          <FeatureCard 
            icon={Activity} 
            title="Whale X-Ray & Signals"
            desc="Detect massive on-chain transfers and volume spikes in real-time. Uncover market manipulation before it hits the charts."
            delay={0}
          />
          <FeatureCard 
            icon={Copy} 
            title="Copy Trading System"
            desc="Subscribe to elite trading bots and massive wallets. Our smart contracts mirror their trades securely with your chosen budget."
            delay={0.1}
          />
          <FeatureCard 
            icon={RefreshCw} 
            title="AI Portfolio Rebalancing"
            desc="One-click intelligent diversification. Our AI analyzes market sentiment and auto-readjusts your assets for optimal risk/reward."
            delay={0.2}
          />
          <FeatureCard 
            icon={Zap} 
            title="Zero-Lag DEX Swaps"
            desc="Execute instant cross-chain swaps powered by 0x protocol. Lightning-fast routing with intelligent MEV protection built-in."
            delay={0.3}
          />

        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 px-6 py-[150px] text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[800px] p-16 rounded-[40px] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.05]"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Stop guessing. <br />Start knowing.</h2>
          <p className="text-xl text-white/40 mb-10">Join thousands of professional traders on the frontier.</p>
          <button
            onClick={() => user ? navigate("/dashboard") : onAuthOpen && onAuthOpen("signup")}
            className="px-8 py-4 rounded-full bg-white text-black font-bold text-[16px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_-8px_rgba(255,255,255,0.4)]"
          >
            Create Free Account
          </button>
        </motion.div>
      </section>

      {/* SIMPLE FOOTER */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center text-sm text-white/30">
        &copy; {new Date().getFullYear()} CryptoNeko Analytics. Built for the future of decentralized finance.
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors group"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[var(--accent)]/20 transition-all duration-500">
        <Icon size={24} className="text-white/80 group-hover:text-[var(--accent)] transition-colors duration-500" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-white/50 leading-relaxed text-[15px]">{desc}</p>
    </motion.div>
  );
}
