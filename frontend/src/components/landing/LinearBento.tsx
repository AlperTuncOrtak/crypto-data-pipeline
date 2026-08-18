import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  ArrowRight, Brain, Activity, Server, Database, 
  Terminal, Globe, Shield, ChevronRight, PieChart, 
  LineChart, Workflow, Layers, CheckCircle2 
} from "lucide-react";

// ¦¦¦ Shared Glass Card ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
function GlassCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={ + "" + elative overflow-hidden rounded-[20px] bg-[#0a0a0f] border border-white/[0.06] shadow-2xl transition-all duration-300 hover:border-white/[0.1]  + "$" + {className} + "" + }
    >
      {/* Subtle top inner highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
      <div className="relative z-10 w-full h-full p-8 md:p-10 flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}

// ¦¦¦ Section 1: The Holy Grail ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
function APYRow({ name, value, active, icon: Icon }: { name: string; value: string; active?: boolean; icon: any }) {
  return (
    <div className={ + "" + lex items-center gap-4 py-4 border-b border-white/[0.04] last:border-0  + "$" + {active ? "opacity-100" : "opacity-50"} + "" + }>
      <div className="flex items-center gap-3 w-40">
        <div className={ + "" + lex items-center justify-center w-6 h-6 rounded-full  + "$" + {active ? "bg-[var(--accent)]" : "bg-white/10"} + "" + }>
          <Icon size={12} className={active ? "text-white" : "text-white/60"} />
        </div>
        <span className="text-[14px] font-medium text-white">{name}</span>
      </div>
      <div className="flex-1 border-t border-dashed border-white/20 mx-4" />
      <div className={ + "" + 	ext-[15px] font-mono font-bold  + "$" + {active ? "text-[var(--accent)]" : "text-white"} + "" + }>
        {value}
      </div>
    </div>
  );
}

// ¦¦¦ Section 2: Integrations/Lists ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
function ListCard({ title, subtitle, items, icon: Icon, delay = 0 }: any) {
  return (
    <GlassCard className="flex-1" delay={delay}>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/5">
          <Icon size={14} className="text-white/80" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">{title}</div>
      </div>
      
      <h3 className="text-[22px] font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-[14px] text-white/50 mb-8 leading-relaxed h-[42px]">{subtitle}</p>

      <div className="flex flex-col gap-1">
        {items.map((item: any, i: number) => (
          <div key={i} className="group flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                <item.icon size={12} className="text-white/70" />
              </div>
              <span className="text-[14px] font-medium text-white/90">{item.name}</span>
            </div>
            {item.badge ? (
              <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                {item.badge}
              </span>
            ) : (
              <ChevronRight size={14} className="text-white/20 group-hover:text-white/70 transition-colors" />
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ¦¦¦ Section 3: Transparency Components ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
function WhaleRadarMini() {
  const [items, setItems] = useState([
    { id: 1, type: "WHALE BUY", amount: "1,200 BTC", time: "Just now" },
    { id: 2, type: "ANOMALY", amount: "45k ETH", time: "2s ago" },
  ]);

  useEffect(() => {
    let idCounter = 3;
    const assets = ["BTC", "ETH", "SOL"];
    const types = ["WHALE BUY", "ANOMALY"];
    const int = setInterval(() => {
      setItems(prev => {
        const typeStr = types[Math.floor(Math.random() * types.length)];
        const newItem = {
          id: idCounter++,
          type: typeStr,
          amount:  + "" + $ + "$" + {Math.floor(Math.random() * 500 + 10)}  + "$" + {assets[Math.floor(Math.random() * assets.length)]} + "" + ,
          time: "Just now"
        };
        return [newItem, ...prev.map(p => ({ ...p, time: "2s ago" }))].slice(0, 2);
      });
    }, 3000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="mt-8 flex flex-col gap-2 relative">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            layout
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.05]"
          >
            <div className="flex gap-3 items-center">
              <span className={ + "" + 	ext-[9px] font-bold px-2 py-0.5 rounded-[4px] tracking-wider uppercase border  + "$" + {
                item.type === "ANOMALY" ? "text-orange-400 border-orange-400/20 bg-orange-400/10" : "text-green-400 border-green-400/20 bg-green-400/10"
              } + "" + }>
                {item.type}
              </span>
              <span className="text-[13px] text-white font-mono font-semibold">{item.amount}</span>
            </div>
            <span className="text-[11px] text-white/40 font-mono">{item.time}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ¦¦¦ Main LinearBento Component ¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦¦
export function LinearBento() {
  return (
    <div className="w-full bg-[#030305] py-32 px-6 relative z-10">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-32">

        {/* ¦¦ SECTION 1: THE HOLY GRAIL ¦¦ */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-[26px] md:text-[32px] text-white tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              The Edge: Algorithmic Alpha
            </h2>
          </div>

          <GlassCard className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_50%)]">
            {/* Left side text */}
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-[32px] md:text-[40px] font-medium text-white leading-[1.1] tracking-[-0.02em] mb-6">
                Trading Technology <br className="hidden lg:block" />
                For The Frontier
              </h3>
              <p className="text-[15px] text-white/50 leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                Institutional execution engine and ML anomaly detection, packaged in a single high-performance web terminal.
              </p>
              <button className="flex items-center gap-2 mx-auto lg:mx-0 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[13px] font-medium transition-colors">
                View Architecture <ArrowRight size={14} />
              </button>
            </div>

            {/* Right side list */}
            <div className="flex-1 w-full max-w-lg bg-black/40 rounded-[20px] border border-white/5 p-8">
              <div className="flex items-center justify-end gap-2 mb-6">
                <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-md bg-white/5 text-white/50 border border-white/5">Benchmark</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">Live Net</span>
              </div>
              <div className="flex flex-col">
                <APYRow name="AI ML Strategy" value="12.8% APY" icon={Brain} active />
                <APYRow name="Delta Neutral" value="8.0% APY" icon={Activity} />
                <APYRow name="Treasuries" value="5.2% APY" icon={Server} />
                <APYRow name="Banks" value="0.5% APY" icon={Database} />
              </div>
              <p className="text-[10px] text-white/30 mt-8 text-center leading-relaxed">
                Backtested performance based on historical data. Live APY may fluctuate based on market conditions and volatility models. Not financial advice.
              </p>
            </div>
          </GlassCard>
        </section>

        {/* ¦¦ SECTION 2: READY TO START ¦¦ */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-[26px] md:text-[32px] text-white tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Ready to Start?
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <ListCard 
              title="Terminal"
              subtitle="Built for speed. Low-latency execution directly in your browser."
              icon={Terminal}
              items={[
                { name: "Whale Radar", icon: Activity },
                { name: "Orderbook DOM", icon: Layers },
                { name: "Pro Charting", icon: LineChart },
                { name: "Portfolio Sync", icon: PieChart },
              ]}
              delay={0}
            />
            <ListCard 
              title="Integrations"
              subtitle="100% on-chain & CEX coverage. Unified liquidity access."
              icon={Globe}
              items={[
                { name: "Binance", icon: Server },
                { name: "Bybit", icon: Server },
                { name: "OKX", icon: Server },
                { name: "dYdX (DeFi)", icon: Database },
              ]}
              delay={0.1}
            />
            <ListCard 
              title="Institutional"
              subtitle="API & Colocation services for high-frequency trading firms."
              icon={Shield}
              items={[
                { name: "FIX API", icon: Workflow },
                { name: "WebSocket V2", icon: Activity },
                { name: "Direct Connect", icon: Server, badge: "Coming Soon" },
                { name: "Custom SLA", icon: Shield, badge: "Coming Soon" },
              ]}
              delay={0.2}
            />
          </div>
        </section>

        {/* ¦¦ SECTION 3: TRANSPARENCY ¦¦ */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-[26px] md:text-[32px] text-white tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Unparalleled Transparency
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <GlassCard className="flex-1 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_60%)]" delay={0}>
              <h3 className="text-[18px] font-bold text-white mb-2">Real-Time Anomaly Detection</h3>
              <p className="text-[14px] text-white/50 leading-relaxed">
                Isolation Forest ML running tick-by-tick to identify institutional flows before they print on standard charts.
              </p>
              <WhaleRadarMini />
            </GlassCard>

            <GlassCard className="flex-1 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.06),transparent_60%)]" delay={0.1}>
              <h3 className="text-[18px] font-bold text-white mb-2">Priority Proof of Execution</h3>
              <p className="text-[14px] text-white/50 leading-relaxed">
                Independent third-party audits of all AI signals and strategy returns, verified cryptographically.
              </p>
              <div className="mt-8 flex gap-4">
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex-1">
                  <Shield size={14} className="text-white/40" />
                  <span className="text-[12px] font-semibold text-white/70">Zellic</span>
                </div>
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.05] flex-1">
                  <CheckCircle2 size={14} className="text-white/40" />
                  <span className="text-[12px] font-semibold text-white/70">Quantstamp</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="flex-1 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.06),transparent_60%)]" delay={0.2}>
              <h3 className="text-[18px] font-bold text-white mb-2">Sentiment Aggregation</h3>
              <p className="text-[14px] text-white/50 leading-relaxed">
                NLP analysis on 100k+ social and news sources per second, distilled into a single actionable index.
              </p>
              <div className="mt-8 flex items-center justify-center">
                {/* Minimal Sentiment Arch */}
                <div className="relative w-[180px] h-[90px] overflow-hidden flex items-end justify-center">
                  <div className="absolute top-0 w-[180px] h-[180px] rounded-full border-[6px] border-white/10" />
                  <div className="absolute top-0 w-[180px] h-[180px] rounded-full border-[6px] border-transparent border-t-orange-400 border-l-orange-400 rotate-45" />
                  <div className="text-center pb-2">
                    <div className="text-[24px] font-black text-white leading-none">78</div>
                    <div className="text-[10px] text-orange-400 uppercase tracking-widest mt-1 font-bold">Greed</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Bottom Transparency Metric Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/[0.06]">
            <div className="text-center">
              <div className="text-[20px] font-black text-white mb-1">14ms</div>
              <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold flex items-center justify-center gap-1.5">
                <Activity size={10} /> AVG LATENCY
              </div>
            </div>
            <div className="text-center">
              <div className="text-[20px] font-black text-white mb-1">92.4%</div>
              <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold flex items-center justify-center gap-1.5">
                <Brain size={10} /> SIGNAL ACCURACY
              </div>
            </div>
            <div className="text-center">
              <div className="text-[20px] font-black text-white mb-1">100%</div>
              <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold flex items-center justify-center gap-1.5">
                <Shield size={10} /> NON-CUSTODIAL
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
