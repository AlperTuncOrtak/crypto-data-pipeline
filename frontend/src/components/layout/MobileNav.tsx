import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LineChart, Target, PieChart, Activity, ArrowDownUp } from "lucide-react";
import { motion } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export default function MobileNav() {
  const location = useLocation();

  const handleHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Home" },
    { path: "/market", icon: LineChart, label: "Market" },
    { path: "/whale", icon: Activity, label: "X-Ray" },
    { path: "/timemachine", icon: Target, label: "Time" },
    { path: "/swap", icon: ArrowDownUp, label: "Swap" },
    { path: "/portfolio", icon: PieChart, label: "Portfolio" },
  ];

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="absolute inset-0 bg-[var(--bg-elevated)]/90 backdrop-blur-2xl border-t border-[var(--border-subtle)] pointer-events-none"></div>
      
      <div className="relative z-10 flex items-center justify-between px-2 sm:px-6 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path} 
              to={item.path}
              onClick={handleHaptic}
              className="relative flex flex-col items-center justify-center gap-[2px] flex-1"
            >
              <div className={`relative flex items-center justify-center p-1.5 rounded-2xl transition-colors ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                {isActive && (
                  <motion.div 
                    layoutId="mobileNavIndicator"
                    className="absolute inset-0 bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-2xl"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
              </div>
              <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
