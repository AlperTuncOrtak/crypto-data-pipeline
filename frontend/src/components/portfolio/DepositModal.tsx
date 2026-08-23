import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, ShieldCheck } from "lucide-react";
import QRCode from "react-qr-code";
import { useAccount } from "wagmi";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { t } = useTranslation();
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
            className="w-full max-w-md bg-[var(--bg-subtle)] border border-[var(--border-base)] rounded-2xl shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-base)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)]">{t("portfolio.deposit.title")}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{t("portfolio.deposit.subtitle")}</p>
              </div>
              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors bg-[var(--bg-overlay)] hover:bg-[var(--bg-elevated)] p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {!isConnected ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[var(--negative-muted)] text-[var(--negative)] flex items-center justify-center rounded-full mx-auto mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h4 className="text-[var(--text-main)] font-bold mb-2">{t("portfolio.deposit.disconnected_title")}</h4>
                  <p className="text-[var(--text-muted)] text-sm">{t("portfolio.deposit.disconnected_desc")}</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-[var(--border-base)]">
                      {address && <QRCode value={address} size={200} />}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">{t("portfolio.deposit.address")}</p>
                    <div className="flex items-center bg-[var(--bg-overlay)] border border-[var(--border-base)] rounded-xl p-1">
                      <div className="flex-1 px-4 text-[13px] font-mono text-[var(--text-main)] truncate">
                        {address}
                      </div>
                      <button
                        onClick={handleCopy}
                        className="bg-[var(--bg-overlay)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] p-2.5 rounded-lg transition-all"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[var(--warning-muted)] border border-[var(--warning)]/20 rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-[var(--warning)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-bold text-[var(--warning)] mb-1">{t("portfolio.deposit.warning_title")}</p>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        {t("portfolio.deposit.warning_desc")}
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
