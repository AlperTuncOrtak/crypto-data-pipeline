import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { EXCHANGE_GUIDES } from "./PortfolioUtils";
import { apiClient } from "../../api/client";
import { supabase } from "../../lib/supabase";

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  trades: any[];
  setTrades: (trades: any[]) => void;
  wallets: string[];
  setWallets: React.Dispatch<React.SetStateAction<string[]>>;
  isFetchingWallet: boolean;
  handleFile: (file: File) => void;
  setImportMsg: (msg: any) => void;
}

export default function AddSourceModal({
  isOpen,
  onClose,
  user,
  trades,
  setTrades,
  wallets,
  setWallets,
  isFetchingWallet,
  handleFile,
  setImportMsg,
}: AddSourceModalProps) {
  const [connectingExchange, setConnectingExchange] = useState<any>(null);
  const [oauthStep, setOauthStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [apiPassphrase, setApiPassphrase] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletInput, setWalletInput] = useState("");
  
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen && !connectingExchange) return null;

  return (
    <>
      {/* Connect Sources Modal */}
      <AnimatePresence>
        {isOpen && !connectingExchange && (
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
                  <p className="text-sm text-[var(--text-muted)] mt-1">Link your wallets and exchanges securely.</p>
                </div>
                <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors bg-white/5 hover:bg-[var(--border-base)] p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Web3 & Exchanges</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
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
                            connected ? "bg-purple-500/10 border-purple-500/30" : "bg-[var(--bg-elevated)] border-[var(--border-base)] hover:bg-[#222529]"
                          }`}
                        >
                          <span className="text-2xl">🦊</span>
                          <span className={`text-[11px] font-semibold ${connected ? "text-purple-400" : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"}`}>
                            {connected ? "Connected" : "Web3 Wallet"}
                          </span>
                        </button>
                      );
                    }}
                  </ConnectButton.Custom>
                  
                  {Object.entries(EXCHANGE_GUIDES).map(([key, ex]) => {
                    const isConnected = trades.some(t => t.exchange === ex.name);
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (!isConnected) {
                            onClose();
                            setConnectingExchange(ex);
                            setOauthStep(4);
                          }
                        }}
                        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-[12px] border transition-all duration-300 group ${
                          isConnected ? "bg-[#14F195]/5 border-[#14F195]/20" : "bg-[var(--bg-elevated)] border-[var(--border-base)] hover:bg-[#222529]"
                        }`}
                      >
                        <img src={ex.logo} alt={ex.name} className="w-8 h-8 rounded-full object-contain" />
                        <span className={`text-[11px] font-semibold ${isConnected ? "text-[#14F195]" : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"}`}>
                          {isConnected ? "Synced" : ex.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">ETH Address</p>
                    <div className="flex flex-col gap-2">
                      <input 
                        value={walletInput} 
                        onChange={e => setWalletInput(e.target.value)} 
                        placeholder="0x..."
                        className="w-full bg-[var(--bg-subtle)] border border-[var(--border-base)] rounded-3xl px-4 py-3 text-[13px] text-[var(--text-main)] focus:outline-none focus:border-[#14F195]/50 transition-all" 
                      />
                      <button 
                        onClick={() => { 
                          if (walletInput.trim()) { 
                            setWallets(prev => [...new Set([...prev, walletInput.trim()])]); 
                            setWalletInput(""); 
                          } 
                        }}
                        className="w-full py-3 rounded-3xl bg-white/5 hover:bg-[var(--border-base)] border border-[var(--border-subtle)] text-[13px] font-semibold transition-all text-[var(--text-main)]"
                      >
                        {isFetchingWallet ? "Fetching..." : "Add Public Wallet"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">CSV Import</p>
                    <input type="file" ref={fileRef} accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); onClose(); }} />
                    <button 
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--border-base)] rounded-3xl p-4 hover:border-[#14F195]/50 hover:bg-[#14F195]/5 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                    >
                      <Upload size={20} />
                      <span className="text-[12px] font-semibold">Upload CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Exchange Modal */}
      <AnimatePresence>
        {connectingExchange && (
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
              className="w-full max-w-md bg-[var(--bg-base)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden relative"
            >
              {oauthStep === 4 && (
                <>
                  <div className="h-2 w-full" style={{ background: connectingExchange.color }} />
                  <button
                    onClick={() => {
                      setOauthStep(0);
                      setConnectingExchange(null);
                      setApiKey("");
                      setApiSecret("");
                      setApiPassphrase("");
                    }}
                    className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  >
                    <X size={20} />
                  </button>

                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <img src={connectingExchange.logo} alt={connectingExchange.name} className="w-12 h-12 rounded-full object-contain" />
                      <div>
                        <h3 className="text-xl font-black text-[var(--text-main)]">API Connection</h3>
                        <p className="text-xs text-[var(--text-muted)]">Read-Only access for {connectingExchange.name}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">API Key</label>
                        <input
                          type="text"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-3xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
                          placeholder="Enter your API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">API Secret</label>
                        <input
                          type="password"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-3xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
                          placeholder="Enter your API Secret"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Passphrase <span className="text-gray-600 normal-case">(Optional)</span></label>
                        <input
                          type="password"
                          value={apiPassphrase}
                          onChange={(e) => setApiPassphrase(e.target.value)}
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-3xl px-4 py-3 text-sm text-[var(--text-main)] placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
                          placeholder="Passphrase (if applicable)"
                        />
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setIsConnecting(true);
                        setOauthStep(5);
                        try {
                          const res = await apiClient.post("/api/exchanges/sync", {
                            exchange_id: connectingExchange.id || connectingExchange.name.toLowerCase(),
                            api_key: apiKey,
                            secret: apiSecret,
                            password: apiPassphrase || undefined
                          });
                          
                          const fetchedHoldings = res.data;
                          
                          if (fetchedHoldings && fetchedHoldings.length > 0) {
                            const newTrades = fetchedHoldings.map((h: any) => ({
                              symbol: h.symbol,
                              side: "buy",
                              quantity: h.quantity,
                              price: 0,
                              total: 0,
                              traded_at: new Date().toISOString(),
                              exchange: connectingExchange.name
                            }));

                            if (user) {
                              const tradesToInsert = newTrades.map((t: any) => ({ ...t, user_id: user.id }));
                              await supabase.from("trades").insert(tradesToInsert);
                              const { data } = await supabase.from("trades").select("*").eq("user_id", user.id).order("traded_at", { ascending: true });
                              if (data) setTrades(data);
                            } else {
                              const updated = [...trades, ...newTrades];
                              setTrades(updated);
                              localStorage.setItem("crypto_neko_trades", JSON.stringify(updated));
                            }
                            setImportMsg({ ok: true, text: `Successfully synced ${fetchedHoldings.length} assets from ${connectingExchange.name}!` });
                          } else {
                            setImportMsg({ ok: true, text: `Connected successfully, but no assets found in ${connectingExchange.name}.` });
                          }
                          setOauthStep(0);
                          setConnectingExchange(null);
                        } catch (err: any) {
                          alert(err.response?.data?.detail || "Failed to connect to exchange.");
                          setOauthStep(4);
                        } finally {
                          setIsConnecting(false);
                          setApiKey("");
                          setApiSecret("");
                          setApiPassphrase("");
                        }
                      }}
                      disabled={isConnecting || !apiKey || !apiSecret}
                      className="w-full bg-[var(--accent)] text-[var(--text-main)] font-bold py-3.5 rounded-3xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isConnecting ? "Connecting..." : "Sync Real Portfolio"}
                    </button>
                  </div>
                </>
              )}
              {oauthStep === 5 && (
                <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-6" />
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Connecting API...</h3>
                  <p className="text-[var(--text-muted)] text-sm">Authenticating and fetching real balances from {connectingExchange?.name}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
