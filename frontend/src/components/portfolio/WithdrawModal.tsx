import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ShieldAlert, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { useAccount, useSendTransaction, useWriteContract } from "wagmi";
import { parseEther, parseUnits, isAddress } from "viem";
import type { Holding, ChainBalance } from "./PortfolioUtils";

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

const EXPLORERS: Record<number, string> = {
  1: "https://etherscan.io",
  42161: "https://arbiscan.io",
  8453: "https://basescan.org",
  10: "https://optimistic.etherscan.io",
  137: "https://polygonscan.com",
};

/** One sendable balance: a symbol on one specific chain. */
interface SendOption {
  key: string;
  symbol: string;
  balance: ChainBalance;
}

const optionKey = (symbol: string, c: ChainBalance) =>
  `${symbol}:${c.chain_id}:${c.contract_address || "native"}`;

export default function WithdrawModal({ isOpen, onClose, holdings }: WithdrawModalProps) {
  const { t } = useTranslation();
  const { isConnected, chainId: connectedChainId } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedKey, setSelectedKey] = useState("");

  const { sendTransactionAsync, isPending: isSendingNative } = useSendTransaction();
  const { writeContractAsync, isPending: isSendingERC20 } = useWriteContract();

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txChainId, setTxChainId] = useState<number>(1);

  const isPending = isSendingNative || isSendingERC20;

  // A balance is sendable only if it is on a known chain and we can encode the
  // amount: native coins always, tokens only with a contract AND decimals.
  // The same symbol on two chains is two separate options — sending Base USDC
  // as if it were Ethereum USDC would target the wrong contract entirely.
  const options: SendOption[] = useMemo(() => {
    const out: SendOption[] = [];
    for (const h of holdings) {
      for (const c of h.chain_balances || []) {
        if (c.quantity <= 0) continue;
        const signable = !c.contract_address || c.decimals !== undefined;
        if (!signable) continue;
        out.push({ key: optionKey(h.symbol, c), symbol: h.symbol, balance: c });
      }
    }
    return out.sort((a, b) => b.balance.quantity - a.balance.quantity);
  }, [holdings]);

  const selected = options.find((o) => o.key === selectedKey) || null;
  const maxAmount = selected?.balance.quantity ?? 0;

  const parsedAmount = parseFloat(amount);
  const amountIsValid = isFinite(parsedAmount) && parsedAmount > 0;
  const amountExceedsBalance = amountIsValid && parsedAmount > maxAmount;
  const recipientIsValid = isAddress(recipient.trim());
  const isNative = !!selected && !selected.balance.contract_address;
  const needsChainSwitch = !!selected && connectedChainId !== selected.balance.chain_id;

  const canSubmit =
    !!selected && recipientIsValid && amountIsValid && !amountExceedsBalance && !isPending;

  const resetForm = () => {
    setRecipient("");
    setAmount("");
    setSelectedKey("");
    setStatus("idle");
    setErrorMsg("");
    setTxHash(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleWithdraw = async () => {
    if (!selected || !canSubmit) return;

    setStatus("idle");
    setErrorMsg("");
    const { chain_id, contract_address, decimals } = selected.balance;

    try {
      let hash: string;

      if (isNative) {
        hash = await sendTransactionAsync({
          to: recipient.trim() as `0x${string}`,
          value: parseEther(amount),
          // Naming the chain makes wagmi prompt a switch instead of
          // silently broadcasting on whatever chain happens to be active.
          chainId: chain_id,
        });
      } else if (contract_address && decimals !== undefined) {
        hash = await writeContractAsync({
          abi: ERC20_TRANSFER_ABI,
          address: contract_address as `0x${string}`,
          functionName: "transfer",
          args: [recipient.trim() as `0x${string}`, parseUnits(amount, decimals)],
          chainId: chain_id,
          account: undefined,
          chain: undefined,
        });
      } else {
        // Unreachable while `options` filters these out, but this is the branch
        // that used to fall through to a native transfer. Fail loudly.
        throw new Error(
          `Missing contract details for ${selected.symbol}. This token cannot be sent from here.`
        );
      }

      setTxHash(hash);
      setTxChainId(chain_id);
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.shortMessage || err.message || "Transaction failed");
    }
  };

  const setMaxAmount = () => {
    if (selected) setAmount(String(maxAmount));
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
                <h3 className="text-xl font-bold text-[var(--text-main)]">{t("portfolio.withdraw.title")}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{t("portfolio.withdraw.subtitle")}</p>
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
                  <h4 className="text-[var(--text-main)] font-bold mb-2">{t("portfolio.withdraw.disconnected_title")}</h4>
                  <p className="text-[var(--text-muted)] text-sm">{t("portfolio.withdraw.disconnected_desc")}</p>
                </div>
              ) : status === "success" ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[var(--positive-muted)] text-[var(--positive)] flex items-center justify-center rounded-full mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-[var(--text-main)] font-bold mb-2">{t("portfolio.withdraw.sent_title")}</h4>
                  <p className="text-[var(--text-muted)] text-sm mb-4">{t("portfolio.withdraw.sent_desc")}</p>
                  {txHash && (
                    <a
                      href={`${EXPLORERS[txChainId] || EXPLORERS[1]}/tx/${txHash}`}
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
                    {t("portfolio.withdraw.done")}
                  </button>
                </div>
              ) : options.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[var(--bg-overlay)] text-[var(--text-muted)] flex items-center justify-center rounded-full mx-auto mb-4">
                    <ShieldAlert size={32} />
                  </div>
                  <h4 className="text-[var(--text-main)] font-bold mb-2">{t("portfolio.withdraw.nothing_title")}</h4>
                  <p className="text-[var(--text-muted)] text-sm">
                    {t("portfolio.withdraw.nothing_desc")}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Asset Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">{t("portfolio.withdraw.select_asset")}</label>
                    <select
                      value={selectedKey}
                      onChange={(e) => {
                        setSelectedKey(e.target.value);
                        setAmount("");
                        setErrorMsg("");
                      }}
                      className="w-full bg-[var(--bg-overlay)] border border-[var(--border-base)] rounded-xl p-3.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none"
                    >
                      <option value="" disabled>{t("portfolio.withdraw.select_placeholder")}</option>
                      {options.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.symbol} · {o.balance.chain_name} — {o.balance.quantity.toFixed(6)}
                        </option>
                      ))}
                    </select>
                    {needsChainSwitch && (
                      <p className="text-[11px] text-[var(--warning)] mt-2">
                        {t("portfolio.withdraw.chain_switch", { chain: selected?.balance.chain_name })}
                      </p>
                    )}
                  </div>

                  {/* Recipient Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">{t("portfolio.withdraw.recipient")}</label>
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
                      <p className="text-[11px] text-[var(--negative)] mt-2">{t("portfolio.withdraw.invalid_address")}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t("portfolio.withdraw.amount")}</label>
                      {selected && (
                        <button
                          onClick={setMaxAmount}
                          className="text-[10px] bg-[var(--bg-overlay)] text-[var(--text-main)] px-2 py-0.5 rounded uppercase font-bold hover:bg-[var(--bg-elevated)]"
                        >
                          {t("portfolio.withdraw.max")}
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
                        {selected?.symbol}
                      </div>
                    </div>
                    {amountExceedsBalance && (
                      <p className="text-[11px] text-[var(--negative)] mt-2">
                        {t("portfolio.withdraw.exceeds", {
                          chain: selected?.balance.chain_name,
                          max: maxAmount.toFixed(6),
                          symbol: selected?.symbol,
                        })}
                      </p>
                    )}
                    {selected && isNative && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-2">
                        {t("portfolio.withdraw.gas_hint", { symbol: selected?.symbol })}
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
                        <Loader2 size={18} className="animate-spin" /> {t("portfolio.withdraw.confirm_wallet")}
                      </>
                    ) : (
                      <>
                        <Send size={18} />{" "}
                        {t("portfolio.withdraw.submit", {
                          asset: selected ? `${selected.symbol} · ${selected.balance.chain_name}` : "",
                        })}
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
