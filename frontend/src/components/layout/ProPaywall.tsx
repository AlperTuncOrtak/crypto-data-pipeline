import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Crown, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProPaywallProps {
  children: React.ReactNode;
  featureName?: string;
  inline?: boolean;
}

export default function ProPaywall({ children, featureName = "This feature", inline = false }: ProPaywallProps) {
  const { isPro, loading } = useAuth();
  const navigate = useNavigate();

  // If still loading auth state, show nothing or a subtle spinner to avoid flickering
  if (loading) {
    return <div className="animate-pulse w-full h-full min-h-[200px] bg-white/[0.02] rounded-2xl" />;
  }

  // If user is PRO, just render the content normally
  if (isPro) {
    return <>{children}</>;
  }

  // Otherwise, render the paywall
  return (
    <div className={`relative w-full ${inline ? 'h-full' : 'min-h-[400px]'} overflow-hidden rounded-2xl group`}>
      {/* Blurred Content */}
      <div className="w-full h-full filter blur-md opacity-30 pointer-events-none select-none transition-all duration-500">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 bg-[#020817]/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-sm w-full text-center p-8 rounded-[24px] border border-cyan-500/20 bg-white/[0.03] backdrop-blur-2xl shadow-[0_0_80px_rgba(34,211,238,0.1),inset_0_0_40px_rgba(34,211,238,0.05)]"
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-cyan-500/20 blur-2xl rounded-full pointer-events-none" />
          
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)]">
            <Lock className="text-[#020817]" size={24} />
          </div>
          
          <h3 className="text-xl font-black text-white tracking-tight mb-3">
            PRO Required
          </h3>
          
          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            {featureName} is an advanced feature reserved for <strong className="text-white">CryptoNeko PRO</strong> subscribers. Upgrade your terminal to unlock it.
          </p>
          
          <button
            onClick={() => navigate('/pricing')}
            className="group/btn flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-cyan-400 text-[#020817] font-bold text-[0.95rem] hover:bg-cyan-300 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] cursor-pointer"
          >
            <Crown size={18} className="group-hover/btn:-rotate-12 transition-transform" />
            Upgrade to PRO
          </button>
        </motion.div>
      </div>
    </div>
  );
}
