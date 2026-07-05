import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Home, LayoutDashboard, LineChart, Wallet, Settings as SettingsIcon, X } from "lucide-react";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const menuItems = [
    { name: "Home", icon: <Home size={16} />, path: "/" },
    { name: "Dashboard", icon: <LayoutDashboard size={16} />, path: "/dashboard" },
    { name: "Market", icon: <LineChart size={16} />, path: "/market" },
    { name: "Portfolio", icon: <Wallet size={16} />, path: "/portfolio" },
    { name: "Settings", icon: <SettingsIcon size={16} />, path: "/settings" },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-[#020817]/80 backdrop-blur-sm"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl rounded-2xl bg-[#020817] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-4 py-3 border-b border-white/5">
              <Search className="text-slate-400 mr-3" size={20} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="w-full bg-transparent border-none outline-none text-white placeholder:text-slate-500 font-medium"
              />
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-mono">ESC</kbd>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/5 rounded transition-colors text-slate-400">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredItems.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500">Navigation</div>
                  {filteredItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/20 border border-transparent transition-colors group text-left"
                    >
                      <div className="text-slate-400 group-hover:text-cyan-400">
                        {item.icon}
                      </div>
                      <span className="font-medium text-sm">{item.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No results found for "{query}"
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span>Navigate with</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↓</kbd>
              </div>
              <div className="flex items-center gap-2">
                <span>Select with</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Enter</kbd>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
