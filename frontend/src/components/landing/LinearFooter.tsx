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
    <footer className="relative z-10 border-t border-[var(--border-subtle)] bg-[var(--bg-base)] pt-28 pb-12 overflow-hidden">

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">

        {/* CTA section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col items-center text-center mb-28 relative"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--text-main)] mb-6 leading-[1.08]">
            The frontier awaits.
          </h2>
          <p className="text-[var(--text-muted)] text-lg mb-10 max-w-xl">
            Stop trading in the dark. Join elite algorithmic traders executing with machine-precision on the fastest terminal ever built.
          </p>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { if (onAuthOpen) onAuthOpen("login"); }}
            className="group flex items-center justify-between gap-6 h-12 pl-5 pr-2 rounded-[12px] bg-[var(--text-main)] hover:bg-white text-[var(--bg-base)] font-bold text-[14px] transition-all duration-200 shadow-[0_0_24px_rgba(255,255,255,0.1)] w-full sm:w-auto"
          >
            <span>Initialize Engine</span>
            <div className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[var(--bg-base)] text-[var(--text-main)] opacity-90 group-hover:opacity-100 transition-opacity">
              <span className="text-[14px] leading-none mb-0.5">↵</span>
            </div>
          </motion.button>
        </motion.div>

        {/* Footer nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14 border-t border-[var(--border-subtle)] pt-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[8px] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-[11px]">N</div>
              <span className="text-[var(--text-main)] font-bold tracking-tight">CryptoNeko</span>
            </Link>
            <p className="text-[var(--text-faint)] text-[13px] leading-relaxed max-w-[180px]">
              Algorithmic crypto analytics for the modern trader.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-[var(--text-main)] font-semibold mb-4 text-[13px] tracking-wide">{section}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {"to" in link ? (
                      <Link to={link.to} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-[13px] transition-colors duration-150">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-[13px] transition-colors duration-150">
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-8">
          <span className="text-[var(--text-faint)] text-[13px]">
            © {new Date().getFullYear()} CryptoNeko. All rights reserved.
          </span>
          <div className="flex items-center gap-4 text-[var(--text-muted)]">
            <a href="#" className="hover:text-[var(--text-main)] transition-colors" aria-label="X (Twitter)">
              <IconX size={16} />
            </a>
            <a href="#" className="hover:text-[var(--text-main)] transition-colors" aria-label="GitHub">
              <IconGithub size={16} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
