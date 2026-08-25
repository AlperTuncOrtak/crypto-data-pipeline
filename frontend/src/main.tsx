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
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })
import './i18n'
import App from './App.jsx'
import * as Sentry from "@sentry/react";
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

// --- SENTRY INITIALIZATION ---
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// --- POSTHOG INITIALIZATION ---
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
  })
}

import { http } from 'wagmi';

// --- WAGMI & RAINBOWKIT CONFIG ---
const config = getDefaultConfig({
  appName: 'CryptoNeko',
  projectId: '60d9ccc9681d82d9101fc65f31073a01', // Your personal WalletConnect project ID
  chains: [mainnet, polygon, optimism, arbitrum, base],
  transports: {
    [mainnet.id]: http('https://cloudflare-eth.com'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [optimism.id]: http(),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [base.id]: http('https://mainnet.base.org'),
  },
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

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <PostHogProvider client={posthog}>
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
      </PostHogProvider>
    </HelmetProvider>
  </StrictMode>,
)