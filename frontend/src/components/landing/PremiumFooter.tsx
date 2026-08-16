import { Link } from "react-router-dom";
import { Mail } from "lucide-react"; 

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

const IconDiscord = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
    <path d="M7.5 7.5c3.5 -1 5.5 -1 9 0" />
    <path d="M7 16.5c3.5 1 6.5 1 10 0" />
    <path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c.667 -1.667 .5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-1 2.5" />
    <path d="M8.5 17c0 1 -1.5 3 -2 3c-1.5 0 -2.833 -1.667 -3.5 -3c-.667 -1.667 -.5 -5.833 1.5 -11.5c1.457 -1.015 3 -1.34 4.5 -1.5l1 2.5" />
  </svg>
);

export function PremiumFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/[0.05] bg-[var(--bg-base)] pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 group mb-6 inline-flex">
              <div className="w-8 h-8 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[#000000] font-black text-lg shadow-[0_0_20px_var(--accent)] transition-transform group-hover:scale-110">
                C
              </div>
              <span className="text-xl font-bold tracking-tight text-white/90 group-hover:text-[var(--text-main)] transition-colors">
                CryptoNeko
              </span>
            </Link>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-sm mb-8">
              The ultimate AI-powered trading terminal. Institutional-grade analytics, real-time whale tracking, and algorithmic insights in one beautiful interface.
            </p>
            
            <form className="flex items-center gap-2 max-w-sm" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-white/[0.03] border border-[var(--border-base)] rounded-2xl px-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all"
              />
              <button 
                type="submit" 
                className="px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold text-sm rounded-2xl hover:bg-cyan-500/20 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Links - Product */}
          <div>
            <h3 className="text-[var(--text-main)] font-bold mb-6">Product</h3>
            <ul className="space-y-4">
              <li><Link to="/pro" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Pricing</Link></li>
              <li><a href="#" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Changelog</a></li>
              <li><a href="#" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">API Reference</a></li>
            </ul>
          </div>

          {/* Links - Company */}
          <div>
            <h3 className="text-[var(--text-main)] font-bold mb-6">Company</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">About Us</a></li>
              <li><a href="#" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Blog</a></li>
              <li><a href="#" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Careers <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Hiring</span></a></li>
              <li><a href="#" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Contact</a></li>
              <li><a href="#" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Partners</a></li>
            </ul>
          </div>

          {/* Links - Legal */}
          <div>
            <h3 className="text-[var(--text-main)] font-bold mb-6">Legal</h3>
            <ul className="space-y-4">
              <li><Link to="/privacy" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
              <li><a href="#" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="text-[var(--text-muted)] text-sm hover:text-cyan-400 transition-colors">Disclaimer</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             {/* Status Indicator */}
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-colors cursor-pointer">
               <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
               <span className="text-xs text-[var(--text-muted)] font-medium">All systems operational</span>
             </div>
          </div>
          
          <div className="text-[var(--text-muted)] text-sm">
            © {currentYear} CryptoNeko. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              <IconX size={18} />
            </a>
            <a href="#" className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              <IconGithub size={18} />
            </a>
            <a href="#" className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              <IconDiscord size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
