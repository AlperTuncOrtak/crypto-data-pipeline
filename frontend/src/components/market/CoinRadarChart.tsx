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

  // Generate 100% REAL data based on actual coin metrics
  const data = useMemo(() => {
    if (!coin) return [];
    
    // 1. Momentum: Based on 24h price change. 
    // If it changes 10%, it's very high momentum (score 80+).
    const change24h = Math.abs(Number(coin.price_change_percentage_24h) || 0);
    const momentum = Math.min(100, Math.max(10, change24h * 8));
    
    // 2. Liquidity: Volume / Market Cap ratio
    // If volume is 10% of market cap, it's highly liquid (score 80+).
    const volume = Number(coin.total_volume) || 0;
    const mcap = Number(coin.market_cap) || 1;
    const volToMcapRatio = volume / mcap;
    const liquidity = Math.min(100, Math.max(10, volToMcapRatio * 800));
    
    // 3. Volatility: High - Low ratio in 24h
    const high = Number(coin.high_24h) || 0;
    const low = Number(coin.low_24h) || 0;
    const current = Number(coin.current_price) || 1;
    const spread = high > 0 && low > 0 ? (high - low) / current : 0;
    const volatility = Math.min(100, Math.max(10, spread * 1000)); // 10% spread = 100 score
    
    // 4. Resilience (Direnç): How close to ATH? 
    // If -5% from ATH, score is 95. If -90%, score is 10.
    const athChange = Number(coin.ath_change_percentage) || -100;
    const resilience = Math.min(100, Math.max(10, 100 + athChange));
    
    // 5. Market Power (Piyasa Gücü): Based on Rank
    // Rank 1 = 100, Rank 100 = 60, Rank 1000 = 10
    const rank = Number(coin.market_cap_rank) || 1000;
    const marketPower = Math.max(10, 100 - Math.log10(rank) * 30);

    return [
      { subject: 'Momentum', A: Math.round(momentum), fullMark: 100 },
      { subject: 'Volatility', A: Math.round(volatility), fullMark: 100 },
      { subject: 'Liquidity', A: Math.round(liquidity), fullMark: 100 },
      { subject: 'Resilience', A: Math.round(resilience), fullMark: 100 },
      { subject: 'Market Power', A: Math.round(marketPower), fullMark: 100 },
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
