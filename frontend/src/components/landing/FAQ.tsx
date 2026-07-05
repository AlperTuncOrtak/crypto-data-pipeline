import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Do I need programming knowledge to use the AI features?",
    answer: "No. Our Deep Learning models run entirely in the background. The AI Candlestick Vision and Narrative Maps are visual indicators that you can toggle on or off with a single click.",
  },
  {
    question: "How accurate is the Whale X-Ray data?",
    answer: "We query full archive nodes across Ethereum, Solana, and BSC with sub-second latency. The data you see is the exact state of the blockchain, parsed and tagged by our proprietary algorithms to identify institutional wallets.",
  },
  {
    question: "Can I cancel my PRO subscription at any time?",
    answer: "Yes. There are no lock-in contracts. You can cancel your subscription from the billing dashboard at any time, and you will retain PRO access until the end of your billing cycle.",
  },
  {
    question: "Does Time-Machine backtesting support all tokens?",
    answer: "Currently, Time-Machine supports backtesting for the top 500 tokens by market cap, with data going back up to 5 years (1-minute resolution). We are continuously adding more pairs.",
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative z-10 px-6 lg:px-12 max-w-4xl mx-auto mb-32">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
          Frequently asked questions
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl overflow-hidden transition-colors hover:bg-white/[0.04]"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <span className="text-base font-bold text-white">{faq.question}</span>
              <ChevronDown 
                className={`text-slate-400 transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""}`}
                size={20} 
              />
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-white/[0.02] pt-4">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
