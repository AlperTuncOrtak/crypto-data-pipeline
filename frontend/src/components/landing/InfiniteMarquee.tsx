import { motion } from "framer-motion";

const PARTNERS = [
  { name: "BINANCE", img: "/logos/binance.png" },
  { name: "COINBASE", img: "/logos/coinbase.png" },
  { name: "KRAKEN", img: "/logos/kraken.png" },
  { name: "OKX", img: "/logos/okx.png" },
  { name: "BYBIT", img: "/logos/bybit.png" },
  { name: "BITGET", img: "/logos/bitget.png" },
  { name: "KUCOIN", img: "/logos/kucoin.png" },
  { name: "METAMASK", img: "/logos/metamask.svg" },
  { name: "TRUST WALLET", img: "/logos/trustwallet.png" }
];

export function InfiniteMarquee() {
  return (
    <div className="w-full overflow-hidden mb-32 py-10 border-y border-white/[0.05] relative bg-white/[0.01]">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#020817] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#020817] to-transparent z-10 pointer-events-none"></div>
      
      <motion.div 
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="flex items-center gap-16 whitespace-nowrap"
        style={{ width: "max-content" }}
      >
        {[...PARTNERS, ...PARTNERS].map((partner, i) => {
          return (
            <div key={i} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-all duration-300 cursor-default hover:scale-105 group">
              <img 
                src={partner.img} 
                alt={partner.name} 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/[0.05] p-1 object-contain shadow-2xl grayscale group-hover:grayscale-0 transition-all" 
              />
              <span className="text-xl md:text-2xl font-black tracking-widest text-white uppercase opacity-70 group-hover:opacity-100">
                {partner.name}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
