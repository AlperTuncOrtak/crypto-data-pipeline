import { useState, useRef, useEffect } from 'react';
import { Brain, X, Send, Sparkles, TrendingUp, Activity, TerminalSquare } from 'lucide-react';

const QUICK_ACTIONS = [
  { id: 'analyze_btc', label: 'Analyze BTC', icon: TrendingUp },
  { id: 'market_sentiment', label: 'Market Sentiment', icon: Activity },
  { id: 'scan_anomalies', label: 'Scan Anomalies', icon: Sparkles },
];

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'System online. How can I assist with your trading strategy today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I'm analyzing the market for "${text}". Currently, the data suggests a strong consolidation phase. Do you want me to set up an alert for a breakout?` 
      }]);
    }, 1500);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: 'linear-gradient(135deg, var(--accent), #e8941a)',
          border: 'none',
          boxShadow: '0 8px 32px rgba(245,166,35,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <TerminalSquare size={24} color="#111" />
      </button>

      {/* Chat Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 360,
          height: 520,
          background: 'rgba(12, 12, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(245,166,35,0.25)',
          borderRadius: 20,
          boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
          display: isOpen ? 'flex' : 'none',
          flexDirection: 'column',
          zIndex: 10000,
          overflow: 'hidden',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(245,166,35,0.1) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Brain size={16} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                AI Copilot
              </div>
              <div style={{ fontSize: 11, color: '#2ecc71', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 6px #2ecc71' }} />
                Online
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 14,
                borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                borderBottomLeftRadius: m.role === 'assistant' ? 4 : 14,
                background: m.role === 'user' ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                border: m.role === 'user' ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                color: m.role === 'user' ? 'var(--accent)' : 'var(--text-primary)',
                fontSize: 13,
                lineHeight: 1.5,
                boxShadow: m.role === 'user' ? '0 4px 12px rgba(245,166,35,0.1)' : 'none'
              }}>
                {m.content}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, padding: '0 4px' }}>
                {m.role === 'assistant' ? 'AI' : 'You'}
              </span>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', gap: 4, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 14, width: 'fit-content' }}>
              <div className="typing-dot" style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
              <div className="typing-dot" style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
              <div className="typing-dot" style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && !isTyping && (
          <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map(a => (
              <button
                key={a.id}
                onClick={() => handleSend(a.label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 8,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <a.icon size={12} />
                {a.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-base)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '4px 4px 4px 14px'
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(inputValue)}
              placeholder="Ask anything..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: 13
              }}
            />
            <button
              onClick={() => handleSend(inputValue)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: inputValue.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
                border: 'none', cursor: inputValue.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: inputValue.trim() ? '#111' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
