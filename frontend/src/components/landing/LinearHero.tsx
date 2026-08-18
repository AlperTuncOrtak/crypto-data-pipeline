import { motion, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function LinearHero({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={heroRef}
      className="relative z-10 pt-44 pb-28 flex flex-col items-center justify-center min-h-[90vh] overflow-hidden bg-[var(--bg-base)]"
    >
      {/* Glass Card Container */}
      <div className="relative z-20 flex flex-col items-center text-center max-w-[860px] mx-auto px-6">
        {/* Glass Card - Following Design System Specs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col items-center text-center bg-[var(--bg-elevated)]/80 backdrop-blur-md rounded-lg border border-[var(--border-base)]/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] p-lg"
        >
          {/* Terminal Status Badge - Following Glass Border Rule */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] border border-[var(--border-base)]/30 bg-[var(--bg-elevated)]/60 mb-10"
          >
            <span className="relative flex h-1.5 w-1.5">
              {/* Subtle cinematic pulse - using cyan glow at 10% opacity */}
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-glow)]/10" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--positive)]" />
            </span>
            <span className="text-[10px] tracking-[0.2em] font-bold text-[var(--text-muted)] font-mono uppercase">
              Sys: Active <span className="opacity-40 px-1.5">//</span> Build v2.4.92
            </span>
          </motion.div>

          {/* Headline - Using Display Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="text-[clamp(2rem,5vw,4rem)] font-black tracking-tighter leading-[1.03] text-[var(--text-main)] mb-7"
          >
            Algorithmic Crypto <br className="hidden md:block" />
            <span className="text-[var(--text-main)] relative">
              Analytics.
              {/* Following Background Glow Rule - subtle accent glow */}
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--accent-glow)]/15" />
            </span>
          </motion.h1>

          {/* Copywriting - Using Body Typography */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="text-[1rem] text-[var(--text-muted)] leading-relaxed max-w-[540px] mx-auto mb-12 tracking-tight"
          >
            Institutional-grade execution, AI anomaly detection, and tick-level backtesting. The terminal built for the absolute frontier.
          </motion.p>

          {/* CTAs - Following Button Specs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (user) navigate("/dashboard");
                else if (onAuthOpen) onAuthOpen("login");
              }}
              className="group flex items-center justify-between gap-6 h-12 pl-5 pr-2 rounded-full bg-[var(--primary)] text-[var(--text-primary)] font-medium text-[14px] transition-all duration-200 hover:bg-[var(--accent-hover)] transform hover:-translate-y-[2px] shadow-[0_0_24px_rgba(59,130,246,0.2)]"
            >
              <span>Launch Terminal</span>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-base)]/20 text-[var(--text-primary)] opacity-90 group-hover:opacity-100 transition-opacity">
                <span className="text-[14px] leading-none mb-0.5">↵</span>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/docs")}
              className="group flex items-center gap-3 h-12 px-6 rounded-full border border-[var(--border-base)]/30 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/30 font-medium text-[14px] transition-all duration-200 hover:-translate-y-[2px]"
            >
              <Terminal size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
              <span>Read Docs</span>
            </motion.button>
          </motion.div>

          {/* Subtle ambient animation - floating particles following cinematic theme */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-[-1] opacity-10"
            style={{
              backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22><foreignObject width=%22100%22 height=%22100%22><div style=%22background: repeating-radial-gradient(circle at 50% 50%, transparent 0%, transparent 1px, rgba(99, 102, 241, 0.03) 1px, rgba(99, 102, 241, 0.03) 2px; width: 100%; height: 100%; %22></div></foreignObject></svg>')"
            }}
          >
            {/* Animated floating elements */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)"
              }}
            >
              <motion.span
                className="absolute"
                style={{
                  width: "4px",
                  height: "4px",
                  background: "rgba(99, 102, 241, 0.15)",
                  borderRadius: "50%",
                  left: "20%",
                  top: "30%"
                }}
              >
                <motion.animate
                  attributes={{
                    cx: [20, 25, 20, 15, 20],
                    cy: [30, 35, 30, 25, 30]
                  }}
                  easing="ease-in-out"
                  duration={6}
                  repeatCount="indefinite"
                >
                  <motion.animateTransform
                    type="translate"
                    from="0,0"
                    to="10,10"
                    duration="3"
                    repeatCount="indefinite"
                  />
                </motion.animate>
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}