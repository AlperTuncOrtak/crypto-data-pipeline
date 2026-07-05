import { motion } from "framer-motion";

const testimonials = [
  {
    body: "The Whale X-Ray feature alone paid for my entire year's subscription in one trade. Being able to see institutional wallets accumulating before a breakout is basically a cheat code.",
    author: {
      name: "Alex V.",
      handle: "@alexv_trades",
      role: "Prop Trader",
      imageUrl: "https://i.pravatar.cc/150?u=1",
    },
  },
  {
    body: "I've used every terminal from Bloomberg to TradingView. The execution speed and the AI Candlestick Vision on CryptoNeko are unmatched. It draws support/resistance better than most analysts.",
    author: {
      name: "Sarah M.",
      handle: "@sarah_eth",
      role: "Quant Analyst",
      imageUrl: "https://i.pravatar.cc/150?u=2",
    },
  },
  {
    body: "Time-Machine backtesting completely changed how I build strategies. Simulating bear markets in seconds rather than writing complex Python scripts saves me hundreds of hours.",
    author: {
      name: "David K.",
      handle: "@davidk_crypto",
      role: "Portfolio Manager",
      imageUrl: "https://i.pravatar.cc/150?u=3",
    },
  },
];

export function Testimonials() {
  return (
    <section className="relative z-10 px-6 lg:px-12 max-w-[1400px] mx-auto mb-32">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
          Trusted by the elite.
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          See what professional traders and quantitative analysts are saying about the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="rounded-[32px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-2xl p-8 shadow-[inset_0_0_80px_rgba(255,255,255,0.01)] flex flex-col justify-between hover:bg-white/[0.04] transition-colors"
          >
            <p className="text-slate-300 text-sm leading-relaxed mb-8 relative z-10 before:content-['“'] before:text-4xl before:text-cyan-500/20 before:absolute before:-top-4 before:-left-2">
              {testimonial.body}
            </p>
            <div className="flex items-center gap-4 mt-auto">
              <img
                className="h-12 w-12 rounded-full bg-white/[0.05] p-0.5 border border-white/10"
                src={testimonial.author.imageUrl}
                alt=""
              />
              <div>
                <div className="text-white font-bold text-sm">{testimonial.author.name}</div>
                <div className="text-slate-500 text-xs">{testimonial.author.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
