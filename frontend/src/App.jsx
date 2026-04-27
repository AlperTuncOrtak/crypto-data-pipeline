// ============================================================
// App.jsx
// ============================================================
// Uygulamanin ana layout'u. Sidebar + icerik alani.
// Icerik alanindaki sayfa route'a gore degisir (Router sayesinde).
// ============================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import Market from './pages/Market'
import Alerts from './pages/Alerts'
import Analysis from './pages/Analysis'
import CoinDetail from './pages/CoinDetail'



export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        {/* SOL: Sidebar her sayfada sabit */}
        <Sidebar />

        {/* SAG: Aktif sayfaya gore icerik */}
        <main className="flex-1 p-4 md:p-8 overflow-x-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/market" element={<Market />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/coin/:slug" element={<CoinDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}