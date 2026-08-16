import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Settings, Calendar, ChevronDown, Menu, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function TopHeader({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();
  
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('Last week');
  const [hasNotif, setHasNotif] = useState(true);
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
    <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#111214]/80 backdrop-blur-md sticky top-0 z-40">
      
      {/* Left: Breadcrumbs & Mobile Toggle */}
      <div className="flex items-center gap-4">
        {onMobileMenuToggle && (
          <button onClick={onMobileMenuToggle} className="md:hidden p-2 text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Overview</span>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">{pageName}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div ref={wrapperRef} className="flex items-center gap-4 relative">
        {/* Date Selector */}
        <div className="relative">
          <button 
            onClick={() => setActivePopover(activePopover === 'date' ? null : 'date')} 
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            <Calendar size={14} />
            <span>{dateRange}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </button>
          
          {activePopover === 'date' && (
            <div className="absolute top-full right-0 mt-2 w-44 bg-[#1a1d21] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
               {['Last 24 hours', 'Last week', 'Last month', 'Year to date'].map(range => (
                 <button 
                   key={range} 
                   onClick={() => { setDateRange(range); setActivePopover(null); }} 
                   className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center justify-between"
                 >
                   {range}
                   {dateRange === range && <Check size={14} className="text-blue-500" />}
                 </button>
               ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-white/5 pl-4 ml-2">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setActivePopover(activePopover === 'notif' ? null : 'notif')} 
              className="p-2 text-gray-400 hover:text-white transition-colors relative"
            >
              <Bell size={18} />
              {hasNotif && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#111214]"></span>}
            </button>
            
            {activePopover === 'notif' && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1d21] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                 <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1e2227]">
                   <h4 className="text-white font-medium text-sm">Notifications</h4>
                   {hasNotif && (
                     <button onClick={() => setHasNotif(false)} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                       Mark all read
                     </button>
                   )}
                 </div>
                 {hasNotif ? (
                   <div className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors">
                     <p className="text-sm text-white mb-1">Welcome to CryptoNeko Pro!</p>
                     <p className="text-xs text-gray-400">Your account has been successfully created. Explore the dashboard.</p>
                     <p className="text-[10px] text-gray-500 mt-2">Just now</p>
                   </div>
                 ) : (
                   <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                     <Bell size={24} className="text-gray-600 mb-1 opacity-50" />
                     You're all caught up!
                   </div>
                 )}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="relative">
            <button 
              onClick={() => setActivePopover(activePopover === 'settings' ? null : 'settings')} 
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Settings size={18} />
            </button>
            
            {activePopover === 'settings' && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1d21] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 z-50">
                 <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preferences</div>
                 <button className="w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex justify-between items-center transition-colors">
                   Dark Mode 
                   <div className="w-8 h-4 bg-blue-500 rounded-full relative">
                     <div className="absolute right-[2px] top-[2px] w-3 h-3 bg-white rounded-full shadow-sm"></div>
                   </div>
                 </button>
                 <button className="w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex justify-between items-center transition-colors">
                   Language <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">English</span>
                 </button>
                 <div className="my-2 border-t border-white/5"></div>
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
