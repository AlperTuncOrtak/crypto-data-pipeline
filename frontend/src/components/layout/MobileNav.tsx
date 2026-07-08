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
      <div className="absolute inset-0 bg-[#0a0b0d]/90 backdrop-blur-2xl border-t border-white/10 pointer-events-none"></div>
      
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path} 
              to={item.path}
              onClick={handleHaptic}
              className="relative flex flex-col items-center justify-center gap-1 min-w-[50px]"
            >
              <div className={`relative flex items-center justify-center p-2 rounded-xl transition-colors ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {isActive && (
                  <motion.div 
                    layoutId="mobileNavIndicator"
                    className="absolute inset-0 bg-white/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
