import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Crown, Lock, ArrowRight, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export default function ProtectedRoute({
  children,
  requirePro = false,
  featureName = "this feature",
  onAuthOpen,
}: {
  children: React.ReactNode;
  requirePro?: boolean;
  featureName?: string;
  onAuthOpen?: () => void;
}) {
  const { isLoggedIn, isPro, isEnterprise, loading } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShow(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || !show) {
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  // Not Logged In
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center px-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-3xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center"
        >
          <Lock size={32} className="text-[var(--accent)]" />
        </motion.div>
        
        <div className="space-y-2 max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">Sign in to continue</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Create a free account to access {featureName}.
          </p>
        </div>

        <button
          onClick={onAuthOpen}
          className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-[#020817] font-bold hover:bg-[var(--accent-hover)] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
        >
          Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  // Logged in, but Pro required and user is not Pro
  if (requirePro && !isPro && !isEnterprise) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[500px] w-full px-4 group">
        
        {/* Blurred Content Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden rounded-2xl select-none pointer-events-none">
          <div className="w-full h-full filter blur-md opacity-30 group-hover:opacity-40 transition-opacity duration-500">
            {children}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/80 to-transparent" />
        </div>

        {/* Pro Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md p-8 rounded-[24px] border border-[var(--accent)]/20 bg-black/40 backdrop-blur-2xl shadow-[0_0_80px_rgba(99,102,241,0.1),inset_0_0_40px_rgba(99,102,241,0.05)] text-center"
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-[var(--accent)]/20 blur-3xl rounded-full pointer-events-none" />
          
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)]">
            <Crown size={28} className="text-[#020817]" />
          </div>
          
          <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight mb-3">
            PRO Feature
          </h2>
          
          <p className="text-[15px] text-[var(--text-muted)] leading-relaxed mb-8">
            {featureName} is available on the Pro plan. Upgrade to unlock advanced analytics, AI signals, alerts, and more.
          </p>

          <div className="flex flex-col gap-3 mb-8 text-left">
            {[
              "Portfolio tracker with unlimited trades",
              "Multi-exchange CSV import & tax reports",
              "AI portfolio analysis & signals",
              "Whale X-Ray on-chain tracking",
              "Custom price & volume alerts",
            ].map((f) => (
              <div key={f} className="flex items-start gap-3">
                <Zap size={16} className="text-[var(--accent)] shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {f}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/pricing")}
            className="group/btn flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[var(--accent)] text-[#020817] font-bold text-[0.95rem] hover:bg-[var(--accent-hover)] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(99,102,241,0.3)]"
          >
            <Crown size={18} className="group-hover/btn:-rotate-12 transition-transform" /> 
            Upgrade to Pro
          </button>
          
          <p className="mt-4 text-xs font-medium text-[var(--text-muted)]">
            Starting at $10/month • Cancel anytime
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
