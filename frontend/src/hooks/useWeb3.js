import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export function useWeb3() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async (address, provider) => {
    try {
      const bal = await provider.getBalance(address);
      const ethBal = ethers.formatEther(bal);
      setBalance(Number(ethBal).toFixed(4));
    } catch (err) {
      console.error("Failed to fetch balance", err);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask or another Web3 wallet.");
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await fetchBalance(accounts[0], provider);
      }
    } catch (err) {
      setError(err.message || "Failed to connect wallet.");
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance(null);
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const provider = new ethers.BrowserProvider(window.ethereum);
          fetchBalance(accounts[0], provider);
        } else {
          setAccount(null);
          setBalance(null);
        }
      });
      
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, [fetchBalance]);

  return {
    account,
    balance,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  };
}
