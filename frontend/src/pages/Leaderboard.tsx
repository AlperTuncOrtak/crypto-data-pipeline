import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Target, Activity, ChevronRight, Award, Medal } from "lucide-react";

// ============================================================================
// MOCK DATA
// ============================================================================
const TOP_TRADERS = [
  { rank: 1, name: "0xWhale.eth", pnl: "+$450,230", roi: "+1,245%", winRate: "78%", avatar: "W", color: "from-[#533afd] to-[#f96bee]", shadow: "shadow-[0_0_40px_rgba(83,58,253,0.3)]" },
  { rank: 2, name: "AlgoSniper", pnl: "+$210,050", roi: "+854%", winRate: "82%", avatar: "A", color: "from-[#10b981] to-[#047857]", shadow: "shadow-[0_0_40px_rgba(16,185,129,0.2)]" },
  { rank: 3, name: "DeFiDegen", pnl: "+$124,500", roi: "+542%", winRate: "65%", avatar: "D", color: "from-[#f59e0b] to-[#b45309]", shadow: "shadow-[0_0_40px_rgba(245,158,11,0.2)]" },
];

const OTHER_TRADERS = [
  { rank: 4, name: "SushiMaster", pnl: "+$89,200", roi: "+410%", winRate: "71%", avatar: "S" },
  { rank: 5, name: "SolSurfer", pnl: "+$65,100", roi: "+380%", winRate: "68%", avatar: "S" },
  { rank: 6, name: "EthMaxi", pnl: "+$42,000", roi: "+250%", winRate: "62%", avatar: "E" },
  { rank: 7, name: "Liquidator", pnl: "+$38,500", roi: "+210%", winRate: "60%", avatar: "L" },
  { rank: 8, name: "ArbBot_v2", pnl: "+$31,200", roi: "+185%", winRate: "94%", avatar: "A" },
];

