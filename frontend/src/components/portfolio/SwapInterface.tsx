import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LiFiWidget, type WidgetConfig } from "@lifi/widget";
import type { StaticToken } from "@lifi/sdk";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import AITradeInsights from "../../components/market/AITradeInsights";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

// Must match the chains configured in main.tsx. The widget runs on the app's
// own wagmi connection, so offering a chain wagmi cannot switch to would leave
// the user stuck on a route they can never sign.
const SUPPORTED_CHAINS = [1, 137, 10, 42161, 8453];

/**
 * Tokens pinned to the top of the picker.
 *
 * LI.FI's list carries every token that exists on a chain, including clones
 * that reuse a real ticker — searching "btc" or "usdc" buried the genuine one
 * among impostors. Addresses below were generated from LI.FI's own /v1/tokens
 * response, keeping only entries whose `coinKey` equals the symbol: that field
 * marks their canonical record and is empty on the clones (the fake mainnet
 * "USDC" at 0x2F21c6… priced at $11 has no coinKey).
 *
 * Regenerate with:
 *   curl -s "https://li.quest/v1/tokens?chains=1,10,137,8453,42161"
 *   then keep tokens where coinKey === symbol.
 */
const FEATURED_TOKENS: StaticToken[] = [
  // Ethereum
  { chainId: 1, address: "0x0000000000000000000000000000000000000000", symbol: "ETH", decimals: 18, name: "ETH" },
  { chainId: 1, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6, name: "USDT" },
  { chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6, name: "USD Coin" },
  { chainId: 1, address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", decimals: 8, name: "WBTC" },
  { chainId: 1, address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", symbol: "LINK", decimals: 18, name: "Chainlink" },
  { chainId: 1, address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", symbol: "cbBTC", decimals: 8, name: "Coinbase Wrapped BTC" },
  { chainId: 1, address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", symbol: "WETH", decimals: 18, name: "WETH" },
  { chainId: 1, address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", decimals: 18, name: "DAI Stablecoin" },
  { chainId: 1, address: "0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3F6", symbol: "POL", decimals: 18, name: "Polygon Ecosystem Token" },
  // Arbitrum
  { chainId: 42161, address: "0x0000000000000000000000000000000000000000", symbol: "ETH", decimals: 18, name: "ETH" },
  { chainId: 42161, address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", symbol: "USDC", decimals: 6, name: "USD Coin" },
  { chainId: 42161, address: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4", symbol: "LINK", decimals: 18, name: "ChainLink Token" },
  { chainId: 42161, address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", symbol: "cbBTC", decimals: 8, name: "Coinbase Wrapped BTC" },
  { chainId: 42161, address: "0x912CE59144191C1204E64559FE8253a0e49E6548", symbol: "ARB", decimals: 18, name: "Arbitrum" },
  { chainId: 42161, address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", symbol: "WBTC", decimals: 8, name: "WBTC" },
  { chainId: 42161, address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", symbol: "WETH", decimals: 18, name: "WETH" },
  { chainId: 42161, address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", symbol: "DAI", decimals: 18, name: "DAI Stablecoin" },
  { chainId: 42161, address: "0x044d8e7F3A17751D521efEa8CCf9282268fE08CC", symbol: "POL", decimals: 18, name: "Polygon Ecosystem Token" },
  // Base
  { chainId: 8453, address: "0x0000000000000000000000000000000000000000", symbol: "ETH", decimals: 18, name: "ETH" },
  { chainId: 8453, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6, name: "USD Coin" },
  { chainId: 8453, address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c", symbol: "WBTC", decimals: 8, name: "Wrapped BTC" },
  { chainId: 8453, address: "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196", symbol: "LINK", decimals: 18, name: "ChainLink Token" },
  { chainId: 8453, address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, name: "Wrapped Ether" },
  { chainId: 8453, address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", symbol: "USDT", decimals: 6, name: "Tether USD" },
  { chainId: 8453, address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", symbol: "DAI", decimals: 18, name: "DAI Stablecoin" },
  // Optimism
  { chainId: 10, address: "0x0000000000000000000000000000000000000000", symbol: "ETH", decimals: 18, name: "ETH" },
  { chainId: 10, address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", symbol: "USDC", decimals: 6, name: "USD Coin" },
  { chainId: 10, address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095", symbol: "WBTC", decimals: 8, name: "WBTC" },
  { chainId: 10, address: "0x4200000000000000000000000000000000000042", symbol: "OP", decimals: 18, name: "OPTIMISM" },
  { chainId: 10, address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", symbol: "USDT", decimals: 6, name: "USDT" },
  { chainId: 10, address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, name: "Wrapped ETH" },
  { chainId: 10, address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", symbol: "DAI", decimals: 18, name: "DAI Stablecoin" },
  // Polygon
  { chainId: 137, address: "0x0000000000000000000000000000000000000000", symbol: "POL", decimals: 18, name: "Polygon Ecosystem Token" },
  { chainId: 137, address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", symbol: "USDC", decimals: 6, name: "USD Coin" },
  { chainId: 137, address: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", symbol: "LINK", decimals: 18, name: "Chainlink" },
  { chainId: 137, address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", decimals: 6, name: "USDT" },
  { chainId: 137, address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", symbol: "DAI", decimals: 18, name: "(PoS) DAI Stablecoin" },
  { chainId: 137, address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", symbol: "WETH", decimals: 18, name: "Wrapped Ether" },
  { chainId: 137, address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", symbol: "WBTC", decimals: 8, name: "WBTC" },
];

/**
 * Where the widget persists in-flight swaps (zustand persist, no keyPrefix set
 * so the default prefix applies).
 *
 * A swap that is never signed stays "Signature required" forever: the widget
 * renders its own delete button only once a route reaches Failed, so a pending
 * one has no dismiss path anywhere in its UI. That row lives inside the
 * widget's own DOM, so the dismiss control has to sit outside it.
 */
const ROUTES_STORAGE_KEY = "li.fi-widget-routes";

/** Widget's RouteExecutionStatus bitflags: Idle 1, Pending 2, Done 4, Failed 8. */
const STATUS_DONE = 4;

interface StuckSwap {
  id: string;
  from: string;
  to: string;
}

/** Unfinished routes only — completed ones are history worth keeping. */
function readStuckSwaps(): StuckSwap[] {
  try {
    const raw = localStorage.getItem(ROUTES_STORAGE_KEY);
    if (!raw) return [];
    const routes = JSON.parse(raw)?.state?.routes || {};
    return Object.entries(routes)
      .filter(([, entry]: [string, any]) => !((entry?.status ?? 0) & STATUS_DONE))
      .map(([id, entry]: [string, any]) => ({
        id,
        from: entry?.route?.fromToken?.symbol || "?",
        to: entry?.route?.toToken?.symbol || "?",
      }));
  } catch {
    return [];
  }
}

function deleteStuckSwap(id: string) {
  try {
    const raw = localStorage.getItem(ROUTES_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.state?.routes) {
      delete parsed.state.routes[id];
      localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch {
    // A corrupt store is worth dropping entirely rather than leaving stuck.
    localStorage.removeItem(ROUTES_STORAGE_KEY);
  }
}

const ACCENT_COLORS: Record<string, string> = {
  purple: "#6366f1",
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  blue: "#3b82f6",
  slate: "#64748b",
};

export default function SwapInterface() {
  const { theme, accent } = useTheme();
  const { t } = useTranslation();
  const { openConnectModal } = useConnectModal();
  const [stuckSwaps, setStuckSwaps] = useState<StuckSwap[]>(readStuckSwaps);
  // Remounting drops the widget's in-memory copy; clearing storage alone
  // would leave the stale row on screen until a reload.
  const [widgetKey, setWidgetKey] = useState(0);

  const dismissSwap = useCallback((id: string) => {
    deleteStuckSwap(id);
    setStuckSwaps(readStuckSwaps());
    setWidgetKey((k) => k + 1);
  }, []);
  const isLight = theme === "light";
  const currentAccent = ACCENT_COLORS[accent] || "#6366f1";

  const widgetConfig: WidgetConfig = useMemo(
    () => ({
      integrator: "crypto-data-pipeline",
      variant: "compact",
      subvariant: "default",
      appearance: isLight ? "light" : "dark",
      hiddenUI: ["appearance", "language", "poweredBy"],
      chains: { allow: SUPPORTED_CHAINS },
      tokens: { featured: FEATURED_TOKENS },
      // Hands wallet connection back to the app. Without this the widget opens
      // its own connector list and the user would have to connect a second
      // time even though the portfolio already has their wallet.
      walletConfig: { onConnect: () => openConnectModal?.() },
      theme: {
        palette: {
          mode: isLight ? "light" : "dark",
          primary: { main: currentAccent },
          background: {
            paper: isLight ? "#ffffff" : "#18181b", // var(--bg-elevated)
            default: isLight ? "#fafaf9" : "#09090b", // var(--bg-base)
          },
        },
        shape: { borderRadius: 24, borderRadiusSecondary: 16 },
        typography: { fontFamily: "inherit" },
      },
    }),
    [isLight, currentAccent, openConnectModal]
  );

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-center gap-6 mt-8 max-w-5xl mx-auto w-full pb-32 relative"
      >
        <div className="w-full max-w-[420px] flex flex-col gap-3">
          {stuckSwaps.length > 0 && (
            <div className="rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-base)] overflow-hidden">
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                {t("portfolio.swap.unfinished")}
              </div>
              {stuckSwaps.map((swap) => (
                <div key={swap.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-[12px] font-bold text-[var(--text-main)] truncate">
                    {swap.from} → {swap.to}
                  </span>
                  <button
                    onClick={() => dismissSwap(swap.id)}
                    title={t("portfolio.swap.dismiss")}
                    className="p-1 rounded-lg text-[var(--text-faint)] hover:text-[var(--negative)] hover:bg-[var(--negative-muted)] transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        <div className="relative w-full rounded-[24px] z-10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[var(--border-subtle)]">
          {/* The widget mounts its own <Routes> into the host router (it checks
              useInRouterContext and only falls back to MemoryRouter when there
              is none). Its home path is '/', so the route that renders this
              component must be a splat — see App.tsx "/portfolio/*". Without
              it the widget matched /portfolio against its own routes and
              rendered its 404 page. */}
          <LiFiWidget key={widgetKey} integrator="crypto-data-pipeline" config={widgetConfig} />
        </div>
        </div>

        {/* Market Signals */}
        <div className="w-full md:w-[300px] shrink-0">
          <AITradeInsights
            onApplySuggestion={(tokenSymbol) => {
              // The widget owns its own form state and exposes no imperative
              // API to preset it, so the insights panel stays advisory.
              console.log("AI suggested token:", tokenSymbol);
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
