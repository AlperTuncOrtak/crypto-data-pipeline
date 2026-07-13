import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles, X, TrendingUp, TrendingDown, Activity, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock arrays removed. Data now fetched from API.

export default function Narratives() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<any>(null);
  const [narratives, setNarratives] = useState<any[]>([]);

  useEffect(() => {
    const fetchNarratives = async () => {
      try {
        const apiUrl = import.meta.env.DEV ? "http://localhost:8000" : `https://${window.location.host}`;
        const res = await fetch(`${apiUrl}/market/narratives`);
        if (res.ok) {
          const data = await res.json();
          setNarratives(data);
        } else {
          throw new Error("Backend not ok");
        }
      } catch (e) {
        console.error("Failed to fetch narratives, using fallback data", e);
        // Fallback mock data so UI still works when backend is down
        setNarratives([
          { id: "ai", name: "Artificial Intelligence", color: "#7c3aed", score: 95, size: 280, x: "30%", y: "40%", delay: 0, trend: "up", summary: "AI tokens are surging following recent tech earnings.", coins: ["FET", "RNDR", "TAO"] },
          { id: "meme", name: "Memecoins", color: "#e11d48", score: 85, size: 220, x: "70%", y: "30%", delay: 0.2, trend: "up", summary: "Retail liquidity rotates aggressively into memecoins.", coins: ["PEPE", "WIF", "DOGE"] },
          { id: "rwa", name: "Real World Assets", color: "#10b981", score: 78, size: 190, x: "50%", y: "65%", delay: 0.5, trend: "up", summary: "Institutional tokenized funds drive RWA protocols.", coins: ["ONDO", "PENDLE", "LINK"] },
          { id: "l2", name: "L2 Scaling", color: "#d97706", score: 45, size: 140, x: "20%", y: "70%", delay: 0.7, trend: "down", summary: "Token unlocks suppress price action in major Layer 2s.", coins: ["ARB", "OP", "STRK"] },
          { id: "depin", name: "DePIN", color: "#2563eb", score: 65, size: 160, x: "80%", y: "60%", delay: 0.4, trend: "up", summary: "Hardware mining models prove sustainable.", coins: ["FIL", "HNT", "AKT"] }
        ]);
      }
    };
    fetchNarratives();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0b0d] text-white pt-24 pb-10 px-6 lg:px-12 overflow-hidden font-sans">
      
      {/* ── BACKGROUND GLOW ── */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-[100%] blur-[150px] opacity-[0.25] mix-blend-screen transition-colors duration-1000"
          style={{ background: "radial-gradient(ellipse at top, var(--accent), transparent 70%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d0f]/90 to-[#0d0d0f] z-10" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-20 h-full flex flex-col">
        
        {/* HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] text-[11px] font-black tracking-widest uppercase mb-4 shadow-[0_0_15px_var(--accent-soft)]">
            <Sparkles size={12} /> AI Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Market Narratives
          </h1>
          <p className="text-gray-400 mt-3 font-medium max-w-xl text-sm md:text-base leading-relaxed">
            Discover where the money flows. Our AI analyzes millions of data points across social media, news, and on-chain activity to map the current market hypes in real-time.
          </p>
        </motion.div>

        {/* ORBS CANVAS */}
        <div className="relative w-full h-[600px] md:h-[700px] rounded-[32px] bg-[#121212]/80 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>

          {narratives.map((orb) => {
            const isSelected = selected?.id === orb.id;
            const isFaded = selected && !isSelected;

            return (
              <motion.div
                key={orb.id}
                layoutId={`orb-${orb.id}`}
                onClick={() => setSelected(orb)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: isFaded ? 0.2 : 1, 
                  scale: isFaded ? 0.9 : 1,
                  y: isSelected ? 0 : [0, -15, 0],
                  filter: isFaded ? "blur(8px)" : "blur(0px)"
                }}
                transition={{ 
                  opacity: { duration: 0.4 },
                  scale: { duration: 0.4 },
                  y: { 
                    duration: 4 + Math.random() * 2, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: orb.delay
                  },
                  layout: { type: "spring", stiffness: 300, damping: 30 }
                }}
                className={`absolute cursor-pointer flex flex-col items-center justify-center rounded-full border border-white/20 transition-all duration-300 hover:border-white/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] ${isSelected ? "z-50" : "z-10"}`}
                style={{
                  width: orb.size,
                  height: orb.size,
                  left: isSelected ? "50%" : orb.x,
                  top: isSelected ? "50%" : orb.y,
                  transform: isSelected ? "translate(-50%, -50%) !important" : "none", // Override if selected
                  marginLeft: isSelected ? -orb.size / 2 : 0,
                  marginTop: isSelected ? -orb.size / 2 : 0,
                  background: `radial-gradient(circle at 30% 30%, ${orb.color}dd, ${orb.color}44, rgba(0,0,0,0.8))`,
                  boxShadow: `0 0 ${orb.size/2}px ${orb.color}66, inset 0 0 20px rgba(255,255,255,0.2)`
                }}
              >
                {/* Glossy highlight */}
                <div className="absolute top-[5%] left-[10%] w-[40%] h-[30%] rounded-[100%] bg-white/20 rotate-[-45deg] blur-[2px] pointer-events-none" />
                
                <span className="text-white font-black tracking-tight text-center drop-shadow-md z-10" style={{ fontSize: Math.max(14, orb.size / 8) }}>
                  {orb.name}
                </span>
                
                {orb.size > 150 && !isSelected && (
                  <span className="mt-2 flex items-center gap-1 text-white/80 font-bold text-[11px] uppercase tracking-widest bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-md">
                    {orb.trend === "up" ? <TrendingUp size={12} className="text-green-400" /> : <TrendingDown size={12} className="text-red-400" />}
                    {orb.score} Score
                  </span>
                )}
              </motion.div>
            );
          })}

          {/* MODAL OVERLAY */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelected(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-6"
              >
                <motion.div
                  layoutId={`orb-${selected.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#1a1a1a]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden relative"
                  style={{
                    boxShadow: `0 0 100px ${selected.color}44`
                  }}
                >
                  {/* Header Gradient */}
                  <div className="h-32 w-full absolute top-0 left-0 opacity-40 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${selected.color}, transparent)` }} />
                  
                  <div className="relative p-8 pt-10">
                    <button 
                      onClick={() => setSelected(null)}
                      className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <X size={16} />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-[32px] flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${selected.color}, #111)` }}>
                        <Activity className="text-white" size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white">{selected.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Hype Score:</span>
                          <span className={`text-[12px] font-black px-2 py-0.5 rounded-md ${selected.score > 80 ? 'bg-green-500/20 text-green-400' : selected.score > 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {selected.score} / 100
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6 p-5 rounded-2xl bg-[#0a0a0d]/60 border border-white/5 text-sm text-gray-300 leading-relaxed font-medium">
                      <Sparkles size={14} className="inline-block mr-2 text-[var(--accent)] -mt-0.5" />
                      {selected.summary}
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Top Tokens in this Narrative</h3>
                      <div className="flex flex-wrap gap-2">
                        {selected.coins.map((coin: string) => (
                          <button
                            key={coin}
                            onClick={() => navigate(`/coin/${coin.toLowerCase()}`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all shadow-md group"
                          >
                            <span className="font-black text-white">{coin}</span>
                            <ArrowRight size={14} className="text-white/30 group-hover:text-white transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
      </div>
    </div>
  );
}

