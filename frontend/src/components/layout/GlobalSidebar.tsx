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
  User,
  Moon,
  Sun
} from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import SearchCommand from '../ui/SearchCommand';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

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
      { name: 'TV Analyst', path: '/tv-analyst', icon: Activity },
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
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Contact Me', path: 'mailto:support@cryptoneko.com', icon: MessageCircle },
  ]
};

export default function GlobalSidebar({ onSearchOpen, onAuthOpen }: { onSearchOpen: () => void, onAuthOpen?: () => void }) {
  const location = useLocation();
  const { isLoggedIn, displayName, email, avatar, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [expanded, setExpanded] = useState<string[]>(['Market Data']); // Default expand 'Market Data'
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('cryptoneko_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('cryptoneko_sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleExpand = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (isCollapsed) toggleCollapse(); // Auto-expand sidebar if trying to open a sub-menu
    setExpanded(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const renderNavItem = (item: any) => {
    const isActive = location.pathname === item.path || (item.subItems && item.subItems.some((sub: any) => location.pathname === sub.path));
    const isExpanded = expanded.includes(item.name);
    
    return (
      <div key={item.name} className="relative group/nav" title={isCollapsed ? item.name : undefined}>
        <NavLink
          to={item.subItems ? '#' : item.path}
          onClick={(e) => {
            if (item.subItems) {
              toggleExpand(item.name, e);
            }
          }}
          className={`flex items-center gap-3 px-2.5 h-[34px] rounded-[6px] text-[13.5px] font-medium transition-all duration-200 group ${
            isActive && !item.subItems
              ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-subtle)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]/50'
          } ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
          <item.icon size={15} strokeWidth={2.2} className={`shrink-0 ${isActive && !item.subItems ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`} />
          
          {!isCollapsed && (
            <>
              <span className="flex-1 truncate">{item.name}</span>
              {item.subItems && (
                isExpanded ? <ChevronUp size={14} className="text-[var(--text-muted)] shrink-0" /> : <ChevronDown size={14} className="text-[var(--text-muted)] shrink-0" />
              )}
            </>
          )}
        </NavLink>

        {/* Sub Items Tree View */}
        {item.subItems && isExpanded && !isCollapsed && (
          <div className="mt-1 mb-1 ml-[17px] pl-4 border-l border-[var(--border-base)] flex flex-col gap-[2px] relative overflow-hidden">
            {item.subItems.map((sub: any) => {
              const isSubActive = location.pathname + location.search === sub.path || location.pathname === sub.path;
              return (
                <NavLink
                  key={sub.name}
                  to={sub.path}
                  className="relative flex items-center px-2.5 h-[30px] rounded-[6px] text-[13px] font-medium transition-all group truncate"
                >
                  {/* Horizontal connector line */}
                  <div className="absolute left-[-16px] top-1/2 w-[12px] border-t border-[var(--border-base)]" />
                  
                  <span className={`truncate ${isSubActive ? 'text-[var(--text-main)] font-semibold' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>
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
    <div 
      className={`relative bg-[var(--bg-base)] h-screen border-r border-[var(--border-base)] flex-col hidden md:flex shrink-0 font-sans transition-[width] duration-300 ease-in-out z-[100] ${isCollapsed ? 'w-[68px]' : 'w-[260px]'}`}
    >
      {/* Header Area */}
      <div className={`h-[60px] flex items-center px-5 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <AnimatedLogo />}
        {isCollapsed && (
          <div className="w-8 h-8 flex items-center justify-center font-extrabold text-[var(--text-main)] bg-[var(--bg-elevated)] rounded-full border border-[var(--border-subtle)] shrink-0">
            N
          </div>
        )}
        <button 
          onClick={toggleCollapse}
          className={`text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1.5 rounded-2xl hover:bg-[var(--bg-elevated)] ${isCollapsed ? 'absolute -right-3 top-[18px] bg-[var(--bg-base)] border border-[var(--border-base)] shadow-sm' : ''}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ArrowRightLeft size={12} strokeWidth={2.5} /> : <PanelLeftClose size={16} strokeWidth={2} />}
        </button>
      </div>

      {/* Search Bar Placeholder */}
      <div className={`pb-4 shrink-0 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <button 
          onClick={onSearchOpen}
          className={`w-full flex items-center gap-2.5 h-[36px] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[8px] text-[13px] text-[var(--text-muted)] transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
          title="Search"
        >
          <Search size={14} className="text-[var(--text-muted)] shrink-0" strokeWidth={2.5} />
          {!isCollapsed && (
            <>
              <span className="font-medium text-[var(--text-muted)] truncate">Search anything</span>
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <kbd className="px-1.5 py-0.5 text-[10px] bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-sm font-semibold font-mono">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-sm font-semibold font-mono">K</kbd>
              </div>
            </>
          )}
        </button>
      </div>

      {/* Navigation Links - Scrollable */}
      <div className={`flex-1 overflow-y-auto pt-1 pb-4 space-y-6 custom-scrollbar ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {mainNavSections.map((section, idx) => (
          <div key={idx}>
            {!isCollapsed ? (
              <h3 className="px-2 mb-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider truncate">
                {section.title}
              </h3>
            ) : (
              <div className="w-full h-px bg-[var(--border-subtle)] my-2" />
            )}
            <div className="space-y-[2px]">
              {section.items.map(renderNavItem)}
            </div>
          </div>
        ))}
      </div>

      {/* Support Section - Pinned to bottom */}
      <div className={`pt-4 shrink-0 border-t border-[var(--border-base)] bg-[var(--bg-base)] ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {!isCollapsed && (
          <h3 className="px-2 mb-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider truncate">
            {supportSection.title}
          </h3>
        )}
        <div className="space-y-[2px]">
          {supportSection.items.map(renderNavItem)}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className={`p-4 shrink-0 bg-[var(--bg-base)] ${isCollapsed ? 'px-2' : ''}`}>
        <div 
          onClick={isLoggedIn ? undefined : onAuthOpen}
          className={`flex items-center gap-3 p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors ${isCollapsed ? 'justify-center rounded-xl' : 'rounded-3xl'}`}
          title={isLoggedIn ? displayName : "Sign In"}
        >
          {isLoggedIn ? (
            <>
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-[var(--border-base)] object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--bg-base)] font-bold text-xs tracking-tight shadow-sm shrink-0">
                  {displayName ? displayName.slice(0, 1).toUpperCase() : "U"}
                </div>
              )}
              {!isCollapsed && (
                <>
                  <div className="flex-1 overflow-hidden flex flex-col justify-center">
                    <p className="text-[13px] font-semibold text-[var(--text-main)] leading-tight truncate">{displayName || "User"}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate mt-[2px]">{email || "Pro Member"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleTheme(); }} 
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-overlay)] rounded-lg transition-colors cursor-pointer"
                      title="Toggle Theme"
                    >
                      {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); signOut(); }} 
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--negative)] hover:bg-[var(--negative-muted)] rounded-lg transition-colors cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)] font-bold text-xs tracking-tight shrink-0">
                <User size={14} className="text-[var(--text-muted)]" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden flex flex-col justify-center">
                  <p className="text-[13px] font-semibold text-[var(--text-main)] leading-tight truncate">Sign In</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate mt-[2px]">Sync your portfolio</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
