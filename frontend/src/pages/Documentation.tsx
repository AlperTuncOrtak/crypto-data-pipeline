import React, { useState } from 'react';
import { Book, Compass, LayoutDashboard, Brain, GitCompare, Zap, Shield, Search, ArrowRight, Activity, PieChart, TrendingUp, Network } from 'lucide-react';

// Custom Card Component for Features
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col p-6 rounded-[32px] transition-all duration-300 hover:scale-[0.98] transition-transform duration-300 group" 
       style={{ 
         backgroundColor: 'var(--border-soft)', 
         border: '1px solid var(--border)',
       }}>
    <div className="mb-5 w-12 h-12 rounded-3xl flex items-center justify-center transition-colors duration-300"
         style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}>
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{title}</h3>
    <p className="text-base text-[var(--text-muted)] leading-relaxed">{description}</p>
  </div>
);

// Custom Callout / Alert Component
const Callout = ({ title, children, icon: Icon = Zap }) => (
  <div className="my-12 p-6 rounded-[32px] flex gap-5 items-start relative overflow-hidden" 
       style={{ 
         backgroundColor: 'var(--accent-soft)', 
         border: '1px solid var(--accent-soft)' 
       }}>
    {/* Subtle background glow */}
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent)] opacity-5 blur-3xl rounded-full"></div>
    <div className="shrink-0 mt-1">
      <Icon size={24} style={{ color: 'var(--accent)' }} />
    </div>
    <div>
      <h4 className="text-base font-bold mb-2 tracking-wide" style={{ color: 'var(--accent)' }}>{title}</h4>
      <div className="text-base text-gray-300 leading-loose">
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
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-16 pb-8 border-b border-[var(--border-base)]">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] mb-6">
          Documentation
        </h1>
        <p className="text-xl text-[var(--text-muted)] max-w-3xl leading-relaxed">
          Everything you need to know about CryptoNeko. Learn how to track your portfolio, generate AI insights, and analyze the market like a pro.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-16 relative">
        {/* Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="sticky top-28 flex flex-col gap-2">
            <div className="mb-8 px-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-3xl border border-[var(--border-base)] text-[var(--text-muted)] text-sm">
                <Search size={18} />
                <span className="flex-1">Search docs...</span>
                <div className="flex gap-1.5">
                  <kbd className="bg-black/50 border border-[var(--border-base)] rounded px-2 py-1 text-xs">Cmd</kbd>
                  <kbd className="bg-black/50 border border-[var(--border-base)] rounded px-2 py-1 text-xs">K</kbd>
                </div>
              </div>
            </div>
            
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 px-3">Overview</h4>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-3xl transition-all text-left relative group mb-1"
                  style={{
                    color: isActive ? 'var(--accent)' : '#9ca3af',
                    backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                  }}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--accent)] rounded-r-full shadow-[0_0_12px_var(--accent)]"></div>
                  )}
                  <Icon size={20} className={isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 transition-opacity'} />
                  <span className={`text-base ${isActive ? 'font-semibold' : 'font-medium group-hover:text-gray-200 transition-colors'}`}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 pb-32">
          <div className="max-w-4xl">
            {activeTab === 'getting-started' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 text-[var(--accent)] mb-6">
                  <Compass size={28} />
                  <span className="text-sm font-bold uppercase tracking-widest">Introduction</span>
                </div>
                <h2 className="text-4xl font-extrabold text-[var(--text-primary)] mb-8 tracking-tight">Welcome to CryptoNeko</h2>
                <p className="text-gray-300 text-lg leading-loose mb-14">
                  CryptoNeko is designed to bridge the gap between complex institutional trading terminals and everyday investors. We combine real-time data with cutting-edge AI to give you actionable insights without the noise.
                </p>

                <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-16 mb-8 pb-4 border-b border-[var(--border-base)] tracking-tight">Core Capabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
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
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 text-[var(--accent)] mb-6">
                  <LayoutDashboard size={28} />
                  <span className="text-sm font-bold uppercase tracking-widest">Core Features</span>
                </div>
                <h2 className="text-4xl font-extrabold text-[var(--text-primary)] mb-8 tracking-tight">Dashboard & Portfolio</h2>
                <p className="text-gray-300 text-lg leading-loose mb-14">
                  Your personalized command center. The dashboard provides a high-level view of the market pulse, trending assets, and your portfolio's performance at a glance.
                </p>

                <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-16 mb-8 pb-4 border-b border-[var(--border-base)] tracking-tight">Managing Your Assets</h3>
                <div className="text-gray-300 mb-14 space-y-8">
                  <p className="text-lg leading-loose">
                    Keeping an accurate record of your trades allows CryptoNeko to calculate your total equity and historical performance.
                  </p>
                  
                  <div className="bg-white/5 rounded-[32px] p-8 border border-[var(--border-base)] mt-8 mb-16">
                    <h4 className="text-[var(--text-primary)] text-xl font-bold mb-6 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-black flex items-center justify-center text-base font-extrabold">1</div>
                      Adding a Transaction
                    </h4>
                    <p className="text-base leading-relaxed mb-6 text-[var(--text-muted)]">Navigate to the <strong className="text-[var(--text-primary)] font-semibold">Portfolio</strong> tab and click the "Add Transaction" button. You will need to provide:</p>
                    <ul className="space-y-5 text-base text-gray-300">
                      <li className="flex items-start gap-4">
                        <ArrowRight size={20} className="text-[var(--accent)] shrink-0 mt-1" />
                        <span className="leading-relaxed"><strong className="text-[var(--text-primary)] font-semibold">Asset:</strong> Search for the coin (e.g., BTC, ETH, SOL).</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <ArrowRight size={20} className="text-[var(--accent)] shrink-0 mt-1" />
                        <span className="leading-relaxed"><strong className="text-[var(--text-primary)] font-semibold">Quantity:</strong> The amount of the coin you purchased.</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <ArrowRight size={20} className="text-[var(--accent)] shrink-0 mt-1" />
                        <span className="leading-relaxed"><strong className="text-[var(--text-primary)] font-semibold">Buy Price:</strong> The price per coin at the time of purchase.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <Callout title="Privacy First" icon={Shield}>
                    Your portfolio data is stored securely in your browser's local storage and synced to your encrypted account profile if you log in. We never share your holdings with third parties.
                  </Callout>
                </div>
              </div>
            )}

            {activeTab === 'ai-analysis' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 text-[var(--accent)] mb-6">
                  <Brain size={28} />
                  <span className="text-sm font-bold uppercase tracking-widest">Intelligence</span>
                </div>
                <h2 className="text-4xl font-extrabold text-[var(--text-primary)] mb-8 tracking-tight">AI Technical Analysis</h2>
                <p className="text-gray-300 text-lg leading-loose mb-14">
                  Technical analysis can be overwhelming. We utilize advanced Large Language Models (LLMs) to ingest raw chart data and translate it into clear, actionable summaries.
                </p>

                <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-16 mb-8 pb-4 border-b border-[var(--border-base)] tracking-tight">Behind the Scenes</h3>
                <p className="text-gray-300 text-lg leading-loose mb-8">When you request an AI analysis for an asset, our backend pipeline executes the following steps in milliseconds:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                  <div className="bg-black/40 p-8 rounded-[32px] border border-[var(--border-base)]">
                    <div className="text-[var(--accent)] font-mono text-base font-bold mb-4">01. Data Ingestion</div>
                    <p className="text-base text-[var(--text-muted)] leading-relaxed">Fetches the last 100 periods of OHLCV (Open, High, Low, Close, Volume) data from the exchange.</p>
                  </div>
                  <div className="bg-black/40 p-8 rounded-[32px] border border-[var(--border-base)]">
                    <div className="text-[var(--accent)] font-mono text-base font-bold mb-4">02. Indicator Math</div>
                    <p className="text-base text-[var(--text-muted)] leading-relaxed">Calculates RSI, MACD, Bollinger Bands, and Moving Averages using pandas-ta.</p>
                  </div>
                  <div className="bg-black/40 p-8 rounded-[32px] border border-[var(--border-base)]">
                    <div className="text-[var(--accent)] font-mono text-base font-bold mb-4">03. AI Synthesis</div>
                    <p className="text-base text-[var(--text-muted)] leading-relaxed">Passes the calculated matrix to the AI model with a strict system prompt to generate the report.</p>
                  </div>
                </div>

                <Callout title="Important Disclaimer" icon={Shield}>
                  AI Analysis is designed to assist your research, not replace it. The AI can hallucinate or misinterpret market sentiment during highly volatile black swan events. Never trade solely based on AI output. Always do your own research (DYOR).
                </Callout>
              </div>
            )}

            {activeTab === 'compare' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex items-center gap-3 text-[var(--accent)] mb-6">
                  <GitCompare size={28} />
                  <span className="text-sm font-bold uppercase tracking-widest">Analytics</span>
                </div>
                <h2 className="text-4xl font-extrabold text-[var(--text-primary)] mb-8 tracking-tight">Compare & Correlation</h2>
                <p className="text-gray-300 text-lg leading-loose mb-14">
                  Discover hidden relationships between assets. Understanding market correlations is the key to building a robust, diversified portfolio that can withstand volatility.
                </p>

                <div className="space-y-16">
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                      <TrendingUp className="text-[var(--accent)]" size={28} /> Normalized Comparison
                    </h3>
                    <p className="text-gray-300 text-lg leading-loose mb-6">
                      When comparing coins with vastly different prices (e.g., BTC at $60,000 vs XRP at $0.50), standard charts are useless. Our Compare tool <strong className="text-[var(--text-primary)]">normalizes</strong> all selected assets to start at 0% for the selected timeframe.
                    </p>
                    <div className="bg-white/5 border border-[var(--border-base)] rounded-[32px] p-6 text-base text-[var(--text-muted)] leading-relaxed mt-6">
                      <strong className="text-[var(--text-primary)] font-semibold">Example:</strong> If you select 7 Days, the chart sets the price of all assets 7 days ago to 0. You can instantly see that Asset A is +15% and Asset B is -5% relative to their starting point.
                    </div>
                  </div>

                  <div className="pt-8 border-t border-[var(--border-base)]">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                      <Network className="text-[var(--accent)]" size={28} /> Correlation Matrix (Heatmap)
                    </h3>
                    <p className="text-gray-300 text-lg leading-loose mb-8">
                      The heatmap displays the Pearson correlation coefficient between selected assets, ranging from -1.0 to +1.0.
                    </p>
                    <ul className="space-y-6">
                      <li className="flex gap-6 p-6 rounded-[32px] bg-green-500/10 border border-green-500/20 items-center">
                        <div className="text-green-400 font-extrabold text-xl w-16 text-center">+1.0</div>
                        <div className="text-base text-gray-300 leading-relaxed"><strong className="text-[var(--text-primary)]">Perfect Positive Correlation:</strong> The assets move in the exact same direction. Holding both does not diversify your risk.</div>
                      </li>
                      <li className="flex gap-6 p-6 rounded-[32px] bg-white/5 border border-[var(--border-base)] items-center">
                        <div className="text-[var(--text-muted)] font-extrabold text-xl w-16 text-center">0.0</div>
                        <div className="text-base text-gray-300 leading-relaxed"><strong className="text-[var(--text-primary)]">No Correlation:</strong> The assets move completely independently of one another.</div>
                      </li>
                      <li className="flex gap-6 p-6 rounded-[32px] bg-red-500/10 border border-red-500/20 items-center">
                        <div className="text-red-400 font-extrabold text-xl w-16 text-center">-1.0</div>
                        <div className="text-base text-gray-300 leading-relaxed"><strong className="text-[var(--text-primary)]">Perfect Negative Correlation:</strong> The assets move in exact opposite directions. Useful for hedging.</div>
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

