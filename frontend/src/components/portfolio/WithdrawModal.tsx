import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { useAccount, useSendTransaction, useWriteContract } from "wagmi";
import { parseEther, parseUnits } from "viem";

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  current_price: number;
  value: number;
  logoUrl?: string;
  contractAddress?: string; // If undefined, it's native asset
  decimals?: number;
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Holding[];
}

const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
];

export default function WithdrawModal({ isOpen, onClose, holdings }: WithdrawModalProps) {
  const { isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Holding | null>(null);

  const { sendTransactionAsync, isPending: isSendingNative } = useSendTransaction();
  const { writeContractAsync, isPending: isSendingERC20 } = useWriteContract();
  
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isPending = isSendingNative || isSendingERC20;

  // Filter out assets with 0 quantity
  const availableAssets = holdings.filter(h => h.quantity > 0);

  const handleWithdraw = async () => {
    if (!recipient || !amount || !selectedAsset) return;
    
    setStatus("idle");
    setErrorMsg("");

    try {
      if (selectedAsset.symbol === "ETH" || !selectedAsset.contractAddress) {
        // Native Transfer
        await sendTransactionAsync({
          to: recipient as `0x${string}`,
          value: parseEther(amount),
        });
      } else {
        // ERC20 Transfer
        await writeContractAsync({
          abi: ERC20_ABI,
          address: selectedAsset.contractAddress as `0x${string}`,
          functionName: "transfer",
          args: [recipient as `0x${string}`, parseUnits(amount, selectedAsset.decimals || 18)],
        });
      }
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.shortMessage || err.message || "Transaction failed");
    }
  };

  const setMaxAmount = () => {
    if (selectedAsset) {
      setAmount(selectedAsset.quantity.toString());
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
            className="w-full max-w-md bg-[#0A0A0A] border border-white/[0.08] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
              <div>
                <h3 className="text-xl font-bold text-zinc-100">Withdraw Crypto</h3>
                <p className="text-xs text-zinc-400 mt-1">Send funds to another address</p>
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
                    <ShieldAlert size={32} />
                  </div>
                  <h4 className="text-zinc-100 font-bold mb-2">Wallet Disconnected</h4>
                  <p className="text-zinc-400 text-sm">Please connect your Web3 wallet to withdraw funds.</p>
                </div>
              ) : status === "success" ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-full mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-zinc-100 font-bold mb-2">Transaction Sent!</h4>
                  <p className="text-zinc-400 text-sm mb-6">Your withdrawal is being processed on the blockchain.</p>
                  <button 
                    onClick={onClose}
                    className="w-full bg-white/5 border border-white/[0.08] text-zinc-100 font-bold py-3 rounded-xl hover:bg-white/10 transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Asset Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Select Asset</label>
                    <select
                      value={selectedAsset?.symbol || ""}
                      onChange={(e) => {
                        const asset = availableAssets.find(a => a.symbol === e.target.value);
                        setSelectedAsset(asset || null);
                        setAmount("");
                      }}
                      className="w-full bg-zinc-900/50 border border-white/[0.08] rounded-xl p-3.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors appearance-none"
                    >
                      <option value="" disabled>Select a token...</option>
                      {availableAssets.map((asset) => (
                        <option key={asset.symbol} value={asset.symbol}>
                          {asset.symbol} - Bal: {asset.quantity.toFixed(4)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recipient Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Send to Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/[0.08] rounded-xl p-3.5 text-[13px] font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Amount</label>
                      {selectedAsset && (
                        <button 
                          onClick={setMaxAmount}
                          className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded uppercase font-bold hover:bg-zinc-700"
                        >
                          Max
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/[0.08] rounded-xl p-3.5 text-lg font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">
                        {selectedAsset?.symbol}
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleWithdraw}
                    disabled={!recipient || !amount || !selectedAsset || isPending}
                    className="w-full bg-zinc-100 text-[#0A0A0A] font-bold py-3.5 rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Confirm in Wallet...
                      </>
                    ) : (
                      <>
                        <Send size={18} /> Withdraw {selectedAsset ? selectedAsset.symbol : ""}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
