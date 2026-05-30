import React, { useState } from 'react';
import { Book, Compass, LayoutDashboard, Brain, GitCompare, Zap, Shield, Search, ArrowRight, Activity, PieChart, TrendingUp, Network } from 'lucide-react';

// Custom Card Component for Features
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 group" 
       style={{ 
         backgroundColor: 'rgba(255,255,255,0.02)', 
         border: '1px solid rgba(255,255,255,0.05)',
       }}>
    <div className="mb-4 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
         style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#f5a623' }}>
      <Icon size={20} />
    </div>
    <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
  </div>
);

// Custom Callout / Alert Component
const Callout = ({ title, children, icon: Icon = Zap }) => (
  <div className="my-8 p-5 rounded-2xl flex gap-4 items-start relative overflow-hidden" 
       style={{ 
         backgroundColor: 'rgba(245,166,35,0.03)', 
         border: '1px solid rgba(245,166,35,0.2)' 
       }}>
    {/* Subtle background glow */}
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#f5a623] opacity-5 blur-3xl rounded-full"></div>
    <div className="shrink-0 mt-1">
      <Icon size={20} style={{ color: '#f5a623' }} />
    </div>
    <div>
      <h4 className="text-sm font-bold mb-1" style={{ color: '#f5a623' }}>{title}</h4>
      <div className="text-sm text-gray-300 leading-relaxed">
        {children}
      </div>
    </div>
  </div>
);

