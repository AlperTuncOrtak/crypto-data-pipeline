import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowRightLeft,
  BarChart2,
  Bell,
  BookOpen,
  Search,
  Settings,
  Users,
  HelpCircle,
  Activity,
  Map as MapIcon,
  Clock,
  TrendingUp,
  Brain,
  PanelLeftClose,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MessageCircle,
  Globe,
  LogOut,
  User
} from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import SettingsModal from '../ui/SettingsModal';
import { useAuth } from '../../hooks/useAuth';

const mainNavSections = [
  {
    title: 'MAIN NAVIGATION',
    items: [
      { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Swap', path: '/swap', icon: ArrowRightLeft },
      { name: 'Portfolio', path: '/portfolio', icon: BookOpen },
    ]
  },
  {
    title: 'ANALYTICS & INSIGHTS',
    items: [
      { 
        name: 'Market Data', 
        path: '/market', 
        icon: BarChart2
      },
      { name: 'AI Analysis', path: '/analysis', icon: Brain },
      { name: 'Whale X-Ray', path: '/whale', icon: Activity },
      { name: 'Heatmap', path: '/heatmap', icon: MapIcon },
      { name: 'Narratives', path: '/narratives', icon: TrendingUp },
      { name: 'Time Machine', path: '/timemachine', icon: Clock },
    ]
  }
];

const supportSection = {
  title: 'SUPPORT',
  items: [
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Leaderboard', path: '/leaderboard', icon: Users },
    { name: 'Help & Support', path: '/support', icon: HelpCircle },
    { name: 'Settings', path: '#', icon: Settings },
    { name: 'Contact Me', path: '/contact', icon: MessageCircle },
  ]
};

export default function GlobalSidebar({ onSearchOpen, onAuthOpen }: { onSearchOpen: () => void, onAuthOpen?: () => void }) {
  const location = useLocation();
  const { isLoggedIn, displayName, email, avatar, signOut } = useAuth();
  const [expanded, setExpanded] = useState<string[]>(['Market Data']); // Default expand 'Market Data'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleExpand = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    setExpanded(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const renderNavItem = (item: any) => {
    const isActive = location.pathname === item.path || (item.subItems && item.subItems.some((sub: any) => location.pathname === sub.path));
    const isExpanded = expanded.includes(item.name);
    
    return (
      <div key={item.name}>
        <NavLink
          to={item.subItems ? '#' : item.path}
          onClick={(e) => {
            if (item.name === 'Settings') {
              e.preventDefault();
              setIsSettingsOpen(true);
              return;
            }
            if (item.subItems) {
              toggleExpand(item.name, e);
            }
          }}
          className={`flex items-center gap-3 px-2.5 h-[34px] rounded-[6px] text-[13.5px] font-medium transition-all duration-200 group ${
            isActive && !item.subItems
              ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)]' 
              : 'text-[var(--text-muted)] hover:text-gray-200 hover:bg-[var(--border-subtle)]'
          }`}
        >
          <item.icon size={15} strokeWidth={2.2} className={isActive && !item.subItems ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-gray-300'} />
          <span className="flex-1">{item.name}</span>
          {item.subItems && (
            isExpanded ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />
          )}
        </NavLink>

        {/* Sub Items Tree View */}
        {item.subItems && isExpanded && (
          <div className="mt-1 mb-1 ml-[17px] pl-4 border-l border-[var(--border-base)] flex flex-col gap-[2px] relative">
            {item.subItems.map((sub: any) => {
              const isSubActive = location.pathname + location.search === sub.path || location.pathname === sub.path;
              return (
                <NavLink
                  key={sub.name}
                  to={sub.path}
                  className="relative flex items-center px-2.5 h-[30px] rounded-[6px] text-[13px] font-medium transition-all group"
                >
                  {/* Horizontal connector line */}
                  <div className="absolute left-[-16px] top-1/2 w-[12px] border-t border-[var(--border-base)]" />
                  
                  <span className={isSubActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-gray-300'}>
                    {sub.name}
                  </span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[260px] bg-[var(--bg-base)] h-screen border-r border-[var(--border-base)] flex flex-col hidden md:flex shrink-0 font-sans">
      {/* Header Area */}
      <div className="h-[60px] flex items-center justify-between px-5 shrink-0">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center rounded-2xl overflow-hidden bg-white/5 border border-[var(--border-base)]">
            <img src="/cat-head.png" alt="CryptoNeko" className="w-[80%] h-[80%] object-contain" />
          </div>
          <span className="font-semibold text-[var(--text-main)] text-[15px] tracking-tight">CryptoNeko</span>
        </NavLink>
        <button className="text-[var(--text-muted)] hover:text-gray-300 transition-colors p-1 rounded-2xl hover:bg-[var(--border-subtle)]">
          <PanelLeftClose size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Search Bar Placeholder */}
      <div className="px-4 pb-4 shrink-0">
        <button 
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2.5 px-3 h-[36px] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[8px] text-[13px] text-[var(--text-muted)] transition-colors"
        >
          <Search size={14} className="text-[var(--text-muted)]" strokeWidth={2.5} />
          <span className="font-medium text-[var(--text-muted)]">Search anything</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-sm font-semibold font-mono">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-sm font-semibold font-mono">K</kbd>
          </div>
        </button>
      </div>

      {/* Navigation Links - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-1 pb-4 px-4 space-y-6 custom-scrollbar">
        {mainNavSections.map((section, idx) => (
          <div key={idx}>
            <h3 className="px-2 mb-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-[2px]">
              {section.items.map(renderNavItem)}
            </div>
          </div>
        ))}
      </div>

      {/* Support Section - Pinned to bottom */}
      <div className="px-4 pt-4 shrink-0 border-t border-[var(--border-base)] bg-[var(--bg-base)]">
        <h3 className="px-2 mb-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
          {supportSection.title}
        </h3>
        <div className="space-y-[2px]">
          {supportSection.items.map(renderNavItem)}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 shrink-0 bg-[var(--bg-base)]">
        <div 
          onClick={isLoggedIn ? undefined : onAuthOpen}
          className="flex items-center gap-3 p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors"
        >
          {isLoggedIn ? (
            <>
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-[var(--border-base)] object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-xs tracking-tight">
                  {displayName ? displayName.slice(0, 1).toUpperCase() : "U"}
                </div>
              )}
              <div className="flex-1 overflow-hidden flex flex-col justify-center">
                <p className="text-[13px] font-semibold text-[var(--text-main)] leading-tight truncate">{displayName || "User"}</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate mt-[2px]">{email || "Pro Member"}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); signOut(); }} 
                className="text-[var(--text-muted)] hover:text-gray-300 p-1"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-white/5 border border-[var(--border-base)] flex items-center justify-center text-[var(--text-main)] font-bold text-xs tracking-tight">
                <User size={14} className="text-[var(--text-muted)]" />
              </div>
              <div className="flex-1 overflow-hidden flex flex-col justify-center">
                <p className="text-[13px] font-semibold text-[var(--text-main)] leading-tight truncate">Sign In</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate mt-[2px]">Sync your portfolio</p>
              </div>
            </>
          )}
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
