import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const IconX = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const IconGithub = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const FOOTER_LINKS = {
  Product: [
    { label: "Features", to: "/pro" },
    { label: "Pricing", to: "/pricing" },
    { label: "Changelog", href: "#" },
    { label: "Documentation", to: "/documentation" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
  ],
  Legal: [
    { label: "Privacy", to: "/privacy" },
    { label: "Terms", to: "/terms" },
  ],
};

export function LinearFooter({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] bg-[#09090b] pt-32 pb-12 overflow-hidden">

      {/* ── Background Layer ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Subtle repeating dot-grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Soft ambient radial glows */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">

        {/* CTA section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col items-center text-center mb-32 relative"
        >
          <h2 className="text-5xl md:text-[5rem] font-medium tracking-tight text-white mb-6 leading-[1.05]">
            The frontier awaits.
          </h2>
          <p className="text-white/50 text-[17px] md:text-[19px] mb-10 max-w-2xl leading-relaxed">
            Stop trading in the dark. Join elite algorithmic traders executing with machine-precision on the fastest terminal ever built.
          </p>
          <motion.button
            whileHover={{ scale: 1.03, y: -2, boxShadow: "0 0 36px rgba(99,102,241,0.45)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { if (onAuthOpen) onAuthOpen("login"); }}
            className="relative flex items-center justify-center gap-2.5 h-12 w-full sm:w-auto px-8 rounded-[12px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-[15px] transition-colors shadow-[0_4px_28px_rgba(99,102,241,0.32)] overflow-hidden"
          >
            <span className="relative z-10">Initialize Engine</span>
            <ArrowRight size={16} className="relative z-10" />
            <motion.div
              animate={{ x: ["-120%", "220%"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 4.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />
          </motion.button>
        </motion.div>

        {/* Footer nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14 border-t border-white/[0.04] pt-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[8px] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-[13px]">N</div>
              <span className="text-white font-bold tracking-tight text-[17px]">CryptoNeko</span>
            </Link>
            <p className="text-white/40 text-[14px] leading-relaxed max-w-[200px]">
              Algorithmic crypto analytics for the modern trader.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-semibold mb-5 text-[14px] tracking-wide">{section}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {"to" in link ? (
                      <Link to={link.to} className="text-white/40 hover:text-white text-[14px] transition-colors duration-200">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-white/40 hover:text-white text-[14px] transition-colors duration-200">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/[0.04] pt-8">
          <span className="text-white/30 text-[13px]">
            © {new Date().getFullYear()} CryptoNeko. All rights reserved.
          </span>
          <div className="flex items-center gap-5 text-white/40">
            <a href="#" className="hover:text-white transition-colors" aria-label="X (Twitter)">
              <IconX size={16} />
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="GitHub">
              <IconGithub size={16} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}