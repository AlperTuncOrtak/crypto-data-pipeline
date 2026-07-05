import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function CryptoNetworkCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const rotate = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.15]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <div ref={ref} className="absolute inset-0 flex items-end justify-center overflow-hidden pointer-events-none">
      {/* Deep space starfield */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020817] via-[#050d1f] to-[#030a19]" />

      {/* Star particles */}
      {Array.from({ length: 80 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2.5 + 0.5,
            height: Math.random() * 2.5 + 0.5,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.6 + 0.1,
          }}
          animate={{ opacity: [0.1, 0.7, 0.1] }}
          transition={{
            duration: Math.random() * 4 + 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* The 3D Globe placeholder — scroll-reactive */}
      <motion.div
        style={{ rotate, scale, y }}
        className="relative w-[600px] h-[600px] md:w-[900px] md:h-[900px] lg:w-[1100px] lg:h-[1100px] mb-[-200px] md:mb-[-320px]"
      >
        {/* Outer atmospheric ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-[#0a1628] via-[#051240]/80 to-transparent opacity-70 blur-[2px]" />

        {/* Globe body */}
        <div
          className="absolute inset-[2%] rounded-full overflow-hidden shadow-[0_0_120px_rgba(0,100,255,0.15),inset_0_0_80px_rgba(0,50,150,0.3)]"
          style={{
            background:
              "radial-gradient(ellipse at 35% 30%, #1a3a6e 0%, #0a1f4a 30%, #030d20 65%, #010810 100%)",
          }}
        >
          {/* Continent blobs — purely decorative */}
          <div className="absolute top-[18%] left-[20%] w-[28%] h-[22%] rounded-[40%] bg-[#1c3a2a]/70 blur-[3px] rotate-[-15deg]" />
          <div className="absolute top-[30%] left-[8%] w-[18%] h-[28%] rounded-[45%] bg-[#1c3a2a]/60 blur-[3px] rotate-[10deg]" />
          <div className="absolute top-[22%] left-[55%] w-[30%] h-[25%] rounded-[38%] bg-[#1c3a2a]/65 blur-[3px] rotate-[-5deg]" />
          <div className="absolute top-[50%] left-[60%] w-[24%] h-[20%] rounded-[42%] bg-[#2a4a32]/55 blur-[3px] rotate-[12deg]" />
          <div className="absolute top-[60%] left-[25%] w-[20%] h-[15%] rounded-[50%] bg-[#1c3a2a]/50 blur-[4px]" />
          <div className="absolute top-[12%] left-[45%] w-[12%] h-[10%] rounded-[50%] bg-[#1c3a2a]/45 blur-[3px]" />

          {/* City lights on the dark side */}
          <div className="absolute bottom-[15%] right-[20%] w-[35%] h-[25%] opacity-50">
            {Array.from({ length: 25 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 rounded-full bg-amber-300"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.8 + 0.2,
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: Math.random() * 3 + 1,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Specular highlight */}
          <div
            className="absolute top-[5%] left-[15%] w-[30%] h-[20%] rounded-full opacity-20 blur-[20px]"
            style={{ background: "radial-gradient(ellipse, #6ba3ff, transparent)" }}
          />

          {/* Atmospheric limb */}
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-blue-500/10" />
        </div>

        {/* Atmospheric halo */}
        <div className="absolute inset-0 rounded-full border border-blue-400/10 shadow-[0_0_60px_rgba(59,130,246,0.1),0_0_200px_rgba(59,130,246,0.05)] blur-[0.5px]" />

        {/* Network grid overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06]"
          viewBox="0 0 100 100"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse
              key={`h${i}`}
              cx="50"
              cy="50"
              rx="49"
              ry={4 + i * 4}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.2"
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1="50"
              y1="1"
              x2="50"
              y2="99"
              stroke="#38bdf8"
              strokeWidth="0.2"
              transform={`rotate(${i * 15} 50 50)`}
            />
          ))}
        </svg>

        {/* Orbital ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-8%] rounded-full border border-cyan-500/10"
          style={{ transform: "rotateX(70deg)" }}
        />

        {/* Floating nodes on orbit */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-5%] rounded-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400/60 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400/60 shadow-[0_0_6px_rgba(129,140,248,0.8)]" />
        </motion.div>
      </motion.div>
    </div>
  );
}
