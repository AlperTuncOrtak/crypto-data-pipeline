import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

// Modüler Bileşenler
import { Hero } from "../components/landing/Hero";
import { Stats } from "../components/landing/Stats";
import { NansenBentoGrid } from "../components/landing/NansenBentoGrid";
import { Testimonials } from "../components/landing/Testimonials";
import { FAQ } from "../components/landing/FAQ";
import { InfiniteMarquee } from "../components/landing/InfiniteMarquee";
import { CTA } from "../components/landing/CTA";
import { PremiumFooter } from "../components/landing/PremiumFooter";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0.8, 1]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.1], ["blur(0px)", "blur(20px)"]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#00d084]/40 selection:text-white font-sans overflow-x-hidden relative">
      
      {/* ── BACKGROUND NOISE & GRAIN ── */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
      
      {/* ── HEADER ── */}
      <motion.header 
        style={{ opacity: headerOpacity, backdropFilter: headerBlur }}
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between border-b border-white/[0.05] bg-[#050505]/70 transition-all duration-300"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#050505] font-black text-lg shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            C
          </motion.div>
          <span className="text-xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">
            CryptoNeko
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/pro" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Pro</Link>
          <Link to="/pricing" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Pricing</Link>
          {loading ? null : user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white font-bold text-sm hover:bg-white/10 active:scale-95 transition-all backdrop-blur-md"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 rounded-lg bg-white text-[#050505] font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </motion.header>

      {/* ── MODULAR SECTIONS ── */}
      <Hero />
      <InfiniteMarquee />
      <Stats />
      <NansenBentoGrid />

      <Testimonials />
      <FAQ />
      <CTA />
      <PremiumFooter />

    </div>
  );
}

