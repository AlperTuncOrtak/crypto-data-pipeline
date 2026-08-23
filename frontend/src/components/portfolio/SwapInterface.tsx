import { useMemo } from "react";
import { motion } from "framer-motion";
import { LiFiWidget, type WidgetConfig } from "@lifi/widget";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import AITradeInsights from "../../components/market/AITradeInsights";
import { useTheme } from "../../hooks/useTheme";

// Must match the chains configured in main.tsx. The widget runs on the app's
// own wagmi connection, so offering a chain wagmi cannot switch to would leave
// the user stuck on a route they can never sign.
const SUPPORTED_CHAINS = [1, 137, 10, 42161, 8453];

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
  const { openConnectModal } = useConnectModal();
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
        <div className="relative w-full max-w-[420px] rounded-[24px] z-10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[var(--border-subtle)]">
          <LiFiWidget integrator="crypto-data-pipeline" config={widgetConfig} />
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
