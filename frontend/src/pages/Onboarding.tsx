import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, TrendingUp, BarChart2, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// 3 Avatars available for selection
const AVATARS = [
  { id: 'avatar-1', bg: 'linear-gradient(135deg, #f96bee, #533afd)' },
  { id: 'avatar-2', bg: 'linear-gradient(135deg, #10b981, #047857)' },
  { id: 'avatar-3', bg: 'linear-gradient(135deg, #f59e0b, #b45309)' },
];

const EXPERIENCES = [
  { id: 'beginner', title: 'Beginner', desc: 'Just starting my crypto journey', icon: TrendingUp },
  { id: 'intermediate', title: 'Intermediate', desc: 'I know my way around the market', icon: BarChart2 },
  { id: 'pro', title: 'Pro', desc: 'On-chain analytics and deep data', icon: Crown },
];

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: '#f59e0b' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: '#8b5cf6' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', color: '#10b981' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', color: '#facc15' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', color: '#3b82f6' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const [experience, setExperience] = useState('beginner');
  const [favorites, setFavorites] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save choices
      localStorage.setItem('cryptoneko_avatar', avatar);
      localStorage.setItem('cryptoneko_experience', experience);
      localStorage.setItem('cryptoneko_favorites', JSON.stringify(favorites));
      localStorage.setItem('cryptoneko_onboarded', 'true');
      
      // Simulate finish
      navigate('/dashboard');
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] overflow-hidden flex items-center justify-center font-sans">
      {/* Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute top-[-10%] left-[20%] w-[800px] h-[500px] bg-[#533afd] blur-[180px] rounded-full opacity-30 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[400px] bg-[#f96bee] blur-[150px] rounded-full opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6">
        <div className="mb-12 flex justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div 
                className={`w-12 h-2 rounded-full transition-all duration-500 ${s <= step ? 'bg-white' : 'bg-white/10'}`}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-[var(--bg-subtle)]/80 backdrop-blur-2xl border border-[var(--border-base)] rounded-[32px] p-8 md:p-12 shadow-2xl text-center"
            >
              <h1 className="text-4xl font-black tracking-tight mb-2">Welcome to CryptoNeko</h1>
              <p className="text-[var(--text-muted)] mb-10 text-lg">Pick an avatar to represent you on your journey.</p>
              
              <div className="flex justify-center gap-6 mb-12">
                {AVATARS.map((av) => (
                  <motion.button
                    whileHover={{ scale: 1.1, type: "spring", stiffness: 400, damping: 20 }}
                    whileTap={{ scale: 0.95 }}
                    key={av.id}
                    onClick={() => setAvatar(av.id)}
                    className={`relative w-24 h-24 rounded-full p-1 transition-all ${avatar === av.id ? 'ring-4 ring-white ring-offset-4 ring-offset-[#16181c]' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <div className="w-full h-full rounded-full shadow-inner" style={{ background: av.bg }} />
                    {avatar === av.id && (
                      <div className="absolute -bottom-2 -right-2 bg-white text-black p-1.5 rounded-full shadow-lg">
                        <Check size={16} strokeWidth={4} />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              >
                Continue <ChevronRight size={20} />
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-[var(--bg-subtle)]/80 backdrop-blur-2xl border border-[var(--border-base)] rounded-[32px] p-8 md:p-12 shadow-2xl"
            >
              <h1 className="text-3xl font-black tracking-tight mb-2 text-center">What's your experience level?</h1>
              <p className="text-[var(--text-muted)] mb-10 text-center text-lg">We'll tailor your dashboard to your expertise.</p>
              
              <div className="flex flex-col gap-4 mb-10">
                {EXPERIENCES.map((exp) => {
                  const Icon = exp.icon;
                  const isSelected = experience === exp.id;
                  return (
                    <motion.button
                      key={exp.id}
                      whileHover={{ scale: 1.01, backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setExperience(exp.id)}
                      className={`flex items-center gap-5 p-5 rounded-2xl border text-left transition-colors ${isSelected ? 'bg-white/10 border-white/30' : 'bg-transparent border-[var(--border-subtle)]'}`}
                    >
                      <div className={`w-12 h-12 rounded-3xl flex items-center justify-center ${isSelected ? 'bg-white text-black' : 'bg-white/10 text-[var(--text-main)]'}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{exp.title}</div>
                        <div className="text-sm text-[var(--text-muted)]">{exp.desc}</div>
                      </div>
                      {isSelected && <Check className="ml-auto text-[var(--text-main)]" size={24} />}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              >
                Continue <ChevronRight size={20} />
              </motion.button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-[var(--bg-subtle)]/80 backdrop-blur-2xl border border-[var(--border-base)] rounded-[32px] p-8 md:p-12 shadow-2xl"
            >
              <h1 className="text-3xl font-black tracking-tight mb-2 text-center">Select your favorite assets</h1>
              <p className="text-[var(--text-muted)] mb-10 text-center text-lg">Pick a few coins to jumpstart your Watchlist.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
                {COINS.map((coin) => {
                  const isSelected = favorites.includes(coin.id);
                  return (
                    <motion.button
                      key={coin.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleFavorite(coin.id)}
                      className={`relative flex flex-col items-center p-4 rounded-[24px] border transition-colors ${isSelected ? 'bg-white/10 border-white/30' : 'bg-[var(--bg-base)]/50 border-[var(--border-base)] hover:bg-[var(--border-subtle)]'}`}
                    >
                      <div className="w-12 h-12 rounded-full mb-3 shadow-lg flex items-center justify-center text-lg font-black" style={{ background: `linear-gradient(135deg, ${coin.color}50, ${coin.color})` }}>
                        {coin.symbol[0]}
                      </div>
                      <div className="font-bold text-sm">{coin.symbol}</div>
                      <div className="text-xs text-[var(--text-muted)]">{coin.name}</div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-white text-black p-0.5 rounded-full shadow-lg">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={favorites.length === 0}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${favorites.length > 0 ? 'bg-white text-black hover:bg-gray-100 shadow-[0_0_40px_rgba(255,255,255,0.1)]' : 'bg-white/10 text-[var(--text-muted)] cursor-not-allowed'}`}
              >
                {favorites.length > 0 ? "Complete Setup" : "Select at least 1 coin"} <ChevronRight size={20} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
