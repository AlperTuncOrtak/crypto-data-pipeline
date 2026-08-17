import { motion, AnimatePresence } from "framer-motion";
import { Zap, Command, ArrowRightLeft, Activity, LineChart, Shield } from "lucide-react";
import { useState, useEffect } from "react";

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

  // Simulate user typing a command
  useEffect(() => {
    let currentText = "";
    let currentIndex = 0;
    let isTyping = true;
    
    const typeNextChar = () => {
      if (!isTyping) return;
      
      if (currentIndex < fullText.length) {
        currentText += fullText[currentIndex];
        setTypedText(currentText);
        currentIndex++;
        const nextDelay = Math.random() * 80 + 40; // random human-like typing speed
        setTimeout(typeNextChar, nextDelay);
      } else {
        setTimeout(() => {
          isTyping = false;
          // Clear and restart after 4 seconds
          setTimeout(() => {
            currentText = "";
            currentIndex = 0;
            setTypedText("");
            isTyping = true;
            typeNextChar();
          }, 3500);
        }, 1500); // Wait on full text
      }
    };

    const initialDelay = setTimeout(typeNextChar, 1000);

    return () => {
      isTyping = false;
      clearTimeout(initialDelay);
    };
  }, []);

  return (
    <section className="py-24 px-6 max-w-[1360px] mx-auto relative z-10">
      
      <div className="w-full h-px bg-[var(--border-subtle)] mb-28 relative">
         <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-[2px] bg-[var(--accent)] shadow-[0_0_12px_var(--accent)] rounded-full" />
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        
        {/* Left: Text & Shortcuts */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="flex-1 w-full"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] mb-6">
            <Zap size={13} className="text-[var(--accent)]" />
            <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--text-muted)]">Omni-Channel Execution</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-[var(--text-main)] mb-6 leading-[1.05]">
            Keyboard-driven.
            <br className="hidden sm:block" />
            Zero friction.
          </h2>
          <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-10 max-w-md">
            Execute complex algorithmic strategies, scan for anomalies, and navigate markets without ever touching your mouse. The entire terminal bends to your fingertips.
          </p>

          <div className="flex flex-col gap-3">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-[16px] border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] transition-all duration-300">
                <div className="flex items-center gap-1.5 shrink-0">
                  {s.keys.map((k, ki) => (
                    <kbd
                      key={ki}
                      className="min-w-[32px] h-8 px-2.5 flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.3)] text-[12px] font-medium text-[var(--text-main)] font-mono tracking-tight"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[var(--text-main)] mb-0.5">{s.label}</div>
                  <div className="text-[13px] text-[var(--text-faint)] leading-snug">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Immersive Command Palette Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          className="flex-1 w-full relative h-[480px] flex items-center justify-center"
        >
          {/* Developer environment backdrop (Terminal shell) */}
          <div className="absolute inset-0 bg-[var(--bg-elevated)] rounded-[32px] border border-[var(--border-subtle)] overflow-hidden hidden md:block opacity-60">
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
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-[var(--accent)] opacity-[0.06] blur-[90px] rounded-full pointer-events-none" />
          </div>

          {/* Actual Command Palette */}
          <div className="relative z-10 w-full max-w-[440px] rounded-[20px] border border-[var(--border-base)] bg-[var(--bg-overlay)] backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden">
            
            {/* Input area */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <Command size={16} className="text-[var(--text-muted)]" />
              <div className="flex-1 flex items-center font-mono text-[14px]">
                <span className="text-[var(--text-main)] tracking-tight">{typedText}</span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  className="w-1.5 h-4 bg-[var(--accent)] ml-1"
                />
              </div>
              <div className="px-2 py-1 rounded-[6px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-[0.15em] font-bold">
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
                    <div className="mx-1 mb-2 mt-1 p-4 rounded-[14px] bg-[var(--accent-muted)] border border-[var(--accent)]/30 shadow-lg shadow-[var(--accent-muted)]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm">
                            <span className="text-[12px] font-bold text-[var(--text-main)]">5 ETH</span>
                          </div>
                          <ArrowRightLeft size={13} className="text-[var(--accent)]" />
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm">
                            <span className="text-[12px] font-bold text-[#2775CA]">USDC</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Shield size={11} className="text-[var(--accent)]" />
                          <span className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">Protected</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 font-mono text-[11.5px] bg-[var(--bg-elevated)] p-3 rounded-[10px] border border-[var(--border-subtle)]">
                        <div className="flex justify-between items-center text-[var(--text-muted)]">
                          <span>Est. Execution</span>
                          <span className="text-[var(--text-main)] font-semibold">12,450.80 USDC</span>
                        </div>
                        <div className="flex justify-between items-center text-[var(--text-muted)]">
                          <span>Max Slippage</span>
                          <span className="text-[var(--positive)] font-semibold">0.10%</span>
                        </div>
                        <div className="flex justify-between items-center text-[var(--text-muted)]">
                          <span>Network Fee</span>
                          <span className="text-[var(--text-muted)]">~ $2.40</span>
                        </div>
                      </div>

                      <button className="w-full mt-3 py-2.5 rounded-[10px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-bold shadow-lg shadow-[var(--accent-border)] transition-colors cursor-default flex items-center justify-center gap-2">
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
                  <div className="px-3 py-2 text-[9px] font-bold text-[var(--text-faint)] uppercase tracking-widest mb-1">
                    Smart Suggestions
                  </div>
                  {SUGGESTIONS.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-3 py-3 rounded-[12px] transition-colors hover:bg-[var(--bg-subtle)] cursor-default group border border-transparent hover:border-[var(--border-subtle)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-[8px] bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 transition-colors group-hover:border-white/10 shadow-sm">
                          <s.icon size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[12px]">
                          <span className="text-[var(--text-faint)]">›</span>
                          <span className="text-[var(--text-main)] font-medium group-hover:text-white transition-colors">{s.command}</span>
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[9px] font-bold text-[var(--text-muted)] ml-1">
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
            <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between">
              <span className="text-[10px] font-medium text-[var(--text-faint)]">
                Pro Tip: Use <kbd className="px-1 py-0.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[4px] font-mono text-[var(--text-muted)] mx-0.5 shadow-sm">Tab</kbd> to autocomplete params
              </span>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
