import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Settings, Menu, Moon, Sun, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function TopHeader({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [hasNotif, setHasNotif] = useState(true);
  
  // Local Price Alerts State
  const [activeTab, setActiveTab] = useState<'notif' | 'alerts'>('alerts');
  const [alerts, setAlerts] = useState<{id: number, symbol: string, target: number, above: boolean}[]>([
    { id: 1, symbol: 'BTC', target: 95000, above: true },
    { id: 2, symbol: 'ETH', target: 3000, above: false }
  ]);
  const [newSymbol, setNewSymbol] = useState('SOL');
  const [newTarget, setNewTarget] = useState(200);
  const [newAbove, setNewAbove] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format the path into a breadcrumb
  const pathParts = location.pathname.split('/').filter(Boolean);
  let pageName = pathParts.length > 0 
    ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1)
    : 'Dashboard';
  
  if (location.pathname === '/') pageName = 'Overview';

  return (
    <div className="h-16 flex items-center justify-between px-3 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/80 backdrop-blur-md sticky top-0 z-40">
      
      {/* Left: Breadcrumbs & Mobile Toggle */}
      <div className="flex items-center gap-2 sm:gap-4">
        {onMobileMenuToggle && (
          <button onClick={onMobileMenuToggle} className="md:hidden p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline text-[var(--text-muted)]">Overview</span>
          <span className="hidden sm:inline text-gray-600">/</span>
          <span className="text-[var(--text-main)] font-medium truncate max-w-[120px] sm:max-w-none">{pageName}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div ref={wrapperRef} className="flex items-center gap-4 relative">
        <div className="hidden sm:block">
          <ConnectButton 
            showBalance={false} 
            chainStatus="icon" 
            accountStatus="address"
          />
        </div>
        <div className="flex items-center gap-2 pl-2 sm:pl-4 ml-1 sm:ml-2 border-l border-[var(--border-subtle)]">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setActivePopover(activePopover === 'notif' ? null : 'notif')} 
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors relative"
            >
              <Bell size={18} />
              {hasNotif && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#111214]"></span>}
            </button>
            
            {activePopover === 'notif' && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-3xl shadow-2xl overflow-hidden z-50">
                 <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                   <button 
                     onClick={() => setActiveTab('alerts')}
                     className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'alerts' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                   >
                     Price Alerts
                   </button>
                   <button 
                     onClick={() => setActiveTab('notif')}
                     className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'notif' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                   >
                     Notifications {hasNotif && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-white text-[10px]">1</span>}
                   </button>
                 </div>

                 {activeTab === 'alerts' ? (
                   <div className="flex flex-col">
                     <div className="p-4 border-b border-[var(--border-subtle)] bg-black/10">
                       <p className="text-xs text-[var(--text-muted)] mb-2 uppercase font-bold tracking-wider">Create Alert</p>
                       <div className="flex items-center gap-2">
                         <input 
                           value={newSymbol}
                           onChange={e => setNewSymbol(e.target.value.toUpperCase())}
                           placeholder="BTC"
                           className="w-16 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none uppercase font-bold"
                         />
                         <button 
                           onClick={() => setNewAbove(!newAbove)}
                           className={`p-1.5 rounded-xl border ${newAbove ? 'bg-[var(--positive)]/10 border-[var(--positive)]/30 text-[var(--positive)]' : 'bg-[var(--negative)]/10 border-[var(--negative)]/30 text-[var(--negative)]'}`}
                         >
                           {newAbove ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                         </button>
                         <div className="relative flex-1">
                           <span className="absolute left-2 top-1.5 text-sm text-[var(--text-muted)]">$</span>
                           <input 
                             type="number"
                             value={newTarget}
                             onChange={e => setNewTarget(Number(e.target.value))}
                             className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl pl-5 pr-2 py-1.5 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none font-medium"
                           />
                         </div>
                         <button 
                           onClick={() => {
                             if (newSymbol && newTarget > 0) {
                               setAlerts([{ id: Date.now(), symbol: newSymbol, target: newTarget, above: newAbove }, ...alerts]);
                               setNewSymbol('');
                               setNewTarget(0);
                             }
                           }}
                           className="p-1.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-80 transition-opacity"
                         >
                           <Plus size={16} />
                         </button>
                       </div>
                     </div>
                     <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                       {alerts.length === 0 ? (
                         <div className="py-6 text-center text-xs text-[var(--text-muted)]">No active alerts</div>
                       ) : (
                         alerts.map(a => (
                           <div key={a.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-base)] transition-colors group">
                             <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${a.above ? 'bg-[var(--positive)]/10 text-[var(--positive)]' : 'bg-[var(--negative)]/10 text-[var(--negative)]'}`}>
                                 {a.above ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                               </div>
                               <div>
                                 <p className="text-sm font-bold text-[var(--text-main)]">{a.symbol}</p>
                                 <p className="text-xs text-[var(--text-muted)]">{a.above ? 'Crosses above' : 'Drops below'} ${a.target.toLocaleString()}</p>
                               </div>
                             </div>
                             <button 
                               onClick={() => setAlerts(alerts.filter(x => x.id !== a.id))}
                               className="text-xs text-[var(--negative)] opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-lg hover:bg-[var(--negative)]/10"
                             >
                               Remove
                             </button>
                           </div>
                         ))
                       )}
                     </div>
                   </div>
                 ) : (
                   <div>
                     {hasNotif ? (
                       <div className="p-4 hover:bg-[var(--border-subtle)] cursor-pointer border-b border-[var(--border-subtle)] transition-colors">
                         <div className="flex justify-between items-start mb-1">
                           <p className="text-sm font-bold text-[var(--text-main)]">Welcome to CryptoNeko!</p>
                           <button onClick={() => setHasNotif(false)} className="text-[10px] text-[var(--accent)] hover:underline">Mark read</button>
                         </div>
                         <p className="text-xs text-[var(--text-muted)]">Web3 wallet connection and local price alerts are now active.</p>
                         <p className="text-[10px] text-[var(--text-muted)] mt-2">Just now</p>
                       </div>
                     ) : (
                       <div className="p-8 text-center text-sm text-[var(--text-muted)] flex flex-col items-center gap-2">
                         <Bell size={24} className="text-gray-600 mb-1 opacity-50" />
                         You're all caught up!
                       </div>
                     )}
                   </div>
                 )}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="relative">
            <button 
              onClick={() => setActivePopover(activePopover === 'settings' ? null : 'settings')} 
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <Settings size={18} />
            </button>
            
            {activePopover === 'settings' && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-3xl shadow-2xl overflow-hidden py-2 z-50">
                 <div className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Preferences</div>
                 <button className="w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-[var(--border-subtle)] flex justify-between items-center transition-colors">
                   Dark Mode 
                   <div className="w-8 h-4 bg-blue-500 rounded-full relative">
                     <div className="absolute right-[2px] top-[2px] w-3 h-3 bg-white rounded-full shadow-sm"></div>
                   </div>
                 </button>
                 <button className="w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-[var(--border-subtle)] flex justify-between items-center transition-colors">
                   Language <span className="text-xs text-[var(--text-muted)] bg-white/5 px-2 py-1 rounded">English</span>
                 </button>
                 <div className="my-2 border-t border-[var(--border-subtle)]"></div>
                 <button 
                   onClick={() => { setActivePopover(null); signOut(); }}
                   className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                 >
                   Sign Out
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
