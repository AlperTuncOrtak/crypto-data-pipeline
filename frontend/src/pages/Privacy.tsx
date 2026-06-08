import React from 'react';
import { Lock } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12" style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-center gap-4 mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,158,11,0.05))',
          border: '1px solid rgba(245,166,35,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Last updated: May 30, 2026</p>
        </div>
      </div>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>1. Introduction</h2>
          <p>At CryptoNeko, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website and use our cryptocurrency tracking and analysis tools.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>2. Information We Collect</h2>
          <p className="mb-2">We collect the following types of information:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account Information:</strong> If you register, we collect your email address and authentication details.</li>
            <li><strong>Portfolio Data:</strong> Cryptocurrencies, quantities, and buy prices that you manually enter into your portfolio tracker.</li>
            <li><strong>Usage Data:</strong> Anonymous analytics data regarding how you navigate and interact with our tools to help us improve the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>3. How We Use Your Information</h2>
          <p>We use your information exclusively to provide and improve the CryptoNeko services. Your portfolio data is used to calculate your balances, profits, and losses. We do NOT sell, rent, or share your personal data or portfolio holdings with third-party advertisers or data brokers.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>4. AI Analysis & Data Processing</h2>
          <p>When you use the AI Technical Analysis feature, the market data (prices, indicators) is processed by AI models. Your personal portfolio data is not sent to external AI providers unless explicitly required for a feature you request (e.g., asking the AI Chatbot about your specific portfolio), and even then, it is strictly isolated per session.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>5. Cookies & Local Storage</h2>
          <p>We use standard local storage and strictly necessary cookies to keep you logged in, save your dark/light mode preferences, and remember your temporary watchlist choices. We do not use intrusive third-party tracking cookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>6. Contact Us</h2>
          <p>If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us via our official Discord community or GitHub repository.</p>
        </section>
      </div>
    </div>
  );
}
