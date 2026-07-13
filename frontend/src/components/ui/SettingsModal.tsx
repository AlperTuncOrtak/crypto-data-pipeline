import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Moon, Sun, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'tr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#121212]/95 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
              <p className="text-sm text-gray-400 mt-1">Manage your application preferences</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            
            {/* Language Setting */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Language</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Choose your preferred language</p>
                </div>
              </div>
              <button 
                onClick={toggleLanguage}
                className="px-4 py-2 rounded-lg bg-[#1a1d21] border border-white/10 text-sm font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                {i18n.language === 'en' ? 'English (EN)' : 'Türkçe (TR)'}
              </button>
            </div>

            {/* Theme Setting */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                  {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Theme Appearance</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Toggle dark/light mode</p>
                </div>
              </div>
              <button 
                onClick={toggleTheme}
                className="px-4 py-2 rounded-lg bg-[#1a1d21] border border-white/10 text-sm font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>

            {/* Notifications (Dummy) */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Push Notifications</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Manage price alerts (Coming Soon)</p>
                </div>
              </div>
              <div className="w-10 h-5 bg-gray-600 rounded-full relative">
                <div className="w-4 h-4 bg-gray-400 rounded-full absolute left-0.5 top-0.5" />
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
