import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Activity, ShieldAlert, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

export default function AttackMomentum({ symbol, brandColor }: { symbol: string, brandColor: string }) {
  const { t } = useTranslation();
  
  // We'll generate a fake stream of momentum data for the visual
  // In a real app, this would come from a websocket providing orderbook or volume pressure
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [commentaryIndex, setCommentaryIndex] = useState(0);

  // Simulated AI commentary (could be dynamically generated from ChatGPT in real app)
  const commentaries = useMemo(() => [
    { type: 'bull', text: `Bulls are dominating ${symbol} order flow! High buying pressure detected.`, icon: <TrendingUp size={14} color="#28c840" /> },
    { type: 'neutral', text: `Midfield battle: Price consolidating with low volume.`, icon: <Activity size={14} color="#888" /> },
    { type: 'bear', text: `Heavy selling pressure! Bears are attacking the support level.`, icon: <TrendingDown size={14} color="#ff5f57" /> },
    { type: 'bull', text: `Sudden volume spike! Bulls are breaking through resistance.`, icon: <Zap size={14} color="#febc2e" /> },
    { type: 'neutral', text: `Market algorithms detecting a tightening range.`, icon: <Target size={14} color="#00c6ff" /> },
    { type: 'bear', text: `Whale transfer detected: Possible incoming dump by bears.`, icon: <ShieldAlert size={14} color="#ff5f57" /> },
  ], [symbol]);

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
      
      // Randomly change commentary every ~5-10 seconds
      if (Math.random() > 0.7) {
        setCommentaryIndex(Math.floor(Math.random() * 6));
      }
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

      {/* AI Commentary Feed */}
      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        background: 'var(--bg-surface)', 
        borderRadius: 8, 
        border: '1px solid var(--border-soft)',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{ padding: 6, background: 'var(--card-bg)', borderRadius: '50%' }}>
          {commentaries[commentaryIndex].icon}
        </div>
        <motion.div 
          key={commentaryIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ flex: 1 }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {commentaries[commentaryIndex].text}
          </span>
        </motion.div>
        
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          LIVE
        </div>
      </div>
    </div>
  );
}