export default function Documentation() {
  const [activeTab, setActiveTab] = useState('getting-started');

  const tabs = [
    { id: 'getting-started', label: 'Getting Started', icon: Compass },
    { id: 'dashboard', label: 'Dashboard & Portfolio', icon: LayoutDashboard },
    { id: 'ai-analysis', label: 'AI Technical Analysis', icon: Brain },
    { id: 'compare', label: 'Compare & Correlation', icon: GitCompare },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          Documentation
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
          Everything you need to know about CryptoNeko. Learn how to track your portfolio, generate AI insights, and analyze the market like a pro.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 relative">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="sticky top-28 flex flex-col gap-1">
            <div className="mb-6 px-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-gray-400 text-sm">
                <Search size={16} />
                <span className="flex-1">Search docs...</span>
                <div className="flex gap-1">
                  <kbd className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-xs">Cmd</kbd>
                  <kbd className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-xs">K</kbd>
                </div>
              </div>
            </div>
            
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">Overview</h4>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left relative group"
                  style={{
                    color: isActive ? '#f5a623' : '#9ca3af',
                    backgroundColor: isActive ? 'rgba(245,166,35,0.05)' : 'transparent',
                  }}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#f5a623] rounded-r-full shadow-[0_0_8px_#f5a623]"></div>
                  )}
                  <Icon size={18} className={isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 transition-opacity'} />
                  <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium group-hover:text-gray-300 transition-colors'}`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 pb-24">
          <div className="prose prose-invert max-w-none">
            {activeTab === 'getting-started' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 text-[#f5a623] mb-4">
                  <Compass size={24} />
                  <span className="text-sm font-bold uppercase tracking-widest">Introduction</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">Welcome to CryptoNeko</h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-10">
                  CryptoNeko is designed to bridge the gap between complex institutional trading terminals and everyday investors. We combine real-time data with cutting-edge AI to give you actionable insights without the noise.
                </p>

                <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Core Capabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  <FeatureCard 
                    icon={Activity} 
                    title="Real-time WebSockets" 
                    description="Prices, volume, and orderbook data stream instantly from Binance, Gate.io, Bybit, and OKX with zero delay." 
                  />
                  <FeatureCard 
                    icon={Brain} 
                    title="AI Technical Analysis" 
                    description="Get an instant breakdown of RSI, MACD, and moving averages summarized by our advanced LLM models." 
                  />
                  <FeatureCard 
                    icon={PieChart} 
                    title="Portfolio Tracking" 
                    description="Log your trades and monitor your real-time PnL (Profit and Loss) across your entire asset allocation." 
                  />
                  <FeatureCard 
                    icon={Network} 
                    title="Correlation Matrix" 
                    description="Visualize how different assets move together using our Pearson correlation heatmaps to diversify risk." 
                  />
                </div>

                <Callout title="Pro Tip: Quick Search">
                  Navigate the platform at lightning speed. Press <kbd className="bg-black border border-white/20 rounded px-1.5 py-0.5 text-xs mx-1 text-gray-300">Cmd</kbd> + <kbd className="bg-black border border-white/20 rounded px-1.5 py-0.5 text-xs mx-1 text-gray-300">K</kbd> (or Ctrl+K on Windows) to open the global search palette. From there, you can instantly jump to any coin's detail page or analysis module.
                </Callout>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 text-[#f5a623] mb-4">
                  <LayoutDashboard size={24} />
                  <span className="text-sm font-bold uppercase tracking-widest">Core Features</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">Dashboard & Portfolio</h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  Your personalized command center. The dashboard provides a high-level view of the market pulse, trending assets, and your portfolio's performance at a glance.
                </p>

                <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Managing Your Assets</h3>
                <div className="space-y-6 text-gray-300 mb-10">
                  <p>Keeping an accurate record of your trades allows CryptoNeko to calculate your total equity and historical performance.</p>
                  
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#f5a623] text-black flex items-center justify-center text-sm font-bold">1</div>
                      Adding a Transaction
                    </h4>
                    <p className="text-sm mb-4">Navigate to the <strong>Portfolio</strong> tab and click the "Add Transaction" button. You will need to provide:</p>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <ArrowRight size={16} className="text-[#f5a623] shrink-0 mt-0.5" />
                        <span><strong>Asset:</strong> Search for the coin (e.g., BTC, ETH, SOL).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight size={16} className="text-[#f5a623] shrink-0 mt-0.5" />
                        <span><strong>Quantity:</strong> The amount of the coin you purchased.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight size={16} className="text-[#f5a623] shrink-0 mt-0.5" />
                        <span><strong>Buy Price:</strong> The price per coin at the time of purchase.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Callout title="Privacy First" icon={Shield}>
                  Your portfolio data is stored securely in your browser's local storage and synced to your encrypted account profile if you log in. We never share your holdings with third parties.
                </Callout>
              </div>
            )}

            {activeTab === 'ai-analysis' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 text-[#f5a623] mb-4">
                  <Brain size={24} />
                  <span className="text-sm font-bold uppercase tracking-widest">Intelligence</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">AI Technical Analysis</h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  Technical analysis can be overwhelming. We utilize advanced Large Language Models (LLMs) to ingest raw chart data and translate it into clear, actionable summaries.
                </p>

                <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Behind the Scenes</h3>
                <p className="text-gray-300 mb-6">When you request an AI analysis for an asset, our backend pipeline executes the following steps in milliseconds:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                    <div className="text-[#f5a623] font-mono text-sm mb-2">01. Data Ingestion</div>
                    <p className="text-sm text-gray-400">Fetches the last 100 periods of OHLCV (Open, High, Low, Close, Volume) data from the exchange.</p>
                  </div>
                  <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                    <div className="text-[#f5a623] font-mono text-sm mb-2">02. Indicator Math</div>
                    <p className="text-sm text-gray-400">Calculates RSI, MACD, Bollinger Bands, and Moving Averages using pandas-ta.</p>
                  </div>
                  <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                    <div className="text-[#f5a623] font-mono text-sm mb-2">03. AI Synthesis</div>
                    <p className="text-sm text-gray-400">Passes the calculated matrix to the AI model with a strict system prompt to generate the report.</p>
                  </div>
                </div>

                <Callout title="Important Disclaimer" icon={Shield}>
                  AI Analysis is designed to assist your research, not replace it. The AI can hallucinate or misinterpret market sentiment during highly volatile black swan events. Never trade solely based on AI output. Always do your own research (DYOR).
                </Callout>
              </div>
            )}

            {activeTab === 'compare' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex items-center gap-3 text-[#f5a623] mb-4">
                  <GitCompare size={24} />
                  <span className="text-sm font-bold uppercase tracking-widest">Analytics</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">Compare & Correlation</h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  Discover hidden relationships between assets. Understanding market correlations is the key to building a robust, diversified portfolio that can withstand volatility.
                </p>

                <div className="space-y-12">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="text-[#f5a623]" size={20} /> Normalized Comparison
                    </h3>
                    <p className="text-gray-300 mb-4">
                      When comparing coins with vastly different prices (e.g., BTC at $60,000 vs XRP at $0.50), standard charts are useless. Our Compare tool <strong>normalizes</strong> all selected assets to start at 0% for the selected timeframe.
                    </p>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-400">
                      <strong>Example:</strong> If you select 7 Days, the chart sets the price of all assets 7 days ago to 0. You can instantly see that Asset A is +15% and Asset B is -5% relative to their starting point.
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Network className="text-[#f5a623]" size={20} /> Correlation Matrix (Heatmap)
                    </h3>
                    <p className="text-gray-300 mb-4">
                      The heatmap displays the Pearson correlation coefficient between selected assets, ranging from -1.0 to +1.0.
                    </p>
                    <ul className="space-y-4">
                      <li className="flex gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <div className="text-green-400 font-bold w-12 text-center">+1.0</div>
                        <div className="text-sm text-gray-300"><strong>Perfect Positive Correlation:</strong> The assets move in the exact same direction. Holding both does not diversify your risk.</div>
                      </li>
                      <li className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-gray-400 font-bold w-12 text-center">0.0</div>
                        <div className="text-sm text-gray-300"><strong>No Correlation:</strong> The assets move completely independently of one another.</div>
                      </li>
                      <li className="flex gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="text-red-400 font-bold w-12 text-center">-1.0</div>
                        <div className="text-sm text-gray-300"><strong>Perfect Negative Correlation:</strong> The assets move in exact opposite directions. Useful for hedging.</div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
