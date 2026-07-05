import { useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface CTABannerProps {
  isLoggedIn: boolean;
}

export default function CTABanner({ isLoggedIn }: CTABannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const navigate = useNavigate();

  return (
    <section className="relative z-10 px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl px-10 py-16 text-center shadow-[0_0_80px_rgba(34,211,238,0.06),inset_0_0_60px_rgba(34,211,238,0.02)]"
      >
        {/* Glow orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-cyan-500/[0.07] blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/[0.05] blur-[60px] rounded-full pointer-events-none" />

        <p className="relative z-10 text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-4">
          Ready When You Are
        </p>

        <h2 className="relative z-10 text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-5">
          Put your alpha on a new
          <br />
          trajectory
        </h2>

        <p className="relative z-10 text-slate-400 text-base max-w-md mx-auto leading-relaxed mb-10">
          Launch in minutes. No credit card. Cancel anytime. Join thousands of
          traders compounding edge with CryptoNeko.
        </p>

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(isLoggedIn ? "/dashboard" : "/login")}
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-cyan-400 text-[#020817] font-bold text-[0.95rem] hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(34,211,238,0.4)] cursor-pointer"
          >
            Start Free Right Now
            <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-white/10 bg-white/[0.04] text-white font-bold text-[0.95rem] hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm cursor-pointer"
          >
            View Plans
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="mt-16 pt-10 border-t border-white/[0.06]">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Brand */}
          <div className="max-w-[200px]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[#020817] font-black text-sm">
                N
              </div>
              <span className="font-bold text-white text-base">CryptoNeko</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              The AI-powered crypto terminal for serious traders.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-12">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-4">
                Product
              </p>
              <div className="flex flex-col gap-3">
                {["Dashboard", "Market", "Portfolio", "Alerts"].map((l) => (
                  <Link
                    key={l}
                    to={`/${l.toLowerCase()}`}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-4">
                Company
              </p>
              <div className="flex flex-col gap-3">
                {["Pro", "Pricing", "Blog", "Careers"].map((l) => (
                  <Link
                    key={l}
                    to={`/${l.toLowerCase()}`}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 mb-4">
                Legal
              </p>
              <div className="flex flex-col gap-3">
                {["Privacy", "Terms", "Security"].map((l) => (
                  <Link
                    key={l}
                    to={`/${l.toLowerCase()}`}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-12 text-xs text-slate-600 text-center">
          © 2026 CryptoNeko, Inc. — Built among the stars
        </p>
      </footer>
    </section>
  );
}
