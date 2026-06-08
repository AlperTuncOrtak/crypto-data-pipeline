import React from 'react';
import { Shield } from 'lucide-react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12" style={{ color: 'var(--text-primary)' }}>
      <div className="flex items-center gap-4 mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,158,11,0.05))',
          border: '1px solid rgba(245,166,35,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Last updated: May 30, 2026</p>
        </div>
      </div>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>1. Acceptance of Terms</h2>
          <p>By accessing and using CryptoNeko ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this Service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>2. Not Financial Advice</h2>
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', color: '#e74c3c' }}>
            <p className="font-bold mb-1">IMPORTANT DISCLAIMER</p>
            <p>CryptoNeko provides data analytics, AI-driven technical analysis, and portfolio tracking tools for informational purposes only. None of the information provided by the Service constitutes financial, investment, or trading advice.</p>
          </div>
          <p>Cryptocurrency markets are highly volatile. You are solely responsible for your own investment decisions. CryptoNeko and its creators shall not be held liable for any financial losses or damages incurred as a result of using our tools, AI analyses, or market data.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>3. API Usage & Limitations</h2>
          <p>We provide access to our public API for personal and educational use. You agree not to abuse the API by sending excessive requests that could degrade the performance of our servers. We reserve the right to rate-limit or permanently block IP addresses that exhibit malicious or disruptive behavior.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>4. User Accounts & Portfolios</h2>
          <p>If you create an account, you are responsible for maintaining the security of your login credentials. We take reasonable measures to protect your portfolio data, but we cannot guarantee absolute security. Do not store highly sensitive information (like private keys or seed phrases) on our platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>5. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. We do so by posting and drawing attention to the updated terms on the Site. Your decision to continue to visit and make use of the Site after such changes have been made constitutes your formal acceptance of the new Terms of Service.</p>
        </section>
      </div>
    </div>
  );
}
