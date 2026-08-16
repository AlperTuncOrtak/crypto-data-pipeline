import { useState } from "react";
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react";

export function QuickTradeWidget() {
  const [tab, setTab] = useState<"buy" | "sell" | "convert">("buy");

  return (
    <div className="flex flex-col w-full text-[var(--text-main)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 bg-[var(--bg-subtle)] p-1 rounded-full">
          <button 
            onClick={() => setTab("buy")}
            className={`px-4 py-1.5 rounded-full text-[14px] font-medium transition-colors ${tab === "buy" ? "bg-white text-black" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            Buy
          </button>
          <button 
            onClick={() => setTab("sell")}
            className={`px-4 py-1.5 rounded-full text-[14px] font-medium transition-colors ${tab === "sell" ? "bg-white text-black" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            Sell
          </button>
          <button 
            onClick={() => setTab("convert")}
            className={`px-4 py-1.5 rounded-full text-[14px] font-medium transition-colors ${tab === "convert" ? "bg-white text-black" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            Convert
          </button>
        </div>

        <button className="flex items-center gap-1 text-[14px] font-medium text-[var(--text-main)] hover:bg-[var(--border-subtle)] px-3 py-1.5 rounded-full transition-colors">
          Quick buy <ChevronDown size={16} />
        </button>
      </div>

      {/* Input Area */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline">
          <span className="text-[64px] font-medium tracking-tight text-[var(--text-muted)]">0</span>
          <span className="text-[64px] font-medium tracking-tight text-[var(--text-muted)] ml-2">TRY</span>
        </div>
        <button className="px-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[#202327] transition-colors rounded-full text-[14px] font-medium text-[var(--text-main)] border border-[var(--border-subtle)]">
          Max
        </button>
      </div>
      
      {/* Estimated value */}
      <div className="text-[14px] text-[var(--accent)] font-medium mb-8">
        ~ 0 BTC
      </div>

      {/* Order Details List */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Pay with */}
        <div className="flex items-center justify-between group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2775ca] flex items-center justify-center shrink-0">
              <span className="text-[var(--text-main)] text-[12px] font-bold">$</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] text-[var(--text-muted)]">Pay with</span>
              <span className="text-[16px] font-medium text-[var(--text-main)]">USDC</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[16px] font-medium text-[var(--text-main)]">TRY 0.57 <ChevronDown size={16} className="inline opacity-50" /></span>
             <span className="text-[13px] text-[var(--accent)] flex items-center gap-1">Available <div className="w-1.5 h-1.5 rounded-full bg-[#05b169]"></div></span>
          </div>
        </div>

        {/* Buy */}
        <div className="flex items-center justify-between group cursor-pointer mt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f7931a] flex items-center justify-center shrink-0">
              <span className="text-[var(--text-main)] text-[12px] font-bold">₿</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] text-[var(--text-muted)]">Buy</span>
              <span className="text-[16px] font-medium text-[var(--text-main)]">Bitcoin</span>
            </div>
          </div>
          <ChevronDown size={20} className="text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
        </div>
      </div>

      {/* Primary CTA */}
      <button className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-main)] rounded-full py-4 text-[16px] font-medium transition-colors mb-8 disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed">
        Review order
      </button>

      {/* Quick Links */}
      <div className="flex flex-col gap-6">
        <button className="flex items-center gap-3 text-[var(--text-main)] hover:text-[var(--text-muted)] transition-colors group">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <ArrowUp size={16} className="text-[var(--text-main)]" />
          </div>
          <span className="text-[16px] font-medium">Send crypto</span>
        </button>
        <button className="flex items-center gap-3 text-[var(--text-main)] hover:text-[var(--text-muted)] transition-colors group">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <ArrowDown size={16} className="text-[var(--text-main)]" />
          </div>
          <span className="text-[16px] font-medium">Receive crypto</span>
        </button>
      </div>

    </div>
  );
}
