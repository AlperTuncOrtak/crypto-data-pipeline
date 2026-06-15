import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoinColor } from '../../utils/colors';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

// A focused list of top coins to track in the global ticker
const TOP_COINS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", 
  "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "DOTUSDT", 
  "MATICUSDT", "LTCUSDT", "SHIBUSDT", "TRXUSDT"
];

// Helper to get the base asset symbol (e.g., BTCUSDT -> BTC)
const getBaseAsset = (symbol: string) => symbol.replace('USDT', '');

interface TickerData {
  s: string;  // Symbol
  c: string;  // Current price
  P: string;  // Price change percent
  p: string;  // Price change
}

// Subcomponent to handle individual coin flashing animations
const TickerItem = ({ data, onClick }: { data: TickerData, onClick: () => void }) => {
  const baseAsset = getBaseAsset(data.s);
  const brandColor = getCoinColor(baseAsset);
  
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const prevPriceRef = useRef(data.c);

  useEffect(() => {
    if (data.c !== prevPriceRef.current) {
      const isUp = Number(data.c) > Number(prevPriceRef.current);
      setFlashColor(isUp ? 'rgba(40, 200, 64, 0.4)' : 'rgba(255, 95, 87, 0.4)');
      prevPriceRef.current = data.c;
      
      const timer = setTimeout(() => {
        setFlashColor(null);
      }, 300); // Flash duration
      return () => clearTimeout(timer);
    }
  }, [data.c]);

  const priceChangePct = Number(data.P);
  const isUpDaily = priceChangePct >= 0;

  return (
    <motion.div 
      className="ticker-item"
      onClick={onClick}
      animate={{ backgroundColor: flashColor || 'transparent' }}
      transition={{ duration: 0.3 }}
      style={{
        borderBottom: `2px solid ${brandColor}40`,
        background: `linear-gradient(to top, ${brandColor}08, transparent)`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 24px',
        cursor: 'pointer',
        borderRight: '1px solid var(--border-soft)',
        height: '38px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span style={{ 
          fontWeight: 800, 
          fontSize: 13, 
          color: brandColor,
          textShadow: `0 0 8px ${brandColor}`
        }}>
          {baseAsset}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
          USDT
        </span>
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
        ${Number(data.c).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
      </span>
      <span style={{ 
        fontSize: 12, 
        color: isUpDaily ? 'var(--positive)' : 'var(--negative)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        fontWeight: 600
      }}>
        {isUpDaily ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
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
