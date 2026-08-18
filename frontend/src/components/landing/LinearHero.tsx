import { motion, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function LinearHero({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  let animationFrameId: number | null = null;

  // Handle mouse move with requestAnimationFrame throttling
  const handleMouseMove = (e: MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Cancel previous frame if exists
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }

    animationFrameId = requestAnimationFrame(() => {
      setMousePos({ x, y });
      if (!hasMouseMoved) setHasMouseMoved(true);
    });
  };

  // Add event listener on mount, remove on unmount
  useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement) return;

    heroElement.addEventListener("mousemove", handleMouseMove);

    return () => {
      heroElement.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [hasMouseMoved]);

  return (
    <section
      ref={heroRef}
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

      {/* Mouse Following Spotlight */}
      <motion.div
        className="absolute -translate-x-[50%] -translate-y-[50%] w-[400px] h-[400px] rounded-full"
        style={{
          x: mousePos.x,
          y: mousePos.y,
          opacity: hasMouseMoved ? 1 : 0,
          background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
          pointerEvents: "none"
        }}
        transition={{
          x: { type: "spring", stiffness: 200, damping: 20 },
          y: { type: "spring", stiffness: 200, damping: 20 },
          opacity: { duration: 0.3 }
        }}
      ></motion.div>

      {/* Hero Content */}
      <div className="flex flex-col items-center text-center max-w-[860px] mx-auto px-6 relative z-20">
        {/* Terminal Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0, ease: [0.32, 0.72, 0, 1] }}
          className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] mb-10 shadow-sm"
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
          <span className="text-[var(--text-main)] relative">
            Analytics.
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
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (user) navigate("/dashboard");
              else if (onAuthOpen) onAuthOpen("login");
            }}
            className="group flex items-center justify-between gap-6 h-12 pl-5 pr-2 rounded-[12px] bg-[var(--text-main)] hover:bg-white text-[var(--bg-base)] font-bold text-[14px] transition-all duration-200 shadow-[0_0_24px_rgba(255,255,255,0.1)] hover:ring-2 hover:ring-white/20 w-full sm:w-auto"
          >
            <span>Launch Terminal</span>
            <div className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[var(--bg-base)] text-[var(--text-main)] opacity-90 group-hover:opacity-100 transition-opacity">
              <span className="text-[14px] leading-none mb-0.5">↵</span>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/docs")}
            className="group flex items-center gap-3 h-12 px-6 rounded-[12px] border border-[var(--border-subtle)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] font-medium text-[14px] transition-all duration-200 hover:ring-2 hover:ring-white/20 w-full sm:w-auto"
          >
            <Terminal size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text/main)] transition-colors" />
            <span>Read Docs</span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}