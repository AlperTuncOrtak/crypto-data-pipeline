import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Settings, Calendar, ChevronDown, Menu } from 'lucide-react';

import { toast } from 'sonner';

export default function TopHeader({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const location = useLocation();
  
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
      <div className="flex items-center gap-4">
        {/* Date Selector Placeholder */}
        <button onClick={() => toast.info('Date selector feature is coming soon!')} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors">
          <Calendar size={14} />
          <span>Last week</span>
          <ChevronDown size={14} className="text-gray-500" />
        </button>

        <div className="flex items-center gap-2 border-l border-white/5 pl-4 ml-2">
          <button onClick={() => toast.info('No new notifications')} className="p-2 text-gray-400 hover:text-white transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#111214]"></span>
          </button>
          <button onClick={() => toast.info('Settings panel is under construction')} className="p-2 text-gray-400 hover:text-white transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}
