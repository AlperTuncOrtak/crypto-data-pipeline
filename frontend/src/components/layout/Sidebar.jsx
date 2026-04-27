// ============================================================
// components/layout/Sidebar.jsx
// ============================================================
// Kapatilip acilabilen sol navigasyon.
//
// Davranis:
//  - Acikken: 256px, ikon + label
//  - Kapalilyken: 72px, sadece ikon (hover'da tooltip)
//  - Toggle butonu sidebar'in ust kisminda
//  - State localStorage'da saklanir (yenilemede unutmaz)
//  - Smooth CSS transition (width + opacity)
// ============================================================

import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart2,
  Bell,
  LineChart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'


// -----------------------
// NAV ITEMS
// -----------------------
const NAV_ITEMS = [
  { to: '/',         label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/market',   label: 'Market',    Icon: BarChart2       },
  { to: '/alerts',   label: 'Alerts',    Icon: Bell            },
  { to: '/analysis', label: 'Analysis',  Icon: LineChart       },
]


// -----------------------
// TOOLTIP (kapali modda hover)
// -----------------------
// Sidebar kapalilyken sadece ikon gorunur. Mouse uzerine gelince
// label tooltip olarak ciksin diye basit bir wrapper.
function NavTooltip({ label, children, isCollapsed }) {
  if (!isCollapsed) return children

  return (
    <div className="relative group/tooltip">
      {children}
      <div className="
        absolute left-full ml-3 top-1/2 -translate-y-1/2
        px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded
        whitespace-nowrap pointer-events-none
        opacity-0 group-hover/tooltip:opacity-100
        transition-opacity duration-150 z-50
      ">
        {label}
      </div>
    </div>
  )
}


// -----------------------
// MAIN SIDEBAR
// -----------------------
export default function Sidebar() {
  // localStorage'dan initial state al
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  // State degisince localStorage'a yaz
  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed))
    } catch {
      // localStorage kullanilamazsa sessizce devam et
    }
  }, [isCollapsed])

  function toggle() {
    setIsCollapsed((prev) => !prev)
  }


  return (
    <aside
      className={`
        relative min-h-screen bg-slate-900 border-r border-slate-800
        hidden md:flex flex-col transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* TOGGLE BUTONU */}
      <button
        onClick={toggle}
        className="
          absolute -right-3 top-8 z-10
          w-6 h-6 rounded-full
          bg-slate-700 border border-slate-600
          flex items-center justify-center
          text-slate-400 hover:text-slate-200 hover:bg-slate-600
          transition-colors shadow-lg
        "
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft size={12} />
        }
      </button>


      {/* LOGO / BRAND */}
      <div className={`p-5 mb-4 ${isCollapsed ? 'px-4' : 'px-6'}`}>
        {isCollapsed ? (
          // Kapalilyken sadece kucuk yeşil nokta
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        ) : (
          // Acikken tam logo
          <>
            <h2 className="text-xl font-bold text-emerald-400 whitespace-nowrap">
              Crypto Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-1">v2.0</p>
          </>
        )}
      </div>


      {/* NAV LINKS */}
      <nav className={`flex flex-col gap-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavTooltip key={to} label={label} isCollapsed={isCollapsed}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg text-sm transition-colors
                ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-2.5'}
                ${isActive
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    className={`shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}
                  />
                  {/* Label sadece acikken gorunur */}
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden">
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </NavTooltip>
        ))}
      </nav>


      {/* ALT BILGI - sadece acikken */}
      {!isCollapsed && (
        <div className="mt-auto mx-6 pt-4 pb-6 border-t border-slate-800">
          <p className="text-xs text-slate-600">Data: CoinGecko</p>
          <p className="text-xs text-slate-600 mt-0.5">Auto-refresh: 30s</p>
        </div>
      )}
    </aside>
  )
}