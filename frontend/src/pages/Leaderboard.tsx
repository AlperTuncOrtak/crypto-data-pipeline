import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Target, Activity, ChevronRight, Award, Medal } from "lucide-react";

// ============================================================================
// MOCK DATA
// ============================================================================
// Mock arrays removed. Data now fetched from API.

const springHover = {
  scale: 0.98,
  transition: { type: "spring", stiffness: 400, damping: 25 }
};

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("Weekly");
  const [topTraders, setTopTraders] = useState<any[]>([]);
  const [otherTraders, setOtherTraders] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const apiUrl = import.meta.env.DEV ? "http://localhost:8000" : `https://${window.location.host}`;
        const res = await fetch(`${apiUrl}/portfolio/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setTopTraders(data.top);
          setOtherTraders(data.others);
        }
      } catch (e) {
        console.error("Failed to fetch leaderboard", e);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white pt-24 pb-20 px-6 lg:px-12 font-sans selection:bg-[#533afd] selection:text-white overflow-x-hidden">
      
      {/* BACKGROUND GLOWS (Stripe inspired mesh at the top) */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40">
        <div className="w-[800px] h-[300px] bg-[#533afd] blur-[150px] rounded-[100%] opacity-30 absolute -top-[100px] left-[10%]"></div>
        <div className="w-[600px] h-[250px] bg-[#f96bee] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div>
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#16181c] border border-white/10 flex items-center justify-center">
                <Trophy size={20} className="text-[#f4b000]" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Leaderboard</h1>
            </div>
            <p className="text-[#a8acb3] text-base max-w-lg">
              The most profitable traders in the ecosystem. Copy their moves, analyze their portfolios, and climb the ranks.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex bg-[#16181c] p-1.5 rounded-[20px] border border-white/5 w-fit">
            {["Daily", "Weekly", "All-Time"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-[16px] text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab 
                  ? "bg-[#273951] text-white shadow-sm" 
                  : "text-[#a8acb3] hover:text-white hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </motion.div>
        </div>

        {/* PODIUM (TOP 3) - Family / Stripe Style */}
        {topTraders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
          {/* Rank 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={springHover}
            className={`relative rounded-[32px] p-1 md:order-1 ${topTraders[1]?.shadow}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${topTraders[1]?.color} opacity-40 rounded-[32px] blur-xl`}></div>
            <div className="relative bg-[#16181c] border border-white/10 rounded-[28px] p-6 h-full overflow-hidden">
               <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${topTraders[1]?.color} opacity-10 blur-2xl rounded-full`}></div>
               
               <div className="flex justify-between items-start mb-8">
                 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center text-xl font-bold backdrop-blur-md">
                   {topTraders[1]?.avatar}
                 </div>
                 <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#a8acb3] font-bold text-sm">#2</div>
               </div>
               
               <h3 className="text-xl font-bold mb-1">{topTraders[1]?.name}</h3>
               <div className="text-3xl font-mono font-bold text-[#10b981] mb-6 tracking-tight">{topTraders[1]?.roi}</div>
               
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#a8acb3] flex items-center gap-1.5"><TrendingUp size={14} /> PNL</span>
                   <span className="font-mono font-semibold">{topTraders[1]?.pnl}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#a8acb3] flex items-center gap-1.5"><Target size={14} /> Win Rate</span>
                   <span className="font-mono font-semibold">{topTraders[1]?.winRate}</span>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Rank 1 (Center, Larger) */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={springHover}
            className={`relative rounded-[36px] p-[2px] md:order-2 md:-translate-y-8 ${topTraders[0]?.shadow} z-10`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${topTraders[0]?.color} rounded-[36px]`}></div>
            <div className={`absolute inset-0 bg-gradient-to-b ${topTraders[0]?.color} opacity-60 rounded-[36px] blur-2xl`}></div>
            <div className="relative bg-[#0a0b0d] rounded-[34px] p-8 h-full overflow-hidden">
               <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${topTraders[0]?.color} opacity-20 blur-3xl rounded-full`}></div>
               
               <div className="flex justify-between items-start mb-8">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-transparent border border-white/30 flex items-center justify-center text-2xl font-bold backdrop-blur-md shadow-lg">
                   {topTraders[0]?.avatar}
                 </div>
                 <div className="flex items-center gap-1 bg-[#16181c] border border-white/10 px-4 py-1.5 rounded-full">
                   <Award size={16} className="text-[#f96bee]" />
                   <span className="text-white font-bold">#1</span>
                 </div>
               </div>
               
               <h3 className="text-2xl font-bold mb-2">{topTraders[0]?.name}</h3>
               <div className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-8 tracking-tight">{topTraders[0]?.roi}</div>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                   <span className="text-[#a8acb3] flex items-center gap-2 text-sm"><TrendingUp size={16} /> Total PNL</span>
                   <span className="font-mono font-bold text-lg text-[#10b981]">{topTraders[0]?.pnl}</span>
                 </div>
                 <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                   <span className="text-[#a8acb3] flex items-center gap-2 text-sm"><Target size={16} /> Win Rate</span>
                   <span className="font-mono font-bold text-lg text-white">{topTraders[0]?.winRate}</span>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Rank 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={springHover}
            className={`relative rounded-[32px] p-1 md:order-3 ${topTraders[2]?.shadow}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${topTraders[2]?.color} opacity-40 rounded-[32px] blur-xl`}></div>
            <div className="relative bg-[#16181c] border border-white/10 rounded-[28px] p-6 h-full overflow-hidden">
               <div className={`absolute top-0 left-0 w-32 h-32 bg-gradient-to-br ${topTraders[2]?.color} opacity-10 blur-2xl rounded-full`}></div>
               
               <div className="flex justify-between items-start mb-8">
                 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center text-xl font-bold backdrop-blur-md">
                   {topTraders[2]?.avatar}
                 </div>
                 <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#a8acb3] font-bold text-sm">#3</div>
               </div>
               
               <h3 className="text-xl font-bold mb-1">{topTraders[2]?.name}</h3>
               <div className="text-3xl font-mono font-bold text-[#10b981] mb-6 tracking-tight">{topTraders[2]?.roi}</div>
               
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#a8acb3] flex items-center gap-1.5"><TrendingUp size={14} /> PNL</span>
                   <span className="font-mono font-semibold">{topTraders[2]?.pnl}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#a8acb3] flex items-center gap-1.5"><Target size={14} /> Win Rate</span>
                   <span className="font-mono font-semibold">{topTraders[2]?.winRate}</span>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
        )}

        {/* LIST VIEW - Coinbase Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-[#16181c]/80 backdrop-blur-xl border border-[#273951]/50 shadow-[inset_0_0_80px_rgba(39,57,81,0.2)] shadow-2xl rounded-[32px] p-2 md:p-4 overflow-hidden"
        >
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="w-full text-left border-collapse min-w-[600px]">
              <div className="grid grid-cols-12 gap-4 text-[#a8acb3] text-sm border-b border-white/5 py-4 px-6">
                <div className="col-span-1 font-medium">Rank</div>
                <div className="col-span-5 font-medium">Trader</div>
                <div className="col-span-3 font-medium text-right">Profit (PNL)</div>
                <div className="col-span-2 font-medium text-right hidden sm:block">Win Rate</div>
                <div className="col-span-3 sm:col-span-1"></div>
              </div>
              <div className="divide-y divide-white/5">
                {otherTraders.map((trader, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}
                    key={trader.rank} className="grid grid-cols-12 gap-4 py-4 px-6 items-center hover:bg-white/5 transition-colors group"
                  >
                    <div className="col-span-1 text-[#a8acb3] font-bold font-mono">#{trader.rank}</div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#273951] flex items-center justify-center font-bold text-sm group-hover:bg-[#533afd] transition-colors">{trader.avatar}</div>
                      <span className="font-semibold text-white">{trader.name}</span>
                    </div>
                    <div className="col-span-3 text-right font-mono font-bold text-[#10b981]">{trader.pnl}</div>
                    <div className="col-span-2 text-right font-mono text-[#a8acb3] hidden sm:block">{trader.winRate}</div>
                    <div className="col-span-3 sm:col-span-1 text-right flex justify-end">
                      <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// Missing icon fallback for Crown in case it's not exported
function Crown(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.206A2 2 0 0 1 17.228 18H6.772a2 2 0 0 1-1.919-1.775L2.02 6.018a.5.5 0 0 1 .798-.518l4.276 3.664a1 1 0 0 0 1.516-.294z"/>
      <path d="M5 21h14"/>
    </svg>
  );
}

