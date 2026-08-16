import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Cancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] pt-32 pb-24 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <XCircle size={80} className="text-red-400 mb-6 drop-shadow-[0_0_20px_var(--accent)]" />
        </motion.div>

        <h1 className="text-4xl font-black tracking-tight mb-4 text-[var(--text-main)]">Payment Cancelled</h1>
        
        <p className="text-[var(--text-muted)] text-lg mb-8">
          Your checkout session was cancelled and you haven't been charged. You can upgrade to PRO at any time from the Pricing page.
        </p>
        
        <button 
          onClick={() => navigate("/pricing")}
          className="px-8 py-4 rounded-full bg-white/10 border border-white/20 text-[var(--text-main)] font-semibold text-sm hover:bg-white/20 transition-colors flex items-center justify-center gap-2 w-full"
        >
          <ArrowLeft size={16} /> Return to Pricing
        </button>
      </motion.div>
    </div>
  );
}
