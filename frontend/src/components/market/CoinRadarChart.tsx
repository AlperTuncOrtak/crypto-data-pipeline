import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { getCoinColor } from '../../utils/colors';

interface CoinRadarChartProps {
  coin: any;
}

export default function CoinRadarChart({ coin }: CoinRadarChartProps) {
  const { t } = useTranslation();
  
  // Base color from coin
  const color = getCoinColor(coin?.symbol);

  // Generate dynamic but stable data based on coin properties to make it look realistic
  const data = useMemo(() => {
    if (!coin) return [];
    
    // Seed from market cap rank or symbol length to keep it consistent per coin
    const seed = coin.market_cap_rank || (coin.symbol?.length || 5);
    const mcapRankFactor = Math.max(10, 100 - (coin.market_cap_rank || 100) / 10);
    
    // Momentum: high if price changed significantly
    const change24h = Math.abs(Number(coin.price_change_percentage_24h) || 0);
    const momentum = Math.min(100, 40 + change24h * 5);
    
    // Liquidity: high if volume is high
    const volume = Number(coin.total_volume) || 0;
    const liquidity = Math.min(100, Math.max(20, (Math.log10(volume + 1) / 11) * 100));
    
    // Volatility
    const volatility = Math.min(100, 30 + change24h * 3 + (seed % 20));
    
    // Community & Dev Activity (mocked but stable)
    const community = Math.min(100, mcapRankFactor + (seed % 15));
    const devActivity = Math.min(100, mcapRankFactor + ((seed * 3) % 25));

    return [
      { subject: 'Momentum', A: Math.round(momentum), fullMark: 100 },
      { subject: 'Volatility', A: Math.round(volatility), fullMark: 100 },
      { subject: 'Liquidity', A: Math.round(liquidity), fullMark: 100 },
      { subject: 'Community', A: Math.round(community), fullMark: 100 },
      { subject: 'Dev Activity', A: Math.round(devActivity), fullMark: 100 },
    ];
  }, [coin]);

  if (!coin || data.length === 0) return null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${color}44`,
          padding: '8px 12px',
          borderRadius: 8,
          boxShadow: `0 4px 20px ${color}22`
        }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{payload[0].payload.subject}</p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color }}>{payload[0].value} / 100</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 260, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name={coin.name}
            dataKey="A"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.35}
            activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
