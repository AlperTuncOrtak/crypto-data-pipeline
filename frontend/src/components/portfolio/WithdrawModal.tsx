import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ShieldAlert, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { useAccount, useSendTransaction, useWriteContract } from "wagmi";
import { parseEther, parseUnits, isAddress } from "viem";
import type { Holding } from "./PortfolioUtils";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Holding[];
}

const ERC20_TRANSFER_ABI = [
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
] as const;

export default function WithdrawModal({ isOpen, onClose, holdings }: WithdrawModalProps) {
  const { isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");

  const { sendTransactionAsync, isPending: isSendingNative } = useSendTransaction();
  const { writeContractAsync, isPending: isSendingERC20 } = useWriteContract();

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  const isPending = isSendingNative || isSendingERC20;

  // Only assets that actually sit in the connected wallet can be signed for.
  // Exchange balances and trade-derived positions are not on-chain here, and
  // the amount available to send is the wallet slice, not the total position.
  const availableAssets = useMemo(
    () => holdings.filter((h) => h.withdrawable && h.wallet_quantity > 0),
    [holdings]
  );

  const selectedAsset = availableAssets.find((a) => a.symbol === selectedSymbol) || null;
  const maxAmount = selectedAsset?.wallet_quantity ?? 0;

  const parsedAmount = parseFloat(amount);
  const amountIsValid = isFinite(parsedAmount) && parsedAmount > 0;
  const amountExceedsBalance = amountIsValid && parsedAmount > maxAmount;
  const recipientIsValid = isAddress(recipient.trim());

  // A token with no contract address is only sendable if it IS the native coin.
  // Anything else would silently become a native transfer, so it stays blocked.
  const isNative = selectedAsset?.symbol === "ETH" && !selectedAsset?.contract_address;
  const canSignSelected =
    !!selectedAsset && (isNative || (!!selectedAsset.contract_address && selectedAsset.decimals !== undefined));

  const canSubmit =
    canSignSelected && recipientIsValid && amountIsValid && !amountExceedsBalance && !isPending;

  const resetForm = () => {
    setRecipient("");
    setAmount("");
    setSelectedSymbol("");
    setStatus("idle");
    setErrorMsg("");
    setTxHash(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleWithdraw = async () => {
    if (!selectedAsset || !canSubmit) return;

    setStatus("idle");
    setErrorMsg("");

    try {
      let hash: string;

      if (isNative) {
        hash = await sendTransactionAsync({
          to: recipient.trim() as `0x${string}`,
          value: parseEther(amount),
        });
      } else if (selectedAsset.contract_address && selectedAsset.decimals !== undefined) {
        hash = await writeContractAsync({
          abi: ERC20_TRANSFER_ABI,
          address: selectedAsset.contract_address as `0x${string}`,
          functionName: "transfer",
          args: [recipient.trim() as `0x${string}`, parseUnits(amount, selectedAsset.decimals)],
          // Left undefined so wagmi uses the currently connected account/chain.
          account: undefined,
          chain: undefined,
        });
      } else {
        // Unreachable while canSubmit gates the button, but this is the branch
        // that used to fall through to a native ETH transfer. Fail loudly.
        throw new Error(
          `Missing contract details for ${selectedAsset.symbol}. This token cannot be sent from here.`
        );
      }

      setTxHash(hash);
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.shortMessage || err.message || "Transaction failed");
    }
  };

  const setMaxAmount = () => {
    if (selectedAsset) setAmount(String(maxAmount));
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
            className="w-full max-w-md bg-[var(--bg-subtle)] border border-[var(--border-base)] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-base)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-main)]">Withdraw Crypto</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">Send funds to another address</p>
              </div>
              <button
                onClick={handleClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors bg-[var(--bg-overlay)] hover:bg-[var(--bg-elevated)] p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {!isConnected ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[var(--negative-muted)] text-[var(--negative)] flex items-center justify-center rounded-full mx-auto mb-4">
                    <ShieldAlert size={32} />
                  </div>
                  <h4 className="text-[var(--text-main)] font-bold mb-2">Wallet Disconnected</h4>
                  <p className="text-[var(--text-muted)] text-sm">Please connect your Web3 wallet to withdraw funds.</p>
                </div>
              ) : status === "success" ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[var(--positive-muted)] text-[var(--positive)] flex items-center justify-center rounded-full mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-[var(--text-main)] font-bold mb-2">Transaction Sent!</h4>
                  <p className="text-[var(--text-muted)] text-sm mb-4">Your withdrawal is being processed on the blockchain.</p>
                  {txHash && (
                    <a
                      href={`https://etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--text-main)] hover:text-[var(--text-main)] mb-6 font-mono"
                    >
                      {txHash.slice(0, 10)}…{txHash.slice(-8)} <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    onClick={handleClose}
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border-base)] text-[var(--text-main)] font-bold py-3 rounded-xl hover:bg-[var(--bg-elevated)] transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : availableAssets.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[var(--bg-overlay)] text-[var(--text-muted)] flex items-center justify-center rounded-full mx-auto mb-4">
                    <ShieldAlert size={32} />
                  </div>
                  <h4 className="text-[var(--text-main)] font-bold mb-2">Nothing to withdraw</h4>
                  <p className="text-[var(--text-muted)] text-sm">
                    Only balances held in the connected wallet can be sent from here. Exchange and
                    imported positions have to be withdrawn from the exchange itself.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Asset Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Select Asset</label>
                    <select
                      value={selectedSymbol}
                      onChange={(e) => {
                        setSelectedSymbol(e.target.value);
                        setAmount("");
                        setErrorMsg("");
                      }}
                      className="w-full bg-[var(--bg-overlay)] border border-[var(--border-base)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none"
                    >
                      <option value="" disabled>Select a token...</option>
                      {availableAssets.map((asset) => (
                        <option key={asset.symbol} value={asset.symbol}>
                          {asset.symbol} — Bal: {asset.wallet_quantity.toFixed(6)}
                        </option>
                      ))}
                    </select>
                    {selectedAsset && !canSignSelected && (
                      <p className="text-[11px] text-amber-400 mt-2">
                        Contract details for {selectedAsset.symbol} are unavailable, so it can't be sent from here.
                      </p>
                    )}
                  </div>

                  {/* Recipient Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Send to Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className={`w-full bg-[var(--bg-overlay)] border rounded-xl p-3.5 text-[13px] font-mono text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none transition-colors ${
                        recipient && !recipientIsValid
                          ? "border-red-500/50 focus:border-red-500"
                          : "border-[var(--border-base)] focus:border-[var(--accent)]"
                      }`}
                    />
                    {recipient && !recipientIsValid && (
                      <p className="text-[11px] text-[var(--negative)] mt-2">Not a valid EVM address.</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Amount</label>
                      {selectedAsset && (
                        <button
                          onClick={setMaxAmount}
                          className="text-[10px] bg-[var(--bg-overlay)] text-[var(--text-main)] px-2 py-0.5 rounded uppercase font-bold hover:bg-[var(--bg-elevated)]"
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
                        className={`w-full bg-[var(--bg-overlay)] border rounded-xl p-3.5 text-lg font-mono text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none transition-colors ${
                          amountExceedsBalance
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-[var(--border-base)] focus:border-[var(--accent)]"
                        }`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">
                        {selectedAsset?.symbol}
                      </div>
                    </div>
                    {amountExceedsBalance && (
                      <p className="text-[11px] text-[var(--negative)] mt-2">
                        Exceeds your wallet balance of {maxAmount.toFixed(6)} {selectedAsset?.symbol}.
                      </p>
                    )}
                    {selectedAsset && isNative && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-2">
                        Leave some ETH behind to cover the gas fee.
                      </p>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="bg-[var(--negative-muted)] border border-[var(--negative)]/20 text-[var(--negative)] text-xs p-3 rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleWithdraw}
                    disabled={!canSubmit}
                    className="w-full bg-[var(--text-main)] text-[var(--bg-base)] font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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
