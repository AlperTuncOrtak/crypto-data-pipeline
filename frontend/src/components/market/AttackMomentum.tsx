import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Activity, ShieldAlert, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

export default function AttackMomentum({ symbol, brandColor }: { symbol: string, brandColor: string }) {
  const { t } = useTranslation();
  
  // We'll generate a fake stream of momentum data for the visual
  // In a real app, this would come from a websocket providing orderbook or volume pressure
  const [dataPoints, setDataPoints] = useState<number[]>([]);

  useEffect(() => {
    // Generate initial history (50 bars)
    const history = Array.from({ length: 50 }, () => {
      // Return a value between -100 (Bear max) and 100 (Bull max)
      return Math.floor(Math.random() * 200) - 100;
    });
    setDataPoints(history);

    // Simulate live ticking
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const nextVal = prev[prev.length - 1] + (Math.floor(Math.random() * 60) - 30);
        // clamp to -100 / 100
        const clamped = Math.max(-100, Math.min(100, nextVal));
        return [...prev.slice(1), clamped];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const currentMomentum = dataPoints[dataPoints.length - 1] || 0;
  const isBullish = currentMomentum >= 0;

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 8, height: 8, borderRadius: '50%', 
            background: isBullish ? '#28c840' : '#ff5f57',
            boxShadow: `0 0 10px ${isBullish ? '#28c840' : '#ff5f57'}`
          }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Live Attack Momentum</h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Real-Time Pressure
        </div>
      </div>

      {/* The Momentum Graph Area */}
      <div style={{ 
        position: 'relative', 
        height: 120, 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: 12, 
        padding: '10px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border-soft)'
      }}>
        {/* Zero Line */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'var(--border)', top: '50%', zIndex: 0 }} />
        
        {/* Bars Container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%', width: '100%', padding: '0 10px', position: 'relative', zIndex: 1 }}>
          {dataPoints.map((val, idx) => {
            const isPos = val >= 0;
            const heightPct = Math.abs(val); // 0 to 100
            
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: isPos ? 'flex-end' : 'flex-start', height: '100%' }}>
                {isPos ? (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct / 2}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{ 
                      width: '100%', 
                      background: `linear-gradient(to top, #28c840, #00ff44)`,
                      borderRadius: '2px 2px 0 0',
                      opacity: idx === dataPoints.length - 1 ? 1 : 0.6
                    }} 
                  />
                ) : (
                  <div style={{ height: '50%', width: '100%' }} /> /* Placeholder to push negative bar down */
                )}
                
                {!isPos ? (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct / 2}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{ 
                      width: '100%', 
                      background: `linear-gradient(to bottom, #ff5f57, #ff0000)`,
                      borderRadius: '0 0 2px 2px',
                      opacity: idx === dataPoints.length - 1 ? 1 : 0.6
                    }} 
                  />
                ) : (
                  <div style={{ height: '50%', width: '100%' }} /> /* Placeholder for bottom half */
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Clean Metrics Feed */}
      <div style={{ 
        marginTop: 16, 
        padding: "12px 16px", 
        background: 'var(--bg-surface)', 
        borderRadius: 8, 
        border: '1px solid var(--border-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isBullish ? '#28c840' : '#ff5f57', boxShadow: `0 0 8px ${isBullish ? '#28c840' : '#ff5f57'}` }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBullish ? "Buying Pressure Dominant" : "Selling Pressure Dominant"}
          </span>
        </div>
        
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: isBullish ? '#28c840' : '#ff5f57' }}>
          {isBullish ? '+' : ''}{currentMomentum}%
        </div>
      </div>
    </div>
  );
}
