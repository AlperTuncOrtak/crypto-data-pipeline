// ============================================================
// components/layout/Sidebar.jsx
// ============================================================
// Sol taraftaki navigasyon. Hangi sayfada oldugumuzu route'dan
// alip aktif linki isaretler.
// ============================================================

import { NavLink } from 'react-router-dom'


// -----------------------
// NAV ITEMS
// -----------------------
// Tek yerden yonetilsin diye dizi olarak tutuyoruz.
// Ileride icon eklemek kolay olacak.
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/market', label: 'Market' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/analysis', label: 'Analysis' },
]


export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 p-6">
      {/* LOGO / BRAND */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-emerald-400">
          Crypto Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-1">v2.0</p>
      </div>


      {/* NAV LINKS */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            // NavLink otomatik olarak aktif route'u isaretler.
            // className'e function verirsek isActive parametresi alir.
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
            // Dashboard'un "/" route'u oldugu icin end prop'u lazim.
            // Olmazsa her sayfada aktif gorunur (cunku hepsi "/" ile baslar)
            end={item.to === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}