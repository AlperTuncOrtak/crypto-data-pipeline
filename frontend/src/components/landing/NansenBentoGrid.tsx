import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Activity, Wallet, Eye, Shield, TrendingUp } from "lucide-react";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const GLASS_BG = "rgba(255, 255, 255, 0.04)";
const GLASS_BORDER = "rgba(255, 255, 255, 0.08)";

export function NansenBentoGrid() {
  return (
    <section className="relative z-10 px-6 lg:px-12 max-w-[1200px] mx-auto py-24">
      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Large Feature 1 */}
        <FadeIn delay={0.1} className="md:col-span-2 relative group overflow-hidden rounded-[24px] p-8 md:p-10 flex flex-col justify-end min-h-[400px]" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
          {/* Subtle bg glow */}
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#00d084] opacity-10 blur-[100px] pointer-events-none transition-opacity duration-500 group-hover:opacity-20" />
          
          <div className="relative z-10 max-w-md">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${GLASS_BORDER}` }}>
              <Eye className="text-white" size={24} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Smart Money Tracker</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track 500M+ labeled wallets. See exactly what institutions, whales, and profitable traders are accumulating before the retail market reacts.
            </p>
          </div>

          {/* Abstract graphic */}
          <div className="absolute top-8 right-8 w-64 h-48 rounded-2xl border border-white/5 overflow-hidden flex flex-col gap-2 p-3 opacity-80" style={{ background: "rgba(0,0,0,0.4)" }}>
             {[100, 70, 85, 40].map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
                   <div className="h-2 rounded-full bg-[#00d084]/40" style={{ width: `${w}%` }} />
                </div>
             ))}
          </div>
        </FadeIn>

        {/* Small Feature 1 */}
        <FadeIn delay={0.2} className="relative group overflow-hidden rounded-[24px] p-8 flex flex-col justify-between min-h-[400px]" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
          <div className="relative z-10 mb-8">
             {/* Mock chart element */}
             <div className="flex items-end gap-1.5 h-32 w-full opacity-60">
               {[30, 45, 25, 60, 50, 80, 70].map((h, i) => (
                 <div key={i} className="w-full bg-white/20 rounded-sm transition-all group-hover:bg-[#00d084]/40" style={{ height: `${h}%` }} />
               ))}
             </div>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${GLASS_BORDER}` }}>
              <TrendingUp className="text-white" size={20} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">PnL Attribution</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Real-time PnL, risk scores, and deep analytics across chains.
            </p>
          </div>
        </FadeIn>

        {/* Small Feature 2 */}
        <FadeIn delay={0.3} className="relative group overflow-hidden rounded-[24px] p-8 flex flex-col justify-between min-h-[400px]" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
          <div className="relative z-10 mb-8">
            <div className="w-full h-32 rounded-xl border border-white/5 bg-black/40 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[#00d084] opacity-5 blur-2xl" />
               <Activity className="text-[#00d084] opacity-50" size={48} />
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${GLASS_BORDER}` }}>
              <Shield className="text-white" size={20} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">On-Chain Risk</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Automatically flag high-risk contracts, toxic liquidity, and honeypots.
            </p>
          </div>
        </FadeIn>

        {/* Large Feature 2 */}
        <FadeIn delay={0.4} className="md:col-span-2 relative group overflow-hidden rounded-[24px] p-8 md:p-10 flex flex-col justify-end min-h-[400px]" style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}` }}>
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-white opacity-5 blur-[100px] pointer-events-none transition-opacity duration-500 group-hover:opacity-10" />
          
          <div className="relative z-10 max-w-md">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${GLASS_BORDER}` }}>
              <Wallet className="text-white" size={24} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Trade Everything On-chain</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Research and execute directly. No switching apps — just a seamless experience that takes you from insight to action instantly.
            </p>
          </div>

          <div className="absolute top-10 right-10 w-48 h-48 border border-white/10 rounded-full flex items-center justify-center opacity-30">
             <div className="w-32 h-32 border border-white/20 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 border border-white/30 rounded-full" />
             </div>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
