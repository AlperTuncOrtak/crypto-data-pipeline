import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, ShieldCheck } from "lucide-react";
import QRCode from "react-qr-code";
import { useAccount } from "wagmi";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { address, isConnected } = useAccount();

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-md bg-[#0A0A0A] border border-white/[0.08] rounded-2xl shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
              <div>
                <h3 className="text-xl font-bold text-zinc-100">Deposit Crypto</h3>
                <p className="text-xs text-zinc-400 mt-1">Send funds to your Web3 wallet</p>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-100 transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {!isConnected ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-red-500/10 text-red-400 flex items-center justify-center rounded-full mx-auto mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h4 className="text-zinc-100 font-bold mb-2">Wallet Disconnected</h4>
                  <p className="text-zinc-400 text-sm">Please connect your Web3 wallet to deposit funds.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-white/[0.08]">
                      {address && <QRCode value={address} size={200} />}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Wallet Address</p>
                    <div className="flex items-center bg-zinc-900/50 border border-white/[0.08] rounded-xl p-1">
                      <div className="flex-1 px-4 text-[13px] font-mono text-zinc-300 truncate">
                        {address}
                      </div>
                      <button
                        onClick={handleCopy}
                        className="bg-white/5 hover:bg-white/10 text-zinc-100 p-2.5 rounded-lg transition-all"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-bold text-yellow-500 mb-1">Network Warning</p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Send only supported tokens (ETH, ERC-20) to this address on supported networks (Ethereum, Arbitrum, Base, Optimism, Polygon).
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
