import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoinColor } from '../../utils/colors';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// A focused list of top coins to track in the global ticker
const TOP_COINS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", 
  "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "DOTUSDT", 
  "MATICUSDT", "LTCUSDT", "SHIBUSDT", "TRXUSDT"
];

// Helper to get the base asset symbol (e.g., BTCUSDT -> BTC)
const getBaseAsset = (symbol: string) => symbol.toUpperCase().replace('USDT', '').replace('BUSD', '').replace('FDUSD', '');

export interface TickerData {
  s: string;  // Symbol
  c: string;  // Current price
  P: string;  // Price change percent
  p: string;  // Price change
}

// Subcomponent to handle individual coin flashing animations
const TickerItem = ({ data, onClick }: { data: TickerData, onClick: () => void }) => {
  const baseAsset = getBaseAsset(data.s);
  const brandColor = getCoinColor(baseAsset);
  
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(data.c);

  useEffect(() => {
    if (data.c !== prevPriceRef.current) {
      const isUp = Number(data.c) > Number(prevPriceRef.current);
      setFlash(isUp ? 'up' : 'down');
      prevPriceRef.current = data.c;
      
      const timer = setTimeout(() => {
        setFlash(null);
      }, 400); // Slightly longer for a nice fade
      return () => clearTimeout(timer);
    }
  }, [data.c]);

  const priceChangePct = Number(data.P);
  const isUpDaily = priceChangePct >= 0;

  // Flash colors
  const green = '#22c55e';
  const red = '#ef4444';
  
  let currentPriceColor = 'var(--text-primary)';
  let currentTextShadow = 'none';
  let currentBg = `linear-gradient(to top, ${brandColor}08, transparent)`;

  if (flash === 'up') {
    currentPriceColor = green;
    currentTextShadow = `0 0 12px ${green}80`;
    currentBg = `linear-gradient(to top, ${green}20, transparent)`;
  } else if (flash === 'down') {
    currentPriceColor = red;
    currentTextShadow = `0 0 12px ${red}80`;
    currentBg = `linear-gradient(to top, ${red}20, transparent)`;
  }

  return (
    <motion.div 
      className="ticker-item"
      onClick={onClick}
      animate={{ background: currentBg }}
      transition={{ duration: 0.3 }}
      style={{
        borderBottom: `2px solid ${brandColor}40`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 24px',
        cursor: 'pointer',
        borderRight: '1px solid var(--border-soft)',
        height: '42px', // Slightly taller for breathing room
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: brandColor, boxShadow: `0 0 10px ${brandColor}` }} />
        <span style={{ 
          fontWeight: 800, 
          fontSize: 14, 
          color: '#fff',
          letterSpacing: '0.02em'
        }}>
          {baseAsset}
        </span>
      </div>
      
      <motion.span 
        animate={{ color: currentPriceColor, textShadow: currentTextShadow }}
        transition={{ duration: 0.2 }}
        style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700 }}
      >
        ${Number(data.c).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
      </motion.span>
      
      <span style={{ 
        fontSize: 13, 
        color: isUpDaily ? green : red,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        fontWeight: 700,
        fontFamily: 'monospace'
      }}>
        {isUpDaily ? <ArrowUp size={14} strokeWidth={3} /> : <ArrowDown size={14} strokeWidth={3} />}
        {Math.abs(priceChangePct).toFixed(2)}%
      </span>
    </motion.div>
  );
};

export default function CoinTicker() {
  const [tickerMap, setTickerMap] = useState<Record<string, TickerData>>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Connect to Binance WebSocket for all tickers
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

    ws.onmessage = (event) => {
      try {
        const data: TickerData[] = JSON.parse(event.data);
        const updates: Record<string, TickerData> = {};
        
        // Filter out only the top coins we care about
        for (const item of data) {
          if (TOP_COINS.includes(item.s)) {
            updates[item.s] = item;
          }
        }

        if (Object.keys(updates).length > 0) {
          setTickerMap(prev => ({ ...prev, ...updates }));
        }
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    return () => ws.close();
  }, []);

  // Sort by our predefined order to keep the ticker consistent
  const activeCoins = TOP_COINS.map(sym => tickerMap[sym]).filter(Boolean);

  if (activeCoins.length === 0) return null;

  return (
    <div style={{
      width: '100%',
      background: 'rgba(12, 12, 22, 0.65)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      height: 38,
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      zIndex: 50
    }}>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: ticker 40s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="ticker-track">
        {/* Double the list for infinite marquee scrolling effect */}
        {[...activeCoins, ...activeCoins].map((c, i) => (
          <TickerItem 
            key={`${c.s}-${i}`} 
            data={c} 
            onClick={() => navigate(`/coin/${getBaseAsset(c.s).toLowerCase()}`)} 
          />
        ))}
      </div>
    </div>
  );
}
