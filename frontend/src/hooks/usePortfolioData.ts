import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { TOKENS, ERC20_ABI } from "../constants/web3";
import { supabase } from "../lib/supabase";
import { apiClient } from "../api/client";
import { calcHoldings, Trade } from "../components/portfolio/PortfolioUtils";

const sameAddress = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();

export function usePortfolioData(user: any, marketData: any[]) {
  // --- MANUAL TRADES (CSV import + exchange API sync) ---
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("crypto_neko_trades") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("traded_at", { ascending: true })
      .then(({ data }) => {
        if (data?.length > 0) {
          setTrades(data);
          localStorage.setItem("crypto_neko_trades", JSON.stringify(data));
        }
      });
  }, [user]);

  // ponytail: manual ETH address input removed — Alchemy handles everything.
  useEffect(() => { localStorage.removeItem("crypto_neko_wallets"); }, []);
  const wallets: string[] = [];
  const walletHoldings: any[] = [];
  const setWallets = () => {};
  const isFetchingWallet = false;

  // --- LIVE WALLET BALANCES (WAGMI) ---
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const [web3Holdings, setWeb3Holdings] = useState<any[]>([]);

  const erc20Tokens = useMemo(() => TOKENS.filter((t) => t.symbol !== "ETH"), []);
  const erc20Contracts = useMemo(
    () =>
      erc20Tokens.map((token) => ({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      })),
    [erc20Tokens, address]
  );

  const { data: tokenBalances } = useReadContracts({
    contracts: erc20Contracts,
    query: { enabled: isConnected && !!address },
  });

  useEffect(() => {
    if (!isConnected || !address) {
      setWeb3Holdings([]);
      return;
    }

    const newHoldings: any[] = [];

    // Native ETH — no contract address, signed directly by the connected wallet.
    if (ethBalance) {
      const amount = Number(ethBalance.formatted);
      if (amount > 0) {
        newHoldings.push({
          source: "Wallet",
          symbol: "ETH",
          quantity: amount,
          contract_address: undefined,
          decimals: 18,
          withdrawable: true,
        });
      }
    }

    if (tokenBalances) {
      tokenBalances.forEach((result, index) => {
        const token = erc20Tokens[index];
        if (result.status === "success" && (result as any).result !== undefined) {
          const amount = Number(formatUnits((result as any).result as bigint, token.decimals));
          if (amount > 0) {
            newHoldings.push({
              source: "Wallet",
              symbol: token.symbol,
              quantity: amount,
              contract_address: token.address,
              decimals: token.decimals,
              withdrawable: true,
            });
          }
        }
      });
    }

    setWeb3Holdings(newHoldings);
  }, [isConnected, address, ethBalance, tokenBalances, erc20Tokens]);

  // --- BINANCE (read-only balance sync) ---
  // ponytail: API keys are NOT persisted any more. They used to sit in
  // localStorage in plain text and re-sync on every mount; any XSS on the page
  // could read them. Keys now live only in memory for the current session.
  const [isSyncingBinance, setIsSyncingBinance] = useState(false);
  const [binanceHoldings, setBinanceHoldings] = useState<any[]>([]);

  useEffect(() => { localStorage.removeItem("crypto_neko_binance_keys"); }, []);

  const syncBinance = useCallback(async (key: string, secret: string) => {
    if (!key || !secret) return;
    setIsSyncingBinance(true);
    try {
      const resp = await apiClient.post("/portfolio/binance-sync", { api_key: key, api_secret: secret });
      if (resp.data.ok && resp.data.balances) {
        setBinanceHoldings(
          resp.data.balances.map((b: any) => ({
            symbol: b.symbol,
            quantity: b.quantity,
            source: "Binance",
            withdrawable: false,
          }))
        );
      }
    } catch (e) {
      console.error("Binance sync failed:", e);
    } finally {
      setIsSyncingBinance(false);
    }
  }, []);

  // --- BACKEND LINKED WALLET (Alchemy) ---
  const [alchemyHoldings, setAlchemyHoldings] = useState<any[]>([]);
  const [alchemyWallet, setAlchemyWallet] = useState<string | null>(null);
  const [alchemyFetchKey, setAlchemyFetchKey] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchLinkedWallet = async () => {
      try {
        const res = await apiClient.get("/wallets/portfolio");
        if (res.data?.portfolio?.balances?.length > 0) {
          setAlchemyWallet(res.data.wallet || null);
          setAlchemyHoldings(
            res.data.portfolio.balances.map((b: any) => ({
              symbol: b.symbol,
              quantity: b.balance,
              source: "Wallet",
              // "native" is Alchemy's marker for the chain's own coin (ETH).
              contract_address: b.contract_address === "native" ? undefined : b.contract_address,
              decimals: b.decimals ?? 18,
            }))
          );
        }
        // ponytail: don't clear alchemyHoldings if backend returns empty —
        // user_wallets might not be linked yet
      } catch (e: any) {
        console.error("Linked wallet fetch failed:", e?.response?.status || e.message);
      }
    };
    fetchLinkedWallet();
  }, [user, address, alchemyFetchKey]);

  // ponytail: after wallet connects, wait for /wallets/link POST to complete, then re-fetch
  useEffect(() => {
    if (!isConnected || !address) return;
    const timer = setTimeout(() => setAlchemyFetchKey(k => k + 1), 3000);
    return () => clearTimeout(timer);
  }, [isConnected, address]);

  // --- FINAL AGGREGATION ---
  // ponytail: Use BOTH wagmi and alchemy, but deduplicate by symbol.
  // Alchemy has more accurate data, so it takes priority over wagmi for same symbol.
  const mergedHoldings = useMemo(() => {
    // Alchemy reports the *linked* wallet, which is not necessarily the wallet
    // currently connected. Only mark its balances withdrawable when the two
    // are the same address — otherwise we'd offer to sign a transfer from a
    // wallet that doesn't hold the token.
    const linkedIsConnected = isConnected && sameAddress(alchemyWallet, address);
    const all = alchemyHoldings.map((h) => ({ ...h, withdrawable: linkedIsConnected }));

    const alchemySymbols = new Set(alchemyHoldings.map((h) => h.symbol));
    for (const wh of web3Holdings) {
      if (!alchemySymbols.has(wh.symbol)) all.push(wh);
    }
    return all;
  }, [web3Holdings, alchemyHoldings, alchemyWallet, address, isConnected]);

  const holdings = useMemo(
    () => calcHoldings(marketData, [...mergedHoldings, ...binanceHoldings], trades),
    [marketData, mergedHoldings, binanceHoldings, trades]
  );

  return {
    trades,
    setTrades,
    wallets,
    setWallets,
    isFetchingWallet,
    isSyncingBinance,
    syncBinance,
    holdings,
    walletHoldings,
    web3Holdings,
    alchemyHoldings,
    binanceHoldings
  };
}
