import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/layout/Navbar'
import RightSidebar from './components/layout/WatchlistSidebar'
import Dashboard from './pages/Dashboard'
import Market from './pages/Market'
import Alerts from './pages/Alerts'
import Analysis from './pages/Analysis'
import CoinDetail from './pages/CoinDetail'
import { useWatchlist } from './hooks/useWatchlist'
import { useMarket } from './hooks/useMarket'
import AIAnalysis from './pages/AIAnalysis'


export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePanel, setActivePanel] = useState('watchlist')
  const { watchlist, toggleWatchlist, removeFromWatchlist, isWatched } = useWatchlist()
  const { data: marketData } = useMarket(500)

  function openPanel(panel) {
    setActivePanel(panel)
    setSidebarOpen(true)
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <Navbar
          onWatchlistOpen={() => openPanel('watchlist')}
          watchlistCount={watchlist.length}
        />
        <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }}>
          <Routes>
            <Route path="/"           element={<Dashboard isWatched={isWatched} toggleWatchlist={toggleWatchlist} />} />
            <Route path="/market"     element={<Market isWatched={isWatched} toggleWatchlist={toggleWatchlist} />} />
            <Route path="/alerts"     element={<Alerts />} />
            <Route path="/analysis"   element={<Analysis />} />
            <Route path="/coin/:slug" element={<CoinDetail />} />
            <Route path="/analysis/ai" element={<AIAnalysis />} />

          </Routes>
        </main>

        <RightSidebar
          isOpen={sidebarOpen}
          activePanel={activePanel}
          onClose={() => setSidebarOpen(false)}
          onPanelChange={openPanel}
          watchlist={watchlist}
          removeFromWatchlist={removeFromWatchlist}
          marketData={marketData}
        />
      </div>
    </BrowserRouter>
  )
}