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

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
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
  }
})