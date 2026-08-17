import { motion } from "framer-motion";
import { LiFiWidget, WidgetConfig } from '@lifi/widget';
import AITradeInsights from "../../components/market/AITradeInsights";
import { useTheme } from "../../hooks/useTheme";

// Move config inside component so it can react to theme
export default function SwapInterface() {
  const { theme, accent } = useTheme();
  const isLight = theme === 'light';

  // Define accent colors
  const accentColors: Record<string, string> = {
    purple: '#6366f1',
    emerald: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b',
    blue: '#3b82f6',
    slate: '#64748b'
  };
  
  const currentAccent = accentColors[accent] || '#6366f1';

  const widgetConfig: WidgetConfig = {
    integrator: 'crypto-data-pipeline',
    theme: {
      palette: {
        mode: isLight ? 'light' : 'dark',
        primary: { main: currentAccent },
        background: {
          paper: isLight ? '#ffffff' : '#18181b', // Match var(--bg-elevated)
          default: isLight ? '#fafaf9' : '#09090b'
        },
      },
      shape: {
        borderRadius: 24,
        borderRadiusSecondary: 16
      },
      typography: {
        fontFamily: 'inherit'
      }
    },
    appearance: isLight ? 'light' : 'dark',
    hiddenUI: ['appearance', 'language', 'poweredBy'],
    variant: 'default' as any,
    subvariant: 'default' as any,
  };

  return (
    <div className="w-full">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-center gap-6 mt-8 max-w-5xl mx-auto w-full pb-32 relative"
      >
        
        {/* SWAP CARD - Li.Fi Widget */}
        <div className="relative w-full max-w-[420px] rounded-[24px] z-10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[var(--border-subtle)]">
          <LiFiWidget integrator="crypto-data-pipeline" config={widgetConfig} />
        </div>

        {/* Market Signals */}
        <div className="w-full md:w-[300px] shrink-0">
          <AITradeInsights onApplySuggestion={(tokenSymbol) => {
            // Because Li.Fi widget is a black box, we can't easily force its internal state 
            // without complex configuration re-renders. 
            // For now, AITradeInsights will just show the insights next to it.
            console.log("AI Suggested Token:", tokenSymbol);
          }} />
        </div>
        
      </motion.div>
    </div>
  );
}
