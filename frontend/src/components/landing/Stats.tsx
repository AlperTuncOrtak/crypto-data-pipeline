import { motion } from "framer-motion";

const stats = [
  { id: 1, name: 'Volume Analyzed 24H', value: '$5.2B+' },
  { id: 2, name: 'Execution Latency', value: '<20ms' },
  { id: 3, name: 'Active Traders', value: '45,000+' },
  { id: 4, name: 'Supported Exchanges', value: '50+' },
];

export function Stats() {
  return (
    <section className="relative z-10 px-6 lg:px-12 max-w-[1400px] mx-auto mb-32">
      <div className="rounded-[32px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-2xl py-12 px-8 shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <motion.div 
              key={stat.id} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="flex flex-col items-center justify-center text-center group"
            >
              <dt className="text-sm font-semibold leading-6 text-[var(--text-muted)] uppercase tracking-widest group-hover:text-cyan-400 transition-colors duration-300">
                {stat.name}
              </dt>
              <dd className="order-first text-4xl md:text-5xl font-black tracking-tighter text-[var(--text-main)] mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                {stat.value}
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}
