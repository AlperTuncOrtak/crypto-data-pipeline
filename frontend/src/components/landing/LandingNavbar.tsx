import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { motion, useScroll, useTransform } from "framer-motion";

interface NavbarProps {
  partners: { name: string; img: string }[];
}

export default function LandingNavbar({ partners }: NavbarProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const bgOpacity = useTransform(scrollYProgress, [0, 0.06], [0, 1]);

  return (
    <>
      {/* Fixed Navbar */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4 flex items-center justify-between"
      >
        {/* Glass background appears on scroll */}
        <motion.div
          style={{ opacity: bgOpacity }}
          className="absolute inset-0 border-b border-white/[0.06] bg-[#020817]/70 backdrop-blur-xl pointer-events-none"
        />

        {/* Logo */}
        <Link to="/" className="relative flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[#020817] font-black text-sm shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            N
          </motion.div>
          <span className="text-lg font-bold text-white/90 group-hover:text-white tracking-tight transition-colors">
            CryptoNeko
          </span>
        </Link>

        {/* Nav links */}
        <nav className="relative hidden md:flex items-center gap-7">
          <Link to="/market" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Market
          </Link>
          <Link to="/pro" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Features
          </Link>
          <Link to="/pricing" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Plans
          </Link>
          <Link to="/dashboard" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Terminal
          </Link>
        </nav>

        {/* Auth CTA */}
        <div className="relative">
          {loading ? null : user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-full bg-cyan-400 text-[#020817] font-bold text-sm hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.25)] cursor-pointer"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.06] text-white font-bold text-sm hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </motion.header>

      {/* Marquee */}
      <div className="relative z-10 mt-[calc(100vh-4rem)] overflow-hidden py-7 border-y border-white/[0.05] bg-white/[0.01]">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#020817] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#020817] to-transparent z-10 pointer-events-none" />

        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-14 whitespace-nowrap"
          style={{ width: "max-content" }}
        >
          {[...partners, ...partners].map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 opacity-50 hover:opacity-90 transition-all duration-300 cursor-default group"
            >
              <img
                src={p.img}
                alt={p.name}
                className="w-8 h-8 rounded-full bg-white/5 p-1 object-contain"
              />
              <span
                className="text-xl font-black tracking-widest text-white uppercase"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {p.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
