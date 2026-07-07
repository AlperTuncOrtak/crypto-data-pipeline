import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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

export function LinearFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-[#000000] pt-32 pb-12 overflow-hidden">
      
      {/* Background Grid Pattern for CTA */}
      <div className="absolute inset-0 top-0 h-64 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwaGF0aCBkPSJNMCAuNWg0MG0tNDAgMzlINDIwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48cGF0aCBkPSJNLjUgMGgtdjQwbTM5LTQwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-50"></div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* Massive CTA */}
        <div className="flex flex-col items-center text-center mb-32">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
            Ready to trade smarter?
          </h2>
          <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl">
            Join elite traders who rely on CryptoNeko's intelligence layer to navigate the markets with precision.
          </p>
          <Link 
            to="/login"
            className="px-8 py-4 rounded-md bg-white text-[#000000] font-bold text-sm hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            Create free account <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Minimal Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 border-t border-white/5 pt-16">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center text-black font-bold text-[10px]">C</div>
              <span className="text-white font-bold tracking-tight">CryptoNeko</span>
            </Link>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/pro" className="text-slate-400 hover:text-white text-sm transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">About</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy</Link></li>
              <li><Link to="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 pt-8 text-slate-500 text-sm">
          <span>© {new Date().getFullYear()} CryptoNeko. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors"><IconX size={18} /></a>
            <a href="#" className="hover:text-white transition-colors"><IconGithub size={18} /></a>
          </div>
        </div>

      </div>
    </footer>
  );
}
