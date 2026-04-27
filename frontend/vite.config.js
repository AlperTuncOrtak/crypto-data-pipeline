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

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})