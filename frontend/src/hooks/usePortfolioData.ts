import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { TOKENS, ERC20_ABI } from "../constants/web3";
import { supabase } from "../lib/supabase";
import { apiClient } from "../api/client";
import { calcHoldings } from "../components/portfolio/PortfolioUtils";

export function usePortfolioData(user: any, marketData: any[]) {
  // --- MANUAL TRADES ---
  const [trades, setTrades] = useState(() => {
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

  // --- MANUAL WALLETS (ETHPlorer) ---
  const [wallets, setWallets] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("crypto_neko_wallets") || "[]");
    } catch {
      return [];
    }
  });
  const [walletHoldings, setWalletHoldings] = useState<any[]>([]);
  const [isFetchingWallet, setIsFetchingWallet] = useState(false);

  useEffect(() => {
    localStorage.setItem("crypto_neko_wallets", JSON.stringify(wallets));
    if (wallets.length === 0) {
      setWalletHoldings([]);
      return;
    }
    const fetchWallets = async () => {
      setIsFetchingWallet(true);
      const all: any[] = [];
      for (const w of wallets) {
        try {
          const res = await fetch(`https://api.ethplorer.io/getAddressInfo/${w}?apiKey=freekey`);
          const data = await res.json();
          if (data.ETH?.balance > 0) all.push({ symbol: "ETH", quantity: data.ETH.balance, source: "Wallet" });
          for (const t of data.tokens || []) {
            if (!t.tokenInfo?.symbol) continue;
            const bal = t.balance / Math.pow(10, parseInt(t.tokenInfo.decimals) || 18);
            if (bal > 0) all.push({ symbol: t.tokenInfo.symbol, quantity: bal, source: "Wallet" });
          }
        } catch {}
      }
      setWalletHoldings(all);
      setIsFetchingWallet(false);
    };
    fetchWallets();
  }, [wallets]);

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

    // Add ETH
    if (ethBalance) {
      const amount = Number(ethBalance.formatted);
      if (amount > 0) {
        newHoldings.push({
          source: "Wallet",
          symbol: "ETH",
          quantity: amount,
          cost_basis: amount * (marketData?.find((m) => m.symbol === "ETH")?.current_price || TOKENS[0].price),
        });
      }
    }

    // Add ERC20s
    if (tokenBalances) {
      tokenBalances.forEach((result, index) => {
        if (result.status === "success") {
          const token = erc20Tokens[index];
          const amount = Number(formatUnits(result.result as bigint, token.decimals));
          if (amount > 0 && Number(ethBalance?.formatted) !== 0) {
            newHoldings.push({
              source: "Wallet",
              symbol: token.symbol,
              quantity: amount,
              cost_basis: amount * (marketData?.find((m) => m.symbol === token.symbol)?.current_price || token.price),
            });
          }
        }
      });
    }

    setWeb3Holdings(newHoldings);
  }, [isConnected, address, ethBalance, tokenBalances, marketData, erc20Tokens]);

  // --- BINANCE ---
  const [binanceKeys, setBinanceKeys] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("crypto_neko_binance_keys") || '{"key":"","secret":""}');
    } catch {
      return { key: "", secret: "" };
    }
  });
  const [isSyncingBinance, setIsSyncingBinance] = useState(false);
  const [binanceHoldings, setBinanceHoldings] = useState<any[]>([]);

  const syncBinance = useCallback(async (key: string, secret: string) => {
    if (!key || !secret) return;
    setIsSyncingBinance(true);
    try {
      const resp = await apiClient.post("/portfolio/binance-sync", { api_key: key, api_secret: secret });
      if (resp.data.ok && resp.data.balances) {
        setBinanceHoldings(
          resp.data.balances.map((b: any) => ({ symbol: b.symbol, quantity: b.quantity, source: "binance" }))
        );
        setBinanceKeys({ key, secret });
        localStorage.setItem("crypto_neko_binance_keys", JSON.stringify({ key, secret }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingBinance(false);
    }
  }, []);

  useEffect(() => {
    if (binanceKeys.key && binanceKeys.secret) syncBinance(binanceKeys.key, binanceKeys.secret);
  }, []);

  // --- BACKEND LINKED WALLET (Alchemy) ---
  const [alchemyHoldings, setAlchemyHoldings] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    const fetchLinkedWallet = async () => {
      try {
        const res = await apiClient.get("/wallets/portfolio");
        if (res.data?.portfolio?.balances) {
          const formatted = res.data.portfolio.balances.map((b: any) => ({
            symbol: b.symbol,
            quantity: b.balance,
            source: "Wallet"
          }));
          setAlchemyHoldings(formatted);
        }
      } catch (e) {
        console.error("Alchemy sync error", e);
      }
    };
    fetchLinkedWallet();
  }, [user]);

  // --- FINAL AGGREGATION ---
  const holdings = useMemo(
    () => calcHoldings(trades, marketData, [...walletHoldings, ...web3Holdings, ...binanceHoldings, ...alchemyHoldings]),
    [trades, marketData, walletHoldings, web3Holdings, binanceHoldings, alchemyHoldings]
  );

  return {
    trades,
    setTrades,
    wallets,
    setWallets,
    isFetchingWallet,
    binanceKeys,
    isSyncingBinance,
    syncBinance,
    holdings,
    walletHoldings,
    web3Holdings,
    binanceHoldings
  };
}
