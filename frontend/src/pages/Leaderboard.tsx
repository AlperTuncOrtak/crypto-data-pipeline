import React from "react";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-[#010102] text-[#f7f8f8] pt-32 pb-20 px-6 lg:px-12 flex flex-col items-center justify-center font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center max-w-lg"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#0f1011] border border-[#23252a] flex items-center justify-center mb-6">
          <Trophy size={28} className="text-[#5e6ad2]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-4 text-[#f7f8f8]">
          Leaderboard
        </h1>
        <p className="text-[#8a8f98] text-lg leading-relaxed mb-8">
          The competitive ranking system is currently under construction. Soon, you will be able to track the most profitable traders in the ecosystem and analyze their portfolios.
        </p>
        <div className="px-4 py-2 rounded-full bg-[#141516] border border-[#34343a] text-[#d0d6e0] text-sm font-medium uppercase tracking-widest">
          Coming Soon
        </div>
      </motion.div>
    </div>
  );
}
