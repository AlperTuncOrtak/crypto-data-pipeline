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
import './i18n'
import App from './App.jsx'

// --- WAGMI & RAINBOWKIT CONFIG ---
const config = getDefaultConfig({
  appName: 'CryptoNeko',
  projectId: '60d9ccc9681d82d9101fc65f31073a01', // Your personal WalletConnect project ID
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
            accentColor: 'var(--accent)',
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