import React, { ReactNode } from "react";
import { motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// 1. BaseGlassCard
// ─────────────────────────────────────────────────────────────────────────────
export interface BaseGlassCardProps {
  children: ReactNode;
  className?: string;
  glowPosition?: "top-right" | "top-left" | "bottom" | "center" | "none";
  glowColor?: string;
  delay?: number;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export function BaseGlassCard({ 
  children, 
  className = "", 
  glowPosition = "top-right",
  glowColor = "rgba(99,102,241,0.06)",
  delay = 0,
  hoverEffect = false,
  onClick
}: BaseGlassCardProps) {
  
  const getGlowStyle = () => {
    if (glowPosition === "none") return {};
    const positions = {
      "top-right": "circle at top right",
      "top-left": "circle at top left",
      "bottom": "circle at bottom",
      "center": "circle at center",
    };
    return {
      background: `radial-gradient(${positions[glowPosition]}, ${glowColor}, transparent 60%)`
    };
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      // `as const` keeps this a 4-tuple; framer-motion rejects number[].
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2, borderColor: "rgba(99,102,241,0.4)", boxShadow: "0 0 20px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.4)" }}
      className={`relative overflow-hidden rounded-[20px] bg-[#09090b]/80 border border-white/[0.06] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all ${hoverEffect ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0 opacity-70" />
      <div className="absolute inset-0 z-0 pointer-events-none" style={getGlowStyle()} />
      <div className="relative z-10 w-full h-full p-7 md:p-8 flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SectionHeader
// ─────────────────────────────────────────────────────────────────────────────
export interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ badge, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center w-full max-w-3xl mx-auto mb-16 px-4">
      {badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-6 inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.15)]"
        >
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--accent)]">
            {badge}
          </span>
        </motion.div>
      )}

      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-3xl md:text-4xl lg:text-[42px] font-medium tracking-tight text-white mb-5 leading-tight"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-base md:text-[17px] text-white/50 leading-relaxed max-w-xl mx-auto"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MetricStrip
// ─────────────────────────────────────────────────────────────────────────────
export interface MetricItem {
  label: string;
  value: string;
  icon?: React.ElementType; 
}

export function MetricStrip({ items }: { items: MetricItem[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full relative z-10 border-y border-white/[0.06] bg-[#09090b]/60 backdrop-blur-xl mt-12"
    >
      <div className="max-w-[1360px] mx-auto flex flex-nowrap items-stretch overflow-x-auto scrollbar-none divide-x divide-white/[0.06]">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className="flex-1 min-w-[140px] py-8 px-6 flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-white/[0.02]"
          >
            <div className="text-[22px] md:text-[28px] font-semibold text-white tracking-tight tabular-nums">
              {item.value}
            </div>
            <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium">
              {item.icon && <item.icon size={12} className="text-white/30" />}
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BentoGridWrapper
// ─────────────────────────────────────────────────────────────────────────────
export function BentoGridWrapper({ children, className = "" }: { children: ReactNode; className?: string }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className={`w-full max-w-[1360px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 px-4 md:px-6 relative z-10 ${className}`}
    >
      {children}
    </motion.div>
  );
}