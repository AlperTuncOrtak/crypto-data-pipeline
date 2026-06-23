import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function AttackMomentum({ symbol, brandColor }: { symbol: string, brandColor: string }) {
  const { t } = useTranslation();
  
  // Real-time momentum data
  const [dataPoints, setDataPoints] = useState<number[]>(Array(50).fill(0));
  const [currentMomentum, setCurrentMomentum] = useState<number>(0);
  
  const buyVolumeRef = useRef<number>(0);
  const sellVolumeRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Reset data when symbol changes
    setDataPoints(Array(50).fill(0));
    setCurrentMomentum(0);
    buyVolumeRef.current = 0;
    sellVolumeRef.current = 0;

    if (!symbol) return;

    const streamName = `${symbol.toLowerCase()}usdt@aggTrade`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;

    const connectWs = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.e === "aggTrade") {
            const price = parseFloat(data.p);
            const quantity = parseFloat(data.q);
            const isBuyerMaker = data.m; // true means seller was taker (sell pressure), false means buyer was taker (buy pressure)
            const volume = price * quantity;

            if (isBuyerMaker) {
              sellVolumeRef.current += volume;
            } else {
              buyVolumeRef.current += volume;
            }
          }
        } catch (err) {
          console.error("Error parsing aggTrade", err);
        }
      };

      ws.onerror = (err) => {
        console.error("Binance WS error", err);
      };
    };

    connectWs();

    // Ticker to calculate momentum every 2 seconds
    const interval = setInterval(() => {
      const buyVol = buyVolumeRef.current;
      const sellVol = sellVolumeRef.current;
      const totalVol = buyVol + sellVol;

      // Calculate momentum as a percentage (-100 to 100)
      let momentum = 0;
      if (totalVol > 0) {
        momentum = ((buyVol - sellVol) / totalVol) * 100;
      }

      setCurrentMomentum(momentum);
      setDataPoints(prev => {
        return [...prev.slice(1), momentum];
      });

      // Reset accumulators
      buyVolumeRef.current = 0;
      sellVolumeRef.current = 0;
    }, 2000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol]);

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
            boxShadow: "none"
          }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t("coin_detail.live_order_flow", "Live Order Flow")}</h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t("coin_detail.real_time_pressure", "Real-Time Pressure")}
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
            {isBullish ? t("coin_detail.buying_pressure", "Buying Pressure Dominant") : t("coin_detail.selling_pressure", "Selling Pressure Dominant")}
          </span>
        </div>
        
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: isBullish ? '#28c840' : '#ff5f57' }}>
          {isBullish ? '+' : ''}{currentMomentum.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
