import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Dashboard from './pages/Dashboard'
import Market from './pages/Market'
import Alerts from './pages/Alerts'
import Analysis from './pages/Analysis'
import CoinDetail from './pages/CoinDetail'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <Navbar />
        <main
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '32px 24px',
          }}
        >
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/market"     element={<Market />} />
            <Route path="/alerts"     element={<Alerts />} />
            <Route path="/analysis"   element={<Analysis />} />
            <Route path="/coin/:slug" element={<CoinDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}