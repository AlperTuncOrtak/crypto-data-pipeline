import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

// Modüler Bileşenler
import { Hero } from "../components/landing/Hero";
import { Stats } from "../components/landing/Stats";
import { BentoGrid } from "../components/landing/BentoGrid";
import { FeaturesZigZag } from "../components/landing/FeaturesZigZag";
import { Testimonials } from "../components/landing/Testimonials";
import { FAQ } from "../components/landing/FAQ";
import { InfiniteMarquee } from "../components/landing/InfiniteMarquee";
import { CTA } from "../components/landing/CTA";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0.5, 0.8]);

  return (
    <div className="min-h-screen bg-[#020817] text-white selection:bg-cyan-500/40 selection:text-white font-sans overflow-x-hidden relative">
      
      {/* ── BACKGROUND NOISE & GRAIN ── */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      
      {/* ── BACKGROUND DEEP SPACE GLOWS ── */}
      <div className="fixed top-0 left-0 right-0 h-[800px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-30">
        <div className="w-[1000px] h-[400px] bg-cyan-600/30 blur-[150px] rounded-[100%] absolute -top-[150px] left-[0%]"></div>
        <div className="w-[800px] h-[300px] bg-blue-700/20 blur-[150px] rounded-[100%] absolute top-[50px] right-[5%]"></div>
      </div>

      {/* ── HEADER ── */}
      <motion.header 
        style={{ opacity: headerOpacity, backdropFilter: `blur(20px)` }}
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between border-b border-white/[0.05] bg-[#020817]/60 transition-all duration-300"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ rotate: 180, scale: 1.1 }} 
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[#020817] font-black text-xl shadow-[0_0_20px_rgba(34,211,238,0.4)]"
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
              className="px-5 py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-white font-bold text-sm hover:bg-white/10 active:scale-95 transition-all backdrop-blur-md"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-full bg-cyan-400 text-[#020817] font-bold text-sm hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 transition-all"
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
      <BentoGrid />
      <FeaturesZigZag />
      <Testimonials />
      <FAQ />
      <CTA />

    </div>
  );
}
