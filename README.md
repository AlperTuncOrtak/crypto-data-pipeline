# 📈 CryptoNeko Analytics & AI Platform

A production-ready, full-stack cryptocurrency analytics dashboard and data pipeline built with **React (Vite)**, **Node.js/Express**, **TailwindCSS**, and **Supabase**. CryptoNeko combines a premium glassmorphism UI with **Llama 3.3 AI-driven technical analysis** to provide institutional-grade insights for retail traders.

⸻⸻⸻⸻⸻⸻

## 🚀 Key Features

### 🧠 AI Technical Analysis (Powered by Groq & Llama 3.3)
- **Live Signal Generation:** Processes 150+ technical indicators (RSI, MACD, Bollinger Bands) using Llama 3.3 to output actionable Bullish/Bearish/Neutral signals.
- **Paywalled "Pro" Features:** Protected routes for advanced AI capabilities, dynamically unlocked via Supabase database roles.
- **AI Copilot Widget:** Context-aware floating AI assistant available on every page for quick market sentiment checks.

### 📊 Real-Time Market Explorer
- **Live Polling Engine:** High-performance React Query architecture fetching live data for 2,500+ coins every 5 seconds (with `keepPreviousData` to ensure zero UI flickering).
- **Categorization Filters:** Instantly slice the market into *Majors (Top 20)*, *Altcoins*, *Low-Caps*, and *Micro-Caps/Shitcoins*.
- **Sparkline Charts:** Real-time mini charts for at-a-glance 24h price trend visualization.
- **Gas Heatmaps & Dominance:** Live Ethereum Gas trackers and BTC/ETH dominance metrics.

### 💎 Premium Modern Aesthetics
- **Dynamic Landing Page:** Features a live scrolling ticker tape connected directly to the market API, and floating glassmorphism UI elements.
- **Dark Mode Design System:** High-end aesthetics utilizing CSS variables, neon hover effects (`var(--accent)`), and custom radial gradients.
- **Mobile Responsive:** Flawless layout scaling from 4K desktop monitors down to mobile devices with custom bottom navigation.

### 🔐 Authentication & Security (Supabase)
- **Frictionless Auth:** Secure email/password and Google OAuth login/signup flows.
- **Security Layers:** Integrated hCaptcha, password strength meters, and rate-limiting protection.
- **Session Management:** Persistent sessions via Supabase Auth tokens.

### 🌍 SEO Optimized
- **Dynamic Meta Tags:** Automated SEO management via `react-helmet-async`, dynamically updating page titles, descriptions, and keywords.
- **Sitemap Generator:** Automated Node.js script generating `sitemap.xml` for Google Indexing.

⸻⸻⸻⸻⸻⸻

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 (Vite), React Router DOM
- **Data Fetching:** TanStack Query (React Query v5)
- **Styling:** Vanilla CSS Variables & TailwindCSS
- **Icons & UI:** Lucide React, Recharts (for analytics)
- **SEO:** React Helmet Async

### Backend & Infrastructure
- **Server:** Node.js, Express.js
- **Database & Auth:** Supabase (PostgreSQL)
- **AI Inference:** Groq API (Llama 3.3 70B)
- **Deployment:** Vercel (Frontend), Render/Railway (Backend)

⸻⸻⸻⸻⸻⸻

## 📂 Project Structure

```
crypto-data-pipeline/
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios clients and interceptors
│   │   ├── components/
│   │   │   ├── ai/            # AI Analysis & Chat Widgets
│   │   │   ├── layout/        # Navbar, Footer, ProtectedRoutes
│   │   │   ├── market/        # Sparklines, Heatmaps, CoinList
│   │   │   └── seo/           # SEO Helmet components
│   │   ├── hooks/             # React Query Hooks (useMarket, useSparklines)
│   │   ├── lib/               # Supabase client setup
│   │   ├── pages/             # Landing, Market, AIAnalysis, Auth
│   │   ├── App.tsx            # Main application routing
│   │   └── index.css          # Core design system & keyframes
│   ├── index.html
│   └── package.json
└── backend/
    ├── src/
    │   ├── controllers/       # Market Data & AI Logic
    │   ├── routes/            # Express endpoints
    │   └── server.js          # Express entry point
    └── package.json
```

⸻⸻⸻⸻⸻⸻

## ▶️ How to Run (Local Development)

### 1. Clone the repository:
```bash
git clone https://github.com/AlperTuncOrtak/crypto-data-pipeline.git
cd crypto-data-pipeline
```

### 2. Frontend Setup:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
```
Start the frontend:
```bash
npm run dev
```

### 3. Backend Setup:
```bash
cd ../backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=3000
GROQ_API_KEY=your_groq_api_key
```
Start the backend server:
```bash
npm run dev
```

> **Note:** To test the "Pro" features locally, create an account, then change your `plan` from `free` to `pro` inside your Supabase dashboard.

⸻⸻⸻⸻⸻⸻

## 👤 Author

**Alper Tunc Ortak**
🔗 [GitHub Profile](https://github.com/AlperTuncOrtak)
