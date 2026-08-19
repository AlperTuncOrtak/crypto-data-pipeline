import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

// Linear Components
import { LinearHero } from "../components/landing/LinearHero";
import { LinearBento } from "../components/landing/LinearBento";
import { LinearSpeed } from "../components/landing/LinearSpeed";
import { LinearFooter } from "../components/landing/LinearFooter";
import AnimatedLogo from "../components/layout/AnimatedLogo";
import { HeroSection } from "../components/blocks/hero-section-1";

export default function Landing({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0.5, 0.8]);
  const headerBorder = useTransform(scrollYProgress, [0, 0.1], ["rgba(255,255,255,0)", "rgba(255,255,255,0.05)"]);
  const headerBg = useTransform(scrollYProgress, [0, 0.1], ["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] selection:bg-white/20 selection:text-[var(--text-main)] font-sans overflow-x-hidden relative">
      <HeroSection />
      
      {/* 🔴 BACKGROUND NOISE & GRAIN 🔴 */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
      
      {/* 🔴 ETHENA-STYLE CAPSULE NAVBAR 🔴 */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 px-4 transition-all duration-300 pointer-events-none"
        style={{ opacity: headerOpacity }}
      >
        <div className="mx-auto max-w-7xl mt-4 flex items-center justify-between backdrop-blur-xl bg-[var(--bg-elevated)]/60 border border-white/5 rounded-full px-6 py-2.5 pointer-events-auto shadow-2xl">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <AnimatedLogo />
          </div>

          {/* Center: Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {['Terminal', 'Markets', 'Analytics', 'Docs', 'Ecosystem'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="relative px-4 py-2 text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors group"
              >
                {item}
                {/* Subtle hover glow/underline effect */}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[var(--accent)] rounded-t-full opacity-0 group-hover:w-3/4 group-hover:opacity-100 transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Right: Quick Badges & CTA */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Quick Badges (Hidden on small screens) */}
            <div className="hidden md:flex items-center gap-3 mr-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] animate-pulse" />
                <span className="text-[11px] font-mono font-medium text-[var(--text-main)]">$64.2K BTC</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)] animate-pulse" />
                <span className="text-[11px] font-mono font-medium text-[var(--text-main)]">14ms API</span>
              </div>
            </div>

            {loading ? null : user ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                className="px-5 py-2 rounded-full bg-white/[0.05] border border-white/10 text-[var(--text-main)] font-semibold text-[13px] hover:bg-white/[0.08] hover:border-white/20 transition-colors shadow-sm"
              >
                Enter Terminal
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (onAuthOpen) onAuthOpen("login");
                }}
                className="px-5 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-[13px] transition-colors shadow-[0_0_15px_rgba(99,102,241,0.25)]"
              >
                Launch App
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* 🔴 LINEAR MODULAR SECTIONS 🔴 */}
      <LinearHero onAuthOpen={onAuthOpen} />
      <LinearBento />
      <LinearSpeed />
      <LinearFooter onAuthOpen={onAuthOpen} />

    </div>
  );
}
