import { useAccount, useBalance, useDisconnect } from 'wagmi';

export function useWeb3() {
  const { address, isConnecting } = useAccount();
  const { data: balanceData } = useBalance({
    address,
  });
  const { disconnect } = useDisconnect();

  return {
    account: address,
    balance: balanceData ? Number(balanceData.formatted).toFixed(4) : null,
    isConnecting,
    error: null, // Errors are generally handled by RainbowKit UI now
    connectWallet: () => {
      // With RainbowKit, the connect modal is triggered by their <ConnectButton />
      // If we ever need to manually open it, we would use the useConnectModal hook from RainbowKit
      console.warn("connectWallet() called directly. Use RainbowKit's ConnectButton instead.");
    },
    disconnectWallet: disconnect,
  };
}
