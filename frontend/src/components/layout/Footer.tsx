import React from 'react';

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

export default function Footer() {
  return (
    <footer style={{ 
      borderTop: '1px solid var(--border)', 
      marginTop: 'auto',
      padding: '40px 24px',
      backgroundColor: 'transparent',
      position: 'relative',
      zIndex: 10
    }}>
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Brand */}
        <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
           <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "linear-gradient(135deg,#f5a623,#e8941a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 900,
              color: "#111",
            }}
          >
            N
          </div>
          <span
            style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}
          >
            Crypto<span style={{ color: "#f5a623" }}>Neko</span>
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          <a href="/docs" className="hover:text-[#f5a623] transition-colors">Documentation</a>
          <a href="https://api.cryptoneko.online/docs" target="_blank" rel="noopener noreferrer" className="hover:text-[#f5a623] transition-colors">API</a>
          <a href="/terms" className="hover:text-[#f5a623] transition-colors">Terms of Service</a>
          <a href="/privacy" className="hover:text-[#f5a623] transition-colors">Privacy Policy</a>
        </div>

        {/* Socials & Copyright */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="flex items-center gap-5" style={{ color: 'var(--text-muted)' }}>
            <a href="#" title="X (Twitter)" className="hover:text-[#f5a623] transition-colors"><IconX size={18} /></a>
            <a href="#" title="Discord" className="hover:text-[#f5a623] transition-colors"><IconDiscord size={18} /></a>
            <a href="https://github.com/AlperTuncOrtak" target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:text-[#f5a623] transition-colors"><IconGithub size={18} /></a>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6 }}>
            © {new Date().getFullYear()} CryptoNeko. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
