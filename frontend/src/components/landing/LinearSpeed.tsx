import { motion, AnimatePresence } from "framer-motion";
import { Zap, Command, ArrowRightLeft, Activity, LineChart, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { SectionHeader } from "../ui/EthenaDesign";

const SHORTCUTS = [
  { label: "Global Omnibar", keys: ["Cmd", "K"], desc: "Instantly search markets, run commands, or switch tools from anywhere." },
  { label: "Quick Trade", keys: ["T"], desc: "Deploy capital instantly via our hidden flashbots overlay without leaving the page." },
  { label: "Toggle AI Overlay", keys: ["A"], desc: "Superimpose anomaly detection scores on top of your current price charts." },
];

const SUGGESTIONS = [
  { id: "s2", icon: Activity, command: "scan whale anomalies", target: "BTC", type: "AI Tool", color: "var(--warning)" },
  { id: "s3", icon: LineChart, command: "generate PnL report", target: "Q3 2023", type: "Analytics", color: "var(--positive)" },
];

export function LinearSpeed() {
  const [typedText, setTypedText] = useState("");
  const fullText = "swap 5 ETH to USDC";

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;
    let currentText = "";
    let currentIndex = 0;

    const typeNextChar = () => {
      if (!isMounted) return;
      if (currentIndex < fullText.length) {
        currentText += fullText[currentIndex];
        setTypedText(currentText);
        currentIndex++;
        timeoutId = setTimeout(typeNextChar, Math.random() * 80 + 40);
      } else {
        timeoutId = setTimeout(() => {
          if (!isMounted) return;
          currentText = "";
          currentIndex = 0;
          setTypedText("");
          timeoutId = setTimeout(typeNextChar, 500);
        }, 3000);
      }
    };

    timeoutId = setTimeout(typeNextChar, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section className="py-32 px-6 max-w-[1360px] mx-auto relative z-10 w-full">
      
      {/* Ethena-style Centered Text */}
      <SectionHeader 
        badge="OMNI-CHANNEL EXECUTION"
        title="Keyboard-driven. Zero friction."
        subtitle="Execute complex algorithmic strategies, scan for anomalies, and navigate markets without ever touching your mouse. The entire terminal bends to your fingertips."
      />

      {/* Two Column Layout like original */}
      <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 mt-8">
        
        {/* Left: Shortcuts List */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="flex-1 w-full"
        >
          <div className="flex flex-col gap-4">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-[16px] bg-[#0a0a0f] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-xl">
                <div className="flex items-center gap-2 shrink-0">
                  {s.keys.map((k, ki) => (
                    <kbd
                      key={ki}
                      className="min-w-[36px] h-9 px-3 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg shadow-md text-[13px] font-medium text-white font-mono tracking-tight"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white mb-1 tracking-tight">{s.label}</div>
                  <div className="text-[14px] text-white/50 leading-relaxed">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Immersive Command Palette Mockup (ORIGINAL ANIMATION RESTORED) */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          className="flex-1 w-full relative h-[480px] flex items-center justify-center"
        >
          {/* Developer environment backdrop (Terminal shell) */}
          <div className="absolute inset-0 bg-[#0a0a0f] rounded-[32px] border border-white/5 overflow-hidden hidden md:block opacity-80 shadow-2xl">
            {/* Fake code/logs */}
            <div className="absolute inset-0 p-8 font-mono text-[10px] text-[var(--text-faint)] leading-relaxed pointer-events-none select-none opacity-40">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="mb-2 whitespace-nowrap">
                  {`[${new Date().toISOString()}] TRACE: Handshake accepted ws://engine.cryptoneko.io`} <br/>
                  {`[0x00${i}f] MEMORY: 4096 bytes allocated for high-freq book deltas -> stream_id_${i * 48}`}
                </div>
              ))}
            </div>
            {/* Deep glow from the center */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-[var(--accent)] opacity-[0.08] blur-[90px] rounded-full pointer-events-none" />
          </div>

          {/* Actual Command Palette */}
          <div className="relative z-10 w-full max-w-[440px] rounded-[20px] border border-white/10 bg-[#09090b]/80 backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden">
            
            {/* Input area */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-white/[0.02]">
              <Command size={16} className="text-white/40" />
              <div className="flex-1 flex items-center font-mono text-[14px]">
                <span className="text-white tracking-tight">{typedText}</span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  className="w-1.5 h-4 bg-[var(--accent)] ml-1"
                />
              </div>
              <div className="px-2 py-1 rounded-[6px] bg-white/5 border border-white/10 text-[9px] text-white/40 font-mono uppercase tracking-[0.15em] font-bold">
                Cmd
              </div>
            </div>

            {/* Suggestions & Preview */}
            <div className="p-2 space-y-1">
              <AnimatePresence mode="popLayout">
                {typedText.length > 8 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="mx-1 mb-2 mt-1 p-4 rounded-[14px] bg-[var(--accent)]/10 border border-[var(--accent)]/30 shadow-lg shadow-[var(--accent)]/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/10 shadow-sm">
                            <span className="text-[12px] font-bold text-white">5 ETH</span>
                          </div>
                          <ArrowRightLeft size={13} className="text-[var(--accent)]" />
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/10 shadow-sm">
                            <span className="text-[12px] font-bold text-[#2775CA]">USDC</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Shield size={11} className="text-[var(--positive)]" />
                          <span className="text-[9px] font-mono font-bold text-[var(--positive)] uppercase tracking-wider">Protected</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 font-mono text-[11.5px] bg-black/40 p-3 rounded-[10px] border border-white/5">
                        <div className="flex justify-between items-center text-white/50">
                          <span>Est. Execution</span>
                          <span className="text-white font-semibold">12,450.80 USDC</span>
                        </div>
                        <div className="flex justify-between items-center text-white/50">
                          <span>Max Slippage</span>
                          <span className="text-[var(--positive)] font-semibold">0.10%</span>
                        </div>
                        <div className="flex justify-between items-center text-white/50">
                          <span>Network Fee</span>
                          <span className="text-white/40">~ $2.40</span>
                        </div>
                      </div>

                      <button className="w-full mt-3 py-2.5 rounded-[10px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-bold shadow-lg transition-colors cursor-default flex items-center justify-center gap-2">
                        Press Enter to Execute 
                        <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white/20 text-[9px] font-mono ml-1">↵</kbd>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Other Suggestions */}
              {typedText.length < 8 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-1">
                  <div className="px-3 py-2 text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">
                    Smart Suggestions
                  </div>
                  {SUGGESTIONS.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-3 py-3 rounded-[12px] transition-colors hover:bg-white/5 cursor-default group border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[8px] bg-black/40 border border-white/5 flex items-center justify-center shrink-0 transition-colors group-hover:border-white/10 shadow-sm">
                          <s.icon size={13} className="text-white/40 group-hover:text-white" />
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[12px]">
                          <span className="text-white/30">›</span>
                          <span className="text-white/70 font-medium group-hover:text-white transition-colors">{s.command}</span>
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-white/5 border border-white/5 text-[9px] font-bold text-white/40 ml-1">
                            {s.target}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: s.color }}>
                        {s.type}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
              <span className="text-[10px] font-medium text-white/30">
                Pro Tip: Use <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded-[4px] font-mono text-white/50 mx-0.5 shadow-sm">Tab</kbd> to autocomplete params
              </span>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}