const springHover = {
  scale: 0.98,
  transition: { type: "spring", stiffness: 400, damping: 25 }
};

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("Weekly");

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
          {/* Rank 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={springHover}
            className={`relative rounded-[32px] p-1 md:order-1 ${TOP_TRADERS[1].shadow}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${TOP_TRADERS[1].color} opacity-40 rounded-[32px] blur-xl`}></div>
            <div className="relative bg-[#16181c] border border-white/10 rounded-[28px] p-6 h-full overflow-hidden">
               <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${TOP_TRADERS[1].color} opacity-10 blur-2xl rounded-full`}></div>
               
               <div className="flex justify-between items-start mb-8">
                 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center text-xl font-bold backdrop-blur-md">
                   {TOP_TRADERS[1].avatar}
                 </div>
                 <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#a8acb3] font-bold text-sm">#2</div>
               </div>
               
               <h3 className="text-xl font-bold mb-1">{TOP_TRADERS[1].name}</h3>
               <div className="text-3xl font-mono font-bold text-[#10b981] mb-6 tracking-tight">{TOP_TRADERS[1].roi}</div>
               
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#a8acb3] flex items-center gap-1.5"><TrendingUp size={14} /> PNL</span>
                   <span className="font-mono font-semibold">{TOP_TRADERS[1].pnl}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#a8acb3] flex items-center gap-1.5"><Target size={14} /> Win Rate</span>
                   <span className="font-mono font-semibold">{TOP_TRADERS[1].winRate}</span>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Rank 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={springHover}
            className={`relative rounded-[32px] p-1 md:order-2 md:-translate-y-8 ${TOP_TRADERS[0].shadow}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${TOP_TRADERS[0].color} opacity-60 rounded-[32px] blur-xl`}></div>
            <div className="relative bg-[#0a0b0d] border border-white/20 rounded-[28px] p-8 h-full overflow-hidden">
               <div className={`absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br ${TOP_TRADERS[0].color} opacity-20 blur-3xl rounded-full`}></div>
               
               <div className="flex justify-between items-start mb-8">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-md relative">
                   {TOP_TRADERS[0].avatar}
                   <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#f4b000] rounded-full border-2 border-[#0a0b0d] flex items-center justify-center">
                     <Crown size={12} className="text-black" />
                   </div>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f4b000]/20 to-transparent border border-[#f4b000]/30 flex items-center justify-center text-[#f4b000] font-bold text-base shadow-[0_0_15px_rgba(244,176,0,0.3)]">#1</div>
               </div>
               
               <h3 className="text-2xl font-bold mb-1 text-white">{TOP_TRADERS[0].name}</h3>
               <div className="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-8 tracking-tight">{TOP_TRADERS[0].roi}</div>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-2xl">
                   <span className="text-[#a8acb3] flex items-center gap-2"><TrendingUp size={16} /> Total Profit</span>
                   <span className="font-mono font-bold text-lg text-[#05b169]">{TOP_TRADERS[0].pnl}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-2xl">
                   <span className="text-[#a8acb3] flex items-center gap-2"><Target size={16} /> Win Rate</span>
                   <span className="font-mono font-bold text-lg">{TOP_TRADERS[0].winRate}</span>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Rank 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={springHover}
            className={`relative rounded-[32px] p-1 md:order-3 ${TOP_TRADERS[2].shadow}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${TOP_TRADERS[2].color} opacity-40 rounded-[32px] blur-xl`}></div>
            <div className="relative bg-[#16181c] border border-white/10 rounded-[28px] p-6 h-full overflow-hidden">
               <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${TOP_TRADERS[2].color} opacity-10 blur-2xl rounded-full`}></div>
               
               <div className="flex justify-between items-start mb-8">
                 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center text-xl font-bold backdrop-blur-md">
                   {TOP_TRADERS[2].avatar}
                 </div>
                 <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#a8acb3] font-bold text-sm">#3</div>
               </div>
               
               <h3 className="text-xl font-bold mb-1">{TOP_TRADERS[2].name}</h3>
               <div className="text-3xl font-mono font-bold text-[#10b981] mb-6 tracking-tight">{TOP_TRADERS[2].roi}</div>
               
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#a8acb3] flex items-center gap-1.5"><TrendingUp size={14} /> PNL</span>
                   <span className="font-mono font-semibold">{TOP_TRADERS[2].pnl}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#a8acb3] flex items-center gap-1.5"><Target size={14} /> Win Rate</span>
                   <span className="font-mono font-semibold">{TOP_TRADERS[2].winRate}</span>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>

        {/* LIST VIEW - Coinbase Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-[#16181c] border border-[#273951]/50 rounded-[32px] p-2 md:p-4 overflow-hidden"
        >
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[#a8acb3] text-sm border-b border-white/5">
                  <th className="py-5 px-6 font-medium">Rank</th>
                  <th className="py-5 px-6 font-medium">Trader</th>
                  <th className="py-5 px-6 font-medium text-right">Win Rate</th>
                  <th className="py-5 px-6 font-medium text-right">Profit (PNL)</th>
                  <th className="py-5 px-6 font-medium text-right">ROI</th>
                  <th className="py-5 px-6"></th>
                </tr>
              </thead>
              <tbody>
                {OTHER_TRADERS.map((trader, i) => (
                  <motion.tr 
                    key={trader.name}
                    whileHover={{ scale: 0.995, backgroundColor: "rgba(255,255,255,0.03)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="border-b border-white/[0.02] last:border-0 cursor-pointer group"
                  >
                    <td className="py-4 px-6 text-[#a8acb3] font-mono">{trader.rank}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#a8acb3]">
                          {trader.avatar}
                        </div>
                        <span className="font-semibold text-white group-hover:text-[#0052ff] transition-colors">{trader.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-medium">{trader.winRate}</td>
                    <td className="py-4 px-6 text-right font-mono text-[#05b169] font-medium">{trader.pnl}</td>
                    <td className="py-4 px-6 text-right font-mono text-white font-bold">{trader.roi}</td>
                    <td className="py-4 px-6 text-right">
                      <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#a8acb3] group-hover:bg-[#0052ff] group-hover:text-white transition-colors ml-auto">
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
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
