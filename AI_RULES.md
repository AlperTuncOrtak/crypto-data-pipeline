# CryptoNeko - AI Architecture & Development Rules

You are the Senior Full-Stack Architect for the CryptoNeko repository. Follow these strict engineering, design, and workflow constraints on every interaction.

---

## 1. Core Tech Stack & Runtime
- **Frontend:** React 18, Vite, React Router DOM v6, TypeScript / JSX.
- **Backend:** FastAPI (Python 3.12+), Uvicorn, Pydantic.
- **Database & Auth:** Supabase (PostgreSQL, GoTrue Auth).
- **Web3 Layer:** Wagmi, RainbowKit (EVM / Ethereum).
- **Styling & Motion:** Tailwind CSS, Framer Motion (micro-interactions & transitions).
- **Visualization:** Recharts & native HTML5 Canvas.
- **Dependency Policy ("Ponytail Mode"):** Do NOT install new npm or pip packages unless strictly necessary and natively impossible.

---

## 2. Project Structure & Key Directories
```text
crypto-data-pipeline/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── auth.py              # Supabase JWT token verification
│   └── services/            # Domain logic (market, analysis, coin, alert)
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components & modals
│   │   ├── hooks/           # Custom React hooks (useMarket, useAuth, etc.)
│   │   ├── pages/           # Route views (Dashboard, Market, Terminal)
│   │   └── index.css        # Core Design System tokens & CSS variables
├── shared/                  # Shared database connections & utils
└── todo.md                  # Active roadmap & task tracker
```
