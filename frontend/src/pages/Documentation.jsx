import React, { useState } from 'react';
import { Book, Compass, LayoutDashboard, Brain, GitCompare } from 'lucide-react';

export default function Documentation() {
  const [activeTab, setActiveTab] = useState('getting-started');

  const tabs = [
    { id: 'getting-started', label: 'Getting Started', icon: Compass },
    { id: 'dashboard', label: 'Dashboard & Portfolio', icon: LayoutDashboard },
    { id: 'ai-analysis', label: 'AI Technical Analysis', icon: Brain },
    { id: 'compare', label: 'Compare & Correlation', icon: GitCompare },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-center gap-4 mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.05))',
          border: '1px solid rgba(245,166,35,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Book size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Guides and tutorials for CryptoNeko features</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Menu */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                style={{
                  backgroundColor: isActive ? 'rgba(245,166,35,0.1)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'rgba(245,166,35,0.2)' : 'transparent'}`,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <Icon size={18} />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 rounded-2xl p-6 md:p-10" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {activeTab === 'getting-started' && (
            <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Welcome to CryptoNeko</h2>
              <p>CryptoNeko is an advanced cryptocurrency tracking and analytics platform. Our goal is to provide institutional-grade tools to retail investors through an intuitive and premium interface.</p>
              
              <h3 className="text-lg font-semibold mt-8 mb-2" style={{ color: 'var(--text-primary)' }}>Key Features</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Real-time Market Data:</strong> Sourced from top exchanges via WebSockets.</li>
                <li><strong>AI-Powered Analysis:</strong> Instant technical analysis generation for any coin.</li>
                <li><strong>Advanced Comparisons:</strong> Correlation matrices and normalized historical charts.</li>
                <li><strong>Portfolio Tracking:</strong> Keep track of your investments and profitability in one place.</li>
              </ul>
              
              <div className="p-4 rounded-xl mt-8" style={{ backgroundColor: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.2)' }}>
                <p className="font-bold mb-1" style={{ color: 'var(--accent)' }}>Pro Tip</p>
                <p>Press <kbd style={{ padding: '2px 6px', background: '#111', borderRadius: 4, border: '1px solid #333' }}>Cmd</kbd> + <kbd style={{ padding: '2px 6px', background: '#111', borderRadius: 4, border: '1px solid #333' }}>K</kbd> anywhere on the site to quickly search for coins!</p>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Dashboard & Portfolio</h2>
              <p>The Dashboard is your main control center. It gives you a quick overview of the broader market trends, top gainers, and your personal portfolio status.</p>
              
              <h3 className="text-lg font-semibold mt-8 mb-2" style={{ color: 'var(--text-primary)' }}>Managing Your Portfolio</h3>
              <p>To add a coin to your portfolio:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Navigate to the <strong>Portfolio</strong> tab.</li>
                <li>Click the <strong>Add Transaction</strong> button.</li>
                <li>Select the coin, enter the quantity you bought, and the price per coin.</li>
                <li>Your total balance and Profit/Loss (PnL) will update automatically in real-time.</li>
              </ol>
            </div>
          )}

          {activeTab === 'ai-analysis' && (
            <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>AI Technical Analysis</h2>
              <p>Our flagship feature uses advanced language models trained on technical indicators to provide instant market breakdowns.</p>
              
              <h3 className="text-lg font-semibold mt-8 mb-2" style={{ color: 'var(--text-primary)' }}>How it Works</h3>
              <p>When you select a coin in the AI Analysis page, the system fetches:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>RSI, MACD, and Bollinger Bands data.</li>
                <li>Recent price action and volume trends.</li>
                <li>Support and resistance levels.</li>
              </ul>
              <p>This raw data is fed into our AI which generates a human-readable summary, a short-term trend prediction, and a risk assessment.</p>
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Compare & Correlation</h2>
              <p>Understanding how different coins move in relation to each other is crucial for building a diversified portfolio.</p>
              
              <h3 className="text-lg font-semibold mt-8 mb-2" style={{ color: 'var(--text-primary)' }}>Compare Coins</h3>
              <p>The Compare tool normalizes the prices of up to 5 coins so they all start at 0% for the selected time range. This allows you to easily see which asset outperformed the others over 1H, 24H, 7D, or 30D.</p>
              
              <h3 className="text-lg font-semibold mt-8 mb-2" style={{ color: 'var(--text-primary)' }}>Correlation Matrix</h3>
              <p>The Heatmap displays the Pearson correlation coefficient between coins:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>+1.0:</strong> Perfect positive correlation (they move exactly together).</li>
                <li><strong>0.0:</strong> No correlation.</li>
                <li><strong>-1.0:</strong> Perfect negative correlation (they move in opposite directions).</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
