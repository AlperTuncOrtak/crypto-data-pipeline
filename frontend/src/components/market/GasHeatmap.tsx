import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

const NETWORKS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    rpc: 'https://ethereum-rpc.publicnode.com',
    icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    highThreshold: 30, // gwei
    mediumThreshold: 15,
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    rpc: 'https://arb1.arbitrum.io/rpc',
    icon: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
    highThreshold: 0.1,
    mediumThreshold: 0.05,
  },
  {
    id: 'optimism',
    name: 'Optimism',
    rpc: 'https://mainnet.optimism.io',
    icon: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
    highThreshold: 0.05,
    mediumThreshold: 0.01,
  },
  {
    id: 'base',
    name: 'Base',
    rpc: 'https://mainnet.base.org',
    icon: 'https://assets.coingecko.com/coins/images/32281/small/base.png',
    highThreshold: 0.05,
    mediumThreshold: 0.01,
  },
  {
    id: 'polygon',
    name: 'Polygon',
    rpc: 'https://polygon.drpc.org',
    icon: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    highThreshold: 150,
    mediumThreshold: 50,
  }
];

export default function GasHeatmap() {
  const [gasData, setGasData] = useState({});

  const fetchGas = async () => {
    NETWORKS.forEach(async (net) => {
      try {
        const res = await fetch(net.rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 1 })
        });
        const data = await res.json();
        if (data && data.result) {
          const gwei = parseInt(data.result, 16) / 1e9;
          setGasData(prev => ({ ...prev, [net.id]: gwei }));
        }
      } catch (e) {
        console.error(`Failed to fetch gas for ${net.name}`, e);
      }
    });
  };

  useEffect(() => {
    fetchGas();
    const interval = setInterval(fetchGas, 15000); // every 15s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (net, gwei) => {
    if (!gwei) return 'var(--text-muted)';
    if (gwei >= net.highThreshold) return '#e74c3c'; // Red
    if (gwei >= net.mediumThreshold) return '#f39c12'; // Yellow
    return '#2ecc71'; // Green
  };

  return (
    <div style={{
      marginBottom: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 6
      }}>
        <Activity size={14} /> Network Heatmap
      </div>
      
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
        scrollbarWidth: 'none', msOverflowStyle: 'none'
      }} className="hide-scrollbar">
        {NETWORKS.map(net => {
          const gwei = gasData[net.id];
          const color = getStatusColor(net, gwei);
          
          return (
            <div key={net.id} className="glass-panel" style={{
              borderRadius: 24,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 'fit-content',
              cursor: 'default',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'var(--transition-smooth)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                <img src={net.icon} alt={net.name} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 8, height: 8, borderRadius: '50%',
                  background: color,
                  border: '2px solid var(--bg-elevated)',
                  boxShadow: `0 0 6px ${color}`
                }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {net.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {gwei ? (
                    <span style={{ color: color, fontWeight: 600 }}>
                      {gwei < 1 ? gwei.toFixed(3) : gwei.toFixed(1)} Gwei
                    </span>
                  ) : '...'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
