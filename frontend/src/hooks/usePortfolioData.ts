import { useState, useEffect, useMemo } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { TOKENS, ERC20_ABI } from "../constants/web3";
import { supabase } from "../lib/supabase";
import { apiClient } from "../api/client";
import { calcHoldings } from "../components/portfolio/PortfolioUtils";

export function usePortfolioData(user: any, marketData: any[]) {
  // --- MANUAL WALLETS (Ethplorer / Alchemy via Backend) ---
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
    
    // In the future this should hit the backend (apiClient.post("/wallets/link")) and get multi-chain balances.
    // For now we just use the backend's alchemy service or mock.
    const fetchWallets = async () => {
      setIsFetchingWallet(true);
      const all: any[] = [];
      for (const w of wallets) {
        try {
          const res = await apiClient.get("/wallets/portfolio"); // This route is currently user-based in backend, so we might need a direct query route, or just keep Ethplorer MVP for now.
          // Fallback to Ethplorer for manual addresses without auth:
          const ethRes = await fetch(`https://api.ethplorer.io/getAddressInfo/${w}?apiKey=freekey`);
          const data = await ethRes.json();
          if (data.ETH?.balance > 0) all.push({ symbol: "ETH", quantity: data.ETH.balance, source: "Wallet" });
          for (const t of data.tokens || []) {
            if (!t.tokenInfo?.symbol) continue;
            const bal = t.balance / Math.pow(10, parseInt(t.tokenInfo.decimals) || 18);
            if (bal > 0) all.push({ symbol: t.tokenInfo.symbol, quantity: bal, source: "Wallet" });
          }
        } catch (err) {
          console.error(err);
        }
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

    // ETH Balance
    if (ethBalance && Number(ethBalance.formatted) > 0) {
      newHoldings.push({
        symbol: "ETH",
        quantity: Number(ethBalance.formatted),
        source: "Web3",
      });
    }

    // ERC20 Balances
    if (tokenBalances) {
      (tokenBalances as any[]).forEach((result, index) => {
        if (result.status === "success" && result.result) {
          const rawBal = result.result as bigint;
          if (rawBal > 0n) {
            const token = erc20Tokens[index];
            const qty = Number(rawBal) / Math.pow(10, token.decimals);
            newHoldings.push({
              symbol: token.symbol,
              quantity: qty,
              source: "Web3",
            });
          }
        }
      });
    }

    setWeb3Holdings(newHoldings);
  }, [isConnected, address, ethBalance, tokenBalances, erc20Tokens]);

  // --- COMBINED HOLDINGS ---
  const combinedWalletHoldings = useMemo(() => {
    const combined = [...walletHoldings];
    // Wagmi holdings
    web3Holdings.forEach((wh) => {
      const existing = combined.find((c) => c.symbol === wh.symbol);
      if (existing) {
        existing.quantity += wh.quantity;
      } else {
        combined.push(wh);
      }
    });
    return combined;
  }, [walletHoldings, web3Holdings]);

  // --- FINAL HOLDINGS CALCULATION ---
  const holdings = useMemo(() => {
    return calcHoldings(marketData, combinedWalletHoldings);
  }, [marketData, combinedWalletHoldings]);

  return {
    wallets,
    setWallets,
    isFetchingWallet,
    holdings,
  };
}
