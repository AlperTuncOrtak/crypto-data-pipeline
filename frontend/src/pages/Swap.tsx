import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LiFiWidget, WidgetConfig } from '@lifi/widget';

export default function Swap() {
  const widgetConfig: WidgetConfig = useMemo(() => ({
    integrator: 'CryptoNeko',
    containerStyle: {
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '24px',
      boxShadow: '0 0 40px rgba(0,0,0,0.5)',
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
    },
    theme: {
      palette: {
        primary: { main: '#3b82f6' }, // Blue
        secondary: { main: '#8b5cf6' }, // Purple
        background: {
          default: 'rgba(25, 25, 28, 0.8)', // glassmorphism bg
          paper: 'rgba(22, 24, 28, 0.9)',
        },
        text: {
          primary: '#ffffff',
          secondary: '#9ca3af',
        },
      },
      shape: {
        borderRadius: 16,
        borderRadiusSecondary: 12,
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              backdropFilter: 'blur(16px)',
              backgroundColor: 'rgba(22, 24, 28, 0.6)',
            }
          }
        }
      }
    },
    appearance: 'dark',
    hiddenUI: ['appearance', 'language', 'poweredBy'],
  }), []);

  return (
    <div className="flex flex-col h-full pt-16 md:pt-24 px-4 pb-24 md:pb-6 relative z-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            In-App Swap
          </h1>
          <p className="text-gray-400">Trade instantly across 20+ chains with the best rates.</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex justify-center items-start mt-4"
      >
        <LiFiWidget config={widgetConfig} />
      </motion.div>
    </div>
  );
}
