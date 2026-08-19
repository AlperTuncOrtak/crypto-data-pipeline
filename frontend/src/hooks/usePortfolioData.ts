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

  console.log("[Portfolio:wagmi] isConnected:", isConnected, "address:", address, "ethBalance:", ethBalance?.formatted);

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
    console.log("[Portfolio:wagmi] Effect fired. isConnected:", isConnected, "address:", address);
    console.log("[Portfolio:wagmi] ethBalance:", ethBalance?.formatted, "tokenBalances:", tokenBalances);

    if (!isConnected || !address) {
      console.log("[Portfolio:wagmi] Not connected, clearing web3Holdings");
      setWeb3Holdings([]);
      return;
    }

    const newHoldings: any[] = [];

    // Add ETH
    if (ethBalance) {
      const amount = Number(ethBalance.formatted);
      console.log("[Portfolio:wagmi] ETH amount:", amount);
      if (amount > 0) {
        const ethPrice = marketData?.find((m) => m.symbol === "ETH")?.current_price || TOKENS[0].price;
        console.log("[Portfolio:wagmi] ETH price:", ethPrice, "value:", amount * ethPrice);
        newHoldings.push({
          source: "Wallet",
          symbol: "ETH",
          quantity: amount,
          cost_basis: amount * ethPrice,
        });
      }
    } else {
      console.log("[Portfolio:wagmi] ethBalance is null/undefined");
    }

    // Add ERC20s
    if (tokenBalances) {
      tokenBalances.forEach((result, index) => {
        const token = erc20Tokens[index];
        console.log("[Portfolio:wagmi] Token", token.symbol, "status:", result.status, "result:", (result as any).result?.toString());
        if (result.status === "success" && (result as any).result !== undefined) {
          const amount = Number(formatUnits((result as any).result as bigint, token.decimals));
          if (amount > 0) {
            newHoldings.push({
              source: "Wallet",
              symbol: token.symbol,
              quantity: amount,
              cost_basis: amount * (marketData?.find((m) => m.symbol === token.symbol)?.current_price || token.price),
            });
          }
        }
      });
    } else {
      console.log("[Portfolio:wagmi] tokenBalances is null/undefined");
    }

    console.log("[Portfolio:wagmi] Final web3Holdings:", JSON.stringify(newHoldings));
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
  const [alchemyFetchKey, setAlchemyFetchKey] = useState(0);

  useEffect(() => {
    if (!user) {
      console.log("[Portfolio:alchemy] No user, skipping fetch");
      return;
    }
    console.log("[Portfolio:alchemy] Fetching /wallets/portfolio. user.id:", user.id, "address:", address, "fetchKey:", alchemyFetchKey);

    const fetchLinkedWallet = async () => {
      try {
        const res = await apiClient.get("/wallets/portfolio");
        console.log("[Portfolio:alchemy] Response:", JSON.stringify(res.data));
        if (res.data?.portfolio?.balances && res.data.portfolio.balances.length > 0) {
          const formatted = res.data.portfolio.balances.map((b: any) => ({
            symbol: b.symbol,
            quantity: b.balance,
            source: "Wallet"
          }));
          console.log("[Portfolio:alchemy] Setting alchemyHoldings:", JSON.stringify(formatted));
          setAlchemyHoldings(formatted);
        } else {
          console.warn("[Portfolio:alchemy] Empty or no balances. Response:", JSON.stringify(res.data));
          // ponytail: don't clear alchemyHoldings if backend returns empty — 
          // user_wallets might not be linked yet
        }
      } catch (e: any) {
        console.error("[Portfolio:alchemy] Error:", e?.response?.status, e?.response?.data, e.message);
      }
    };
    fetchLinkedWallet();
  }, [user, address, alchemyFetchKey]);

  // ponytail: after wallet connects, wait for /wallets/link POST to complete, then re-fetch
  useEffect(() => {
    if (!isConnected || !address) return;
    console.log("[Portfolio:alchemy] Wallet connected, scheduling re-fetch in 3s");
    const timer = setTimeout(() => setAlchemyFetchKey(k => k + 1), 3000);
    return () => clearTimeout(timer);
  }, [isConnected, address]);

  // --- FINAL AGGREGATION ---
  // ponytail: Use BOTH wagmi and alchemy, but deduplicate by symbol.
  // Alchemy has more accurate data, so it takes priority over wagmi for same symbol.
  const mergedHoldings = useMemo(() => {
    const all = [...alchemyHoldings];
    const alchemySymbols = new Set(alchemyHoldings.map(h => h.symbol));
    // Add wagmi holdings that aren't already covered by alchemy
    for (const wh of web3Holdings) {
      if (!alchemySymbols.has(wh.symbol)) {
        all.push(wh);
      }
    }
    return all;
  }, [web3Holdings, alchemyHoldings]);

  console.log("[Portfolio:agg] web3Holdings:", web3Holdings.length, "alchemyHoldings:", alchemyHoldings.length, "merged:", mergedHoldings.length, "binance:", binanceHoldings.length);

  const holdings = useMemo(
    () => calcHoldings(marketData, [...mergedHoldings, ...binanceHoldings]),
    [marketData, mergedHoldings, binanceHoldings]
  );

  console.log("[Portfolio:agg] Final holdings count:", holdings.length, "values:", holdings.map((h: any) => `${h.symbol}=$${h.value?.toFixed(2)}`));

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
    alchemyHoldings,
    binanceHoldings
  };
}
