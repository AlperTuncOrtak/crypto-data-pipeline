import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

// Linear Components
import { LinearHero } from "../components/landing/LinearHero";
import { LinearBento } from "../components/landing/LinearBento";
import { LinearSpeed } from "../components/landing/LinearSpeed";
import { LinearFooter } from "../components/landing/LinearFooter";

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
        style={{ opacity: headerOpacity, backdropFilter: `blur(20px)`, borderBottomColor: headerBorder, backgroundColor: headerBg }}
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between border-b transition-all duration-300"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ opacity: 0.8 }} 
            className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center text-[#000000] font-black text-sm shadow-sm transition-opacity"
          >
            C
          </motion.div>
          <span className="text-lg font-semibold tracking-tight text-white/90 group-hover:text-[var(--text-main)] transition-colors">
            CryptoNeko
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/pro" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Features</Link>
          <Link to="/pricing" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Pricing</Link>
          {loading ? null : user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-2xl bg-white/5 border border-[var(--border-base)] text-[var(--text-main)] font-medium text-sm hover:bg-[var(--border-base)] transition-colors backdrop-blur-md"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => {
                if (onAuthOpen) onAuthOpen("login");
              }}
              className="px-4 py-2 rounded-2xl bg-white text-[#000000] font-medium text-sm hover:bg-white/90 transition-colors"
            >
              Sign In
            </button>
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
