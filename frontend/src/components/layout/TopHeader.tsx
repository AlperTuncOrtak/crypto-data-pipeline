import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Settings, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function TopHeader({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [activePopover, setActivePopover] = useState<string | null>(null);
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
        <div className="flex items-center gap-2 pl-2 sm:pl-4 ml-1 sm:ml-2">
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
              <div className="absolute top-full right-0 mt-2 w-72 bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-3xl shadow-2xl overflow-hidden z-50">
                 <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)]">
                   <h4 className="text-[var(--text-main)] font-medium text-sm">Notifications</h4>
                   {hasNotif && (
                     <button onClick={() => setHasNotif(false)} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                       Mark all read
                     </button>
                   )}
                 </div>
                 {hasNotif ? (
                   <div className="p-4 hover:bg-[var(--border-subtle)] cursor-pointer border-b border-[var(--border-subtle)] transition-colors">
                     <p className="text-sm text-[var(--text-main)] mb-1">Welcome to CryptoNeko Pro!</p>
                     <p className="text-xs text-[var(--text-muted)]">Your account has been successfully created. Explore the dashboard.</p>
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
