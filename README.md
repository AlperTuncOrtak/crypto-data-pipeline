# 📈 CryptoNeko Analytics Platform

A production-ready, modern cryptocurrency analytics dashboard and data pipeline built with React (Vite), TailwindCSS, and Supabase. Features a premium glassmorphism UI, real-time market data, and an integrated AI Copilot.

⸻⸻⸻⸻⸻⸻

## 🚀 Features

### 💎 Premium Glassmorphism UI
- High-end dark mode aesthetics with neon hover effects (`var(--accent)`).
- Cyberpunk/Bloomberg Terminal inspired interactive components.
- Seamless transitions, blurred backgrounds (`backdrop-filter`), and radial-gradient lighting.

### 🧠 AI Copilot Widget
- Integrated AI assistant available on every page.
- Context-aware quick actions like "Analyze BTC" or "Market Sentiment".
- Typing indicators and a floating terminal-style UI.

### 📊 Real-Time Market Dashboard
- Live market stats (Total Volume, BTC Dominance, ETH Dominance).
- Top 10 coins by market cap with dynamic hover animations.
- Trending coins and Fear & Greed Index integration.
- Custom Volume Spike Radar and Market Oracle panels.

### 🚨 Advanced Alerts & Watchlist
- **Audio Notifications:** Synth/Sonar ping audio alerts powered by the browser's `AudioContext` API.
- Neon-glowing alert rows for high-priority market movements.
- Interactive Watchlist Sidebar with smooth slide-in animations.

### 🔐 Authentication (Supabase)
- Secure email/password login and signup.
- Google OAuth integration.
- Password strength meter, hCaptcha integration, and rate-limiting protection.

⸻⸻⸻⸻⸻⸻

## 🛠 Tech Stack

- **Frontend:** React 18, Vite, React Router DOM
- **Styling:** CSS Variables (Design System), TailwindCSS (`@import`), Glassmorphism techniques
- **Icons:** Lucide React
- **Backend & Auth:** Supabase (Auth & Database)
- **Security:** hCaptcha

⸻⸻⸻⸻⸻⸻

## 📂 Project Structure

```
crypto-data-pipeline/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/            # AI Chat Widget
│   │   │   ├── layout/        # Navbar, Footer, WatchlistSidebar
│   │   │   ├── market/        # Oracle, Radar, CoinList cards
│   │   │   └── ui/            # AuthModal, Skeletons
│   │   ├── hooks/             # Custom hooks (useAuth, useMarket, etc.)
│   │   ├── lib/               # Supabase client setup
│   │   ├── pages/             # Dashboard, Alerts, Portfolio, etc.
│   │   ├── App.jsx            # Main application routing
│   │   ├── index.css          # Core design system and variables
│   │   └── main.jsx           # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

⸻⸻⸻⸻⸻⸻

## ▶️ How to Run (Local)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AlperTuncOrtak/crypto-data-pipeline.git
   cd crypto-data-pipeline/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `frontend` directory and add your Supabase and hCaptcha keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

> **Note for Local Auth:** To test Google Login locally, ensure `http://localhost:5173` is added to the "Redirect URIs" section in your Supabase Authentication settings.

⸻⸻⸻⸻⸻⸻

## 👤 Author

**Alper Tunc Ortak**
🔗 [GitHub Profile](https://github.com/AlperTuncOrtak)
