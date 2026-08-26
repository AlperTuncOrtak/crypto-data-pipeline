import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMarket } from "../hooks/useMarket";
import { LinearHero } from "../components/landing/LinearHero";
import { LinearBento } from "../components/landing/LinearBento";
import { LinearSpeed } from "../components/landing/LinearSpeed";
import { LinearFooter } from "../components/landing/LinearFooter";
import AnimatedLogo from "../components/layout/AnimatedLogo";

const NAV_LINKS = [
  { label: "About",     to: "#hero" },
  { label: "Features",  to: "#features" },
  { label: "Pricing",   to: "/pricing" },
  { label: "Contact",   to: "#footer" },
  { label: "Blog",      to: "#" },
];

export default function Landing({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: coins } = useMarket(5);

  const { scrollYProgress } = useScroll();

  return (
    <div className="min-h-screen bg-[#020204] text-[var(--text-main)] font-sans overflow-x-hidden relative selection:bg-[var(--accent)] selection:text-white">
      
      {/* Global noise */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />

      {/* SAAS NAVBAR */}
      <div className="absolute top-0 left-0 right-0 z-50 px-6 md:px-12 py-6 pointer-events-auto flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
          <AnimatedLogo />
        </div>

        {/* Middle: Links */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map(({ label, to }) => (
            <button
              key={label}
              onClick={() => {
                if (to.startsWith("#")) {
                  document.querySelector(to)?.scrollIntoView({ behavior: "smooth" });
                } else {
                  navigate(to);
                }
              }}
              className="text-[13px] font-medium text-white/60 hover:text-white transition-colors"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => { if (user) navigate("/dashboard"); else if (onAuthOpen) onAuthOpen("signup"); }}
            className="hidden md:flex items-center justify-center h-10 px-5 rounded-full border border-white/20 bg-transparent text-white hover:bg-white/10 font-medium text-[13px] transition-all backdrop-blur-sm"
          >
            Try for free
          </button>
          
          <button
            onClick={() => navigate("/docs")}
            className="flex items-center justify-center h-10 px-5 rounded-full bg-white text-black hover:bg-gray-200 font-bold text-[13px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            Get a demo
          </button>
        </div>
      </div>

      <section id="hero"><LinearHero onAuthOpen={onAuthOpen} /></section>
      <section id="features"><LinearBento /></section>
      <section id="speed"><LinearSpeed /></section>
      <LinearFooter onAuthOpen={onAuthOpen} />

    </div>
  );
}
