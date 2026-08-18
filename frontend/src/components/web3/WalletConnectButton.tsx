import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { Wallet, AlertTriangle, LogOut, ArrowRightLeft } from 'lucide-react';
import { useDisconnect, useAccount } from 'wagmi';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '../../api/client';

export default function WalletConnectButton() {
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { isLoggedIn, token } = useAuth();
  const hasLinkedRef = useRef(false);

  useEffect(() => {
    if (isConnected && address && isLoggedIn && token && !hasLinkedRef.current) {
      hasLinkedRef.current = true;
      apiClient.post('/wallets/link', { wallet_address: address, provider: 'metamask' })
      .then(res => {
        if (res.data.status === 'success') {
          toast.success("Cüzdan hesabınıza başarıyla bağlandı!");
        }
      })
      .catch(err => {
        console.error("Wallet link error:", err);
      });
    }
    
    if (!isConnected) {
      hasLinkedRef.current = false;
    }
  }, [isConnected, address, isLoggedIn, token]);

  const handleConnectClick = (openModal: () => void) => {
    if (!isLoggedIn) {
      window.dispatchEvent(new Event('open-login'));
      return;
    }
    openModal();
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleConnectClick(openConnectModal)}
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--accent)] to-purple-500 rounded-full text-[var(--text-main)] font-bold text-sm shadow-[0_0_20px_var(--accent)] hover:shadow-[0_0_30px_rgba(83,58,253,0.5)] transition-all"
                    >
                      <Wallet size={16} />
                      {isLoggedIn ? "Connect Wallet" : "Login to Connect"}
                    </motion.button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={openChainModal}
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 font-bold text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    >
                      <AlertTriangle size={16} />
                      Wrong network
                    </motion.button>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={openChainModal}
                      type="button"
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-base)] shadow-[inset_0_0_10px_rgba(39,57,81,0.2)] rounded-full text-[var(--text-main)] font-bold text-sm hover:bg-[var(--border-subtle)] transition-colors"
                    >
                      {chain.hasIcon && (
                        <div className="w-4 h-4 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                          {chain.iconUrl && <img alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} className="w-4 h-4" />}
                        </div>
                      )}
                      {chain.name}
                    </motion.button>

                    <div className="flex items-center bg-[var(--bg-subtle)] border border-[var(--accent)]/30 shadow-[inset_0_0_15px_rgba(83,58,253,0.1)] rounded-full p-0.5">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsModalOpen(true)}
                        type="button"
                        className="flex items-center gap-2 px-4 py-1.5 text-[var(--text-main)] font-bold text-sm hover:bg-[var(--accent)]/10 rounded-full transition-colors"
                      >
                        {account.displayBalance && (
                          <span className="text-gray-300 font-medium hidden md:inline-block">
                            {account.displayBalance}
                          </span>
                        )}
                        <span className="font-mono text-[var(--accent)]">{account.displayName}</span>
                      </motion.button>
                    </div>

                    {/* CUSTOM ACCOUNT MODAL */}
                    {isModalOpen && (
                      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="relative w-full max-w-sm bg-[#1A1B1F] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center"
                        >
                          <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>

                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-3xl mb-4 shadow-lg overflow-hidden border-2 border-white/10">
                             {/* Placeholder Avatar */}
                             🤖
                          </div>
                          
                          <h2 className="text-xl font-bold font-mono text-white mb-6">
                            {account.displayName}
                          </h2>

                          <div className="grid grid-cols-2 gap-3 w-full mb-3">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(address || "");
                                toast.success("Address copied!");
                              }}
                              className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-sm font-semibold text-gray-300"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                              Copy Address
                            </button>
                            <button
                              onClick={() => {
                                disconnect();
                                setIsModalOpen(false);
                              }}
                              className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-sm font-semibold text-gray-300"
                            >
                              <LogOut size={20} />
                              Disconnect
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              disconnect();
                              setIsModalOpen(false);
                              setTimeout(() => { if (openConnectModal) openConnectModal(); }, 300);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 rounded-2xl transition-colors text-sm font-bold mt-1"
                          >
                            <ArrowRightLeft size={16} />
                            Switch Wallet
                          </button>
                        </motion.div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </>
  );
}
