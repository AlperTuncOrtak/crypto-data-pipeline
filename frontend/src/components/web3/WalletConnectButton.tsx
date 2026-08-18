import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { Wallet, AlertTriangle, LogOut, ArrowRightLeft } from 'lucide-react';
import { useDisconnect, useAccount } from 'wagmi';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useRef } from 'react';
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

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
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
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-4 h-4"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </motion.button>

                  <div className="flex items-center bg-[var(--bg-subtle)] border border-[var(--accent)]/30 shadow-[inset_0_0_15px_rgba(83,58,253,0.1)] rounded-full p-0.5">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={openAccountModal}
                      type="button"
                      className="flex items-center gap-2 px-3 py-1 text-[var(--text-main)] font-bold text-sm hover:bg-[var(--accent)]/10 rounded-full transition-colors"
                    >
                      {account.displayBalance ? (
                        <span className="text-gray-300 font-medium hidden md:inline-block">
                          {account.displayBalance}
                        </span>
                      ) : null}
                      <span className="font-mono text-[var(--accent)]">
                        {account.displayName}
                      </span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => disconnect()}
                      type="button"
                      className="flex items-center justify-center w-7 h-7 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-[var(--text-main)] rounded-full transition-colors ml-1"
                      title="Disconnect Wallet"
                    >
                      <LogOut size={14} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        disconnect();
                        // Delay opening connect modal slightly to let disconnect process
                        setTimeout(() => {
                           if (openConnectModal) openConnectModal();
                        }, 300);
                      }}
                      type="button"
                      className="flex items-center justify-center w-7 h-7 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-full transition-colors ml-1"
                      title="Switch Wallet"
                    >
                      <ArrowRightLeft size={14} />
                    </motion.button>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
