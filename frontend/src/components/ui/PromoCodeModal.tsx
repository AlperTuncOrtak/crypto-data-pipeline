import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Check, Loader2 } from 'lucide-react';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

export default function PromoCodeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("You must be logged in to redeem a promo code.");
      return;
    }

    if (!code.trim()) return;

    setIsLoading(true);
    try {
      const fp = await fpPromise.load();
      const result = await fp.get();
      const deviceId = result.visitorId;

      const res = await apiClient.post('/api/promo/redeem', {
        user_id: session.user.id,
        promo_code: code,
        device_fingerprint: deviceId
      });

      if (res.ok) {
        toast.success(res.message || "Promo code activated successfully!");
        onClose();
      } else {
        toast.error(res.error || "Failed to redeem code.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during redemption.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
            
            <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[var(--accent)]/10 rounded-xl text-[var(--accent)]">
                <Gift size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-main)]">Redeem Promo Code</h2>
                <p className="text-sm text-[var(--text-muted)]">Unlock your free trial or discount.</p>
              </div>
            </div>

            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Enter your code (e.g. NEKO1WEEK)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all uppercase"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !code.trim()}
                className="w-full py-3.5 bg-[var(--text-main)] text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
                {isLoading ? "Verifying..." : "Redeem Code"}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <p className="text-[10px] text-[var(--text-muted)] opacity-60">
                Limit one trial per person. Hardware and IP restrictions apply to prevent abuse.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
