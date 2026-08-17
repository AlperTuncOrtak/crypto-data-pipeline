import React from 'react';
import { Mail, MessageCircle, FileText, ExternalLink } from 'lucide-react';

export default function Support() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[var(--text-main)] mb-2">Help & Support</h1>
        <p className="text-[var(--text-muted)] text-sm">Need a hand? We've got you covered with guides and direct contact lines.</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="mailto:support@cryptoneko.com" className="group flex items-start gap-4 p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
            <Mail size={20} className="text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">Email Support</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Get in touch with our team directly. We typically reply within 24 hours.</p>
          </div>
        </a>
        <a href="https://docs.cryptoneko.com" target="_blank" rel="noreferrer" className="group flex items-start gap-4 p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
            <FileText size={20} className="text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-2">Documentation <ExternalLink size={12} /></h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Read our comprehensive guides on how to setup your portfolio and APIs.</p>
          </div>
        </a>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-4 mt-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            {
              q: "How do I add a new wallet without logging out?",
              a: "You can simply go to Settings, scroll down to the 'Account Management' section, and click 'Add New Account'. This allows you to link another wallet to your current session without disrupting your workflow."
            },
            {
              q: "How do the local Price Alerts work?",
              a: "Price alerts are managed entirely on your frontend device. When the web app is open, it continuously checks websocket streams and triggers a notification popup the moment a coin hits your threshold."
            },
            {
              q: "Is my portfolio data private?",
              a: "Yes. All manual entries are tied securely to your Supabase session. If you link a Web3 wallet, we only read public on-chain balances and cannot execute trades on your behalf."
            }
          ].map((faq, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <h4 className="font-bold text-sm text-[var(--text-main)] mb-2 flex items-center gap-2">
                <MessageCircle size={16} className="text-[var(--text-muted)]" />
                {faq.q}
              </h4>
              <p className="text-sm text-[var(--text-muted)] pl-6 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
