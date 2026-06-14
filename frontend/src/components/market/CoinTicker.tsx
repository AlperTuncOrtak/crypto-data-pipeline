import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCoinColor } from '../../utils/colors';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function CoinTicker() {
  const [coins, setCoins] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTop = async () => {
      const { data } = await supabase
        .from('coins')
        .select('slug, symbol, name, current_price, price_change_percentage_24h, image_url')
        .order('market_cap_rank', { ascending: true })
        .limit(20);
      if (data) setCoins(data);
    };
    fetchTop();
    
    const interval = setInterval(fetchTop, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!coins || coins.length === 0) return null;

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
        .ticker-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 24px;
          cursor: pointer;
          border-right: 1px solid var(--border-soft);
          transition: background 0.2s;
          height: 38px;
        }
        .ticker-item:hover {
          background: var(--bg-surface);
        }
      `}</style>
      <div className="ticker-track">
        {[...coins, ...coins].map((c, i) => {
          const isUp = c.price_change_percentage_24h >= 0;
          const brandColor = getCoinColor(c.symbol);
          
          return (
            <div 
              key={`${c.slug}-${i}`} 
              className="ticker-item"
              onClick={() => navigate(`/coin/${c.slug}`)}
              style={{
                borderBottom: `2px solid ${brandColor}40`,
                background: `linear-gradient(to top, ${brandColor}08, transparent)`
              }}
            >
              {c.image_url && <img src={c.image_url} alt={c.symbol} style={{ width: 16, height: 16, borderRadius: '50%' }} />}
              <span style={{ 
                fontWeight: 800, 
                fontSize: 13, 
                color: brandColor,
                textShadow: `0 0 12px ${brandColor}50`
              }}>
                {c.symbol?.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                ${Number(c.current_price).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
              <span style={{ 
                fontSize: 12, 
                color: isUp ? 'var(--positive)' : 'var(--negative)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                fontWeight: 600
              }}>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(c.price_change_percentage_24h).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
