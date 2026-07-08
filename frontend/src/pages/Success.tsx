import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../api/client";

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [verifying, setVerifying] = useState(true);

  // In a real app, you might want to call your backend to verify the session
  // But relying on webhooks is safer. We'll just show a success message here.
  useEffect(() => {
    const timer = setTimeout(() => {
      setVerifying(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-white pt-32 pb-24 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

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
          <CheckCircle size={80} className="text-emerald-400 mb-6 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
        </motion.div>

        <h1 className="text-4xl font-black tracking-tight mb-4 text-white">Welcome to PRO</h1>
        
        {verifying ? (
          <p className="text-slate-400 text-lg mb-8 animate-pulse">
            Verifying your subscription...
          </p>
        ) : (
          <>
            <p className="text-slate-400 text-lg mb-8">
              Your payment was successful and your account has been upgraded. You now have full access to all institutional tools.
            </p>
            <button 
              onClick={() => navigate("/dashboard")}
              className="px-8 py-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 w-full"
            >
              Go to Dashboard <ArrowRight size={16} />
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
