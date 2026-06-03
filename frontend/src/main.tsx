import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';

import './index.css'
import App from './App.jsx'

// --- WAGMI & RAINBOWKIT CONFIG ---
const config = getDefaultConfig({
  appName: 'CryptoNeko',
  projectId: 'a21efd965e1ce0ce6f6edb8c4c795d2c', // Replace with your WalletConnect project ID in production
  chains: [mainnet, polygon, optimism, arbitrum, base],
});

// --- QUERY CLIENT ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,          // 30 saniye
      refetchOnWindowFocus: false,    // sekme degisince fetch etme
      retry: 1,                       // hata olursa 1 kere tekrar dene
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#00F0FF',
            accentColorForeground: '#111',
            borderRadius: 'large',
            overlayBlur: 'small',
          })}
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)