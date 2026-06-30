import React from "react";
import { Link } from "react-router-dom";
import { 
  BarChart2, 
  Activity, 
  Target, 
  Settings, 
  Search, 
  Bell, 
  User,
  Command
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function LinearDashboardLayout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-zinc-400 font-sans antialiased overflow-hidden selection:bg-white/[0.1] selection:text-zinc-100">
      
      {/* ─── LEFT SIDEBAR ─────────────────────────────────────── */}
      <aside className="w-[240px] flex-shrink-0 border-r border-white/[0.08] flex flex-col justify-between">
        
        {/* Top Section */}
        <div>
          {/* Logo / Workspace Name */}
          <div className="h-14 flex items-center px-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 text-zinc-100 font-medium">
              <div className="w-5 h-5 rounded-[4px] bg-white/[0.08] border border-white/[0.08] flex items-center justify-center">
                <Command size={12} className="text-zinc-400" />
              </div>
              <span className="text-[13px] tracking-wide">CryptoNeko</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 flex flex-col gap-[2px]">
            <p className="px-2 mb-1 text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Platform</p>
            
            <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] text-zinc-100 bg-white/[0.04]">
              <BarChart2 size={14} className="text-zinc-400" />
              Dashboard
            </Link>
            
            <Link to="/market" className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] hover:text-zinc-100 hover:bg-white/[0.04] transition-colors">
              <Activity size={14} />
              Markets
            </Link>
            
            <Link to="/alerts" className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] hover:text-zinc-100 hover:bg-white/[0.04] transition-colors">
              <Target size={14} />
              Signals
            </Link>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-white/[0.08]">
          <Link to="/settings" className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] hover:text-zinc-100 hover:bg-white/[0.04] transition-colors">
            <Settings size={14} />
            Settings
          </Link>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-14 border-b border-white/[0.08] flex items-center justify-between px-6 flex-shrink-0">
          
          {/* Breadcrumbs / View Name */}
          <div className="flex items-center gap-2 text-[13px] text-zinc-400">
            <span className="text-zinc-100">Overview</span>
            <span className="text-zinc-600">/</span>
            <span>All Markets</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button className="flex items-center gap-2 text-[12px] border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 rounded-md hover:border-white/[0.15] hover:text-zinc-100 transition-all">
              <Search size={12} />
              <span>Search...</span>
              <span className="text-zinc-600 ml-2">⌘K</span>
            </button>
            
            {/* Icons */}
            <div className="flex items-center gap-3">
              <button className="hover:text-zinc-100 transition-colors">
                <Bell size={14} />
              </button>
              <div className="w-[1px] h-4 bg-white/[0.08]"></div>
              <button className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.12] transition-colors">
                <User size={12} className="text-zinc-100" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>

    </div>
  );
}
