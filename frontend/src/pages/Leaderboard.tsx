import React from "react";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] pt-32 pb-20 px-6 lg:px-12 flex flex-col items-center justify-center font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center max-w-lg"
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-base)] flex items-center justify-center mb-6">
          <Trophy size={28} className="text-[var(--accent)]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-4 text-[var(--text-main)]">
          Leaderboard
        </h1>
        <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-8">
          The competitive ranking system is currently under construction. Soon, you will be able to track the most profitable traders in the ecosystem and analyze their portfolios.
        </p>
        <div className="px-4 py-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] text-sm font-medium uppercase tracking-widest">
          Coming Soon
        </div>
      </motion.div>
    </div>
  );
}
