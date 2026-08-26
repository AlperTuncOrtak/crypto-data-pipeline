// ============================================================
// vite.config.js
// ============================================================
// Vite dev server ve build ayarlari.
// Tailwind v4 icin ayri bir config dosyasi yazmiyoruz,
// plugin her seyi hallediyor.
// ============================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, // 5 MB
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'CryptoNeko Terminal',
        short_name: 'CryptoNeko',
        description: 'Advanced Crypto Analytics Dashboard',
        theme_color: '#020204',
        background_color: '#020204',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Vite 8 bundles with rolldown, which only accepts the function form
        // of manualChunks. The object form silently type-checks but throws
        // "manualChunks is not a function" at build time.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) return 'react-vendor'
          if (id.includes('framer-motion')) return 'framer-motion'
          if (id.includes('recharts')) return 'recharts'
          if (/[\\/]node_modules[\\/](wagmi|viem|@rainbow-me|ethers)/.test(id)) return 'web3-vendor'
          if (/[\\/]node_modules[\\/](three|@react-three)/.test(id)) return 'three-vendor'
        }
      }
    }
  }
})
