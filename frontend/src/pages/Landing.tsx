import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

// Linear Components
import { LinearHero } from "../components/landing/LinearHero";
import { LinearBento } from "../components/landing/LinearBento";
import { LinearSpeed } from "../components/landing/LinearSpeed";
import { LinearFooter } from "../components/landing/LinearFooter";
import AnimatedLogo from "../components/layout/AnimatedLogo";

export default function Landing({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0.5, 0.8]);
  const headerBorder = useTransform(scrollYProgress, [0, 0.1], ["rgba(255,255,255,0)", "rgba(255,255,255,0.05)"]);
  const headerBg = useTransform(scrollYProgress, [0, 0.1], ["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] selection:bg-white/20 selection:text-[var(--text-main)] font-sans overflow-x-hidden relative">
      
      {/* 🔴 BACKGROUND NOISE & GRAIN 🔴 */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
      
      {/* 🔴 HEADER 🔴 */}
      <motion.header 
        style={{ opacity: headerOpacity, backdropFilter: `blur(20px)`, borderBottom: "1px solid", borderBottomColor: headerBorder, backgroundColor: headerBg }}
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between transition-all duration-300"
      >
        <AnimatedLogo />
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Terminal</Link>
          <Link to="/analysis/ai" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">AI Radar</Link>
          <Link to="/pro" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Backtesting</Link>
          
          {loading ? null : user ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-[12px] bg-white/[0.03] border border-[var(--border-subtle)] text-[var(--text-main)] font-medium text-sm hover:bg-white/[0.06] hover:border-[var(--border-base)] transition-colors"
            >
              Enter App
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (onAuthOpen) onAuthOpen("login");
              }}
              className="px-5 py-2.5 rounded-[12px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors shadow-lg shadow-[var(--accent-border)]"
            >
              Sign In
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* 🔴 LINEAR MODULAR SECTIONS 🔴 */}
      <LinearHero onAuthOpen={onAuthOpen} />
      <LinearBento />
      <LinearSpeed />
      <LinearFooter onAuthOpen={onAuthOpen} />

    </div>
  );
}
