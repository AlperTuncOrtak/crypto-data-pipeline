import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  wallets: string[];
  setWallets: React.Dispatch<React.SetStateAction<string[]>>;
  isFetchingWallet: boolean;
}

export default function AddSourceModal({
  isOpen,
  onClose,
  user,
  wallets,
  setWallets,
  isFetchingWallet,
}: AddSourceModalProps) {
  const [walletInput, setWalletInput] = useState("");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-[var(--bg-base)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden relative"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-xl font-black text-[var(--text-main)]">Connect Portfolio</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Link your wallets securely. DeFi and Multi-chain features coming soon.</p>
              </div>
              <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors bg-white/5 hover:bg-[var(--border-base)] p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Web3 Wallets</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openConnectModal, authenticationStatus, mounted }) => {
                    const connected = mounted && authenticationStatus !== 'loading' && account && chain;
                    return (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (connected && openAccountModal) openAccountModal();
                          else if (openConnectModal) openConnectModal();
                        }}
                        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] border transition-all duration-300 group ${
                          connected ? "bg-purple-500/10 border-purple-500/30" : "bg-[var(--bg-elevated)] border-[var(--border-base)] hover:bg-[var(--bg-overlay)]"
                        }`}
                      >
                        <span className="text-2xl">🦊</span>
                        <span className={`text-[11px] font-semibold ${connected ? "text-purple-400" : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"}`}>
                          {connected ? "Wallet Connected" : "Connect Web3 Wallet"}
                        </span>
                      </button>
                    );
                  }}
                </ConnectButton.Custom>
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px bg-[var(--border-subtle)] flex-1"></div>
                <span className="text-[10px] font-bold text-[var(--text-faint)] uppercase">OR TRACK ANY ADDRESS</span>
                <div className="h-px bg-[var(--border-subtle)] flex-1"></div>
              </div>

              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter ETH Address (0x...)"
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    className="flex-1 bg-[var(--bg-overlay)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                  />
                  <button
                    onClick={() => {
                      if (walletInput.trim().length > 10) {
                        setWallets(prev => [...new Set([...prev, walletInput.trim()])]);
                        setWalletInput("");
                        onClose();
                      }
                    }}
                    disabled={isFetchingWallet}
                    className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
                  >
                    Track
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
