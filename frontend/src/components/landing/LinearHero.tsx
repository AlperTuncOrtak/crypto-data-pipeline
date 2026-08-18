import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function LinearHero({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);

  return (
    <section
      className="relative z-10 pt-44 pb-28 flex flex-col items-center justify-center min-h-[90vh] overflow-hidden bg-[var(--bg-base)]"
    >
      {/* Dot Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-[-2]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect width=%2240%22 height=%2240%22 fill=%22var(--bg-base)%22/><path d=%22M20 0V40M0 20H40%22 stroke=%22var(--border-subtle)%22 stroke-width=%221%22/></svg>')",
            backgroundRepeat: "repeat",
            opacity: "0.05"
          }}
        ></div>
      </div>

      {/* Floating Animated Elements Background */}
      <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden flex justify-center items-center">
        {/* Abstract Glow 1 */}
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ y: y1 }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-[var(--accent)] rounded-full blur-[120px] opacity-20"
        />
        {/* Abstract Glow 2 */}
        <motion.div 
          animate={{ 
            y: [0, 30, 0],
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ y: y2 }}
          className="absolute bottom-1/4 right-1/4 w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-indigo-500 rounded-full blur-[100px] opacity-20"
        />
        
        {/* Floating UI Card 1 */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, -2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="hidden md:flex absolute top-[20%] left-[10%] xl:left-[15%] w-48 h-24 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl flex-col justify-center px-5 shadow-2xl"
        >
          <div className="text-xs text-[var(--text-muted)] font-mono mb-1">BTC/USD</div>
          <div className="text-lg text-[var(--text-main)] font-bold font-mono tracking-tight">$64,231.00</div>
          <div className="text-xs text-[var(--positive)] font-mono mt-1">+2.41%</div>
        </motion.div>

        {/* Floating UI Card 2 */}
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="hidden md:flex absolute bottom-[25%] right-[8%] xl:right-[15%] w-56 h-32 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl flex-col justify-center px-5 shadow-2xl"
        >
           <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--positive)] animate-pulse"></div>
              <div className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">Live Execution</div>
           </div>
           <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="h-full bg-[var(--accent)] rounded-full"
              />
           </div>
           <div className="flex justify-between mt-3 text-[10px] text-[var(--text-muted)] font-mono">
              <span>Latency</span>
              <span>12ms</span>
           </div>
        </motion.div>
      </div>

      {/* Hero Content */}
      <div className="flex flex-col items-center text-center max-w-[860px] mx-auto px-6 relative z-20">
        {/* Terminal Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0, ease: [0.32, 0.72, 0, 1] }}
          whileHover={{ scale: 1.05, y: -2 }}
          className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] mb-10 shadow-sm cursor-default"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--positive)] opacity-70" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--positive)]" />
          </span>
          <span className="text-[10px] tracking-[0.2em] font-bold text-[var(--text-muted)] font-mono uppercase">
            Sys: Active <span className="opacity-40 px-1.5">//</span> Build v2.4.92
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.08, ease: [0.32, 0.72, 0, 1] }}
          className="text-5xl sm:text-7xl md:text-[6rem] font-black tracking-tighter leading-[1.03] text-[var(--text-main)] mb-7"
        >
          Algorithmic Crypto <br className="hidden md:block" />
          <span className="text-[var(--text-main)] relative inline-block">
            <motion.span 
              initial={{ backgroundPosition: "0% 50%" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-main)] via-[var(--accent)] to-[var(--text-main)] bg-[length:200%_auto]"
            >
              Analytics.
            </motion.span>
            <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-[var(--accent)] opacity-20" />
          </span>
        </motion.h1>

        {/* Copywriting */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.16, ease: [0.32, 0.72, 0, 1] }}
          className="text-lg md:text-xl text-[var(--text-muted)] leading-relaxed max-w-[540px] mx-auto mb-12 tracking-tight"
        >
          Institutional-grade execution, AI anomaly detection, and tick-level backtesting. The terminal built for the absolute frontier.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.24, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (user) navigate("/dashboard");
              else if (onAuthOpen) onAuthOpen("login");
            }}
            className="group flex items-center justify-between gap-6 h-12 pl-5 pr-2 rounded-[12px] bg-[var(--text-main)] hover:bg-white text-[var(--bg-base)] font-bold text-[14px] transition-all duration-200 shadow-[0_0_24px_rgba(255,255,255,0.1)] hover:shadow-[0_0_32px_rgba(255,255,255,0.2)] hover:ring-2 hover:ring-white/20 w-full sm:w-auto overflow-hidden relative"
          >
            <span className="relative z-10">Launch Terminal</span>
            <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-[8px] bg-[var(--bg-base)] text-[var(--text-main)] opacity-90 group-hover:opacity-100 transition-opacity">
              <span className="text-[14px] leading-none mb-0.5">↵</span>
            </div>
            {/* Shimmer Effect */}
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
              className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/docs")}
            className="group flex items-center gap-3 h-12 px-6 rounded-[12px] border border-[var(--border-subtle)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] font-medium text-[14px] transition-all duration-200 hover:ring-2 hover:ring-white/20 hover:shadow-lg w-full sm:w-auto"
          >
            <Terminal size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
            <span>Read Docs</span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}