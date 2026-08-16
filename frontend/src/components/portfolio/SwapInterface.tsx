import { motion } from "framer-motion";
import { LiFiWidget, WidgetConfig } from '@lifi/widget';
import AITradeInsights from "../../components/market/AITradeInsights";

const widgetConfig: WidgetConfig = {
  integrator: 'crypto-data-pipeline',
  theme: {
    palette: {
      mode: 'dark',
      primary: { main: '#14F195' },
      background: {
        paper: 'rgba(255, 255, 255, 0.04)', // match our GLASS_BG
        default: '#0a0b0d'
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
  appearance: 'dark',
  hiddenUI: ['appearance', 'language', 'poweredBy'],
  variant: 'default',
  subvariant: 'default',
};

export default function SwapInterface() {
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
