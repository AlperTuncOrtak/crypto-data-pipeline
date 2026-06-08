import { useState, useRef, useEffect } from 'react';
import { Brain, X, Send, Sparkles, TrendingUp, Activity, TerminalSquare, RefreshCw, Zap } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const QUICK_ACTIONS = [
  { id: 'btc_outlook', label: 'BTC outlook?', icon: TrendingUp },
  { id: 'market_sentiment', label: 'Market sentiment', icon: Activity },
  { id: 'scan_anomalies', label: 'Volume anomalies', icon: Sparkles },
  { id: 'defi_trends', label: 'DeFi trends', icon: Zap },
];

function TypingDots() {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '12px 14px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 14, borderBottomLeftRadius: 4,
      width: 'fit-content',
    }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <div key={i} style={{
          width: 5, height: 5,
          background: 'var(--accent)',
          borderRadius: '50%',
          animation: `chatBounce 1.2s infinite ease-in-out both`,
          animationDelay: `${delay}s`,
        }} />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.isError;
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      animation: 'chatFadeIn 0.25s ease',
    }}>
      <div style={{
        maxWidth: '88%',
        padding: '10px 14px',
        borderRadius: 14,
        borderBottomRightRadius: isUser ? 4 : 14,
        borderBottomLeftRadius: isUser ? 14 : 4,
        background: isError
          ? 'rgba(176,38,255,0.1)'
          : isUser
            ? 'linear-gradient(135deg, rgba(245,166,35,0.18), rgba(245,166,35,0.08))'
            : 'var(--bg-elevated)',
        border: isError
          ? '1px solid rgba(176,38,255,0.3)'
          : isUser
            ? '1px solid rgba(245,166,35,0.3)'
            : '1px solid var(--border)',
        color: isError ? 'var(--negative)' : isUser ? 'var(--accent)' : 'var(--text-primary)',
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, padding: '0 4px' }}>
        {isUser ? 'You' : '✦ AI Copilot'}
      </span>
    </div>
  );
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'System online. I have access to live market data. Ask me anything about crypto markets, prices, or trends.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  // Konuşma geçmişini API formatına çevir (sistem mesajı hariç)
  const buildHistory = () =>
    messages
      .filter(m => !m.isError)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

  const handleSend = async (text) => {
    const msg = (text || inputValue).trim();
    if (!msg || isLoading) return;

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: buildHistory(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message || 'Could not reach AI backend. Is it running?'}`,
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      { role: 'assistant', content: 'Conversation cleared. How can I help you?' }
    ]);
  };

  const showQuickActions = messages.length === 1 && !isLoading;

  return (
    <>
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes widgetSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(245,166,35,0.4), inset 0 2px 0 rgba(255,255,255,0.2); }
          50%       { box-shadow: 0 8px 48px rgba(245,166,35,0.65), inset 0 2px 0 rgba(255,255,255,0.2); }
        }
        .ai-fab { animation: fabPulse 3s ease-in-out infinite; }
        .ai-fab:hover { transform: scale(1.1) !important; animation: none !important;
          box-shadow: 0 12px 40px rgba(245,166,35,0.6), inset 0 2px 0 rgba(255,255,255,0.25) !important; }
        .ai-input::placeholder { color: var(--text-muted); }
        .ai-send:hover { background: var(--accent-hover) !important; }
        .ai-quick:hover { color: var(--accent) !important; border-color: rgba(245,166,35,0.35) !important; background: rgba(245,166,35,0.06) !important; }
        .ai-clear:hover { color: var(--text-primary) !important; border-color: var(--border) !important; }
        .ai-messages::-webkit-scrollbar { width: 3px; }
        .ai-messages::-webkit-scrollbar-thumb { background: rgba(245,166,35,0.25); border-radius: 2px; }
      `}</style>

      {/* ── FAB ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="ai-fab"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: 28,
          background: 'linear-gradient(135deg, var(--accent), #8B5CF6)',
          border: 'none',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 9999,
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        <TerminalSquare size={24} color="#111" />
      </button>

      {/* ── CHAT PANEL ── */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 380, height: 560,
          background: 'rgba(10, 10, 20, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(245,166,35,0.22)',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
          display: 'flex', flexDirection: 'column',
          zIndex: 10000, overflow: 'hidden',
          animation: 'widgetSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(245,166,35,0.08) 0%, transparent 100%)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.06))',
                border: '1px solid rgba(245,166,35,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Brain size={17} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
                  AI Copilot
                </div>
                <div style={{ fontSize: 11, color: 'var(--positive)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--positive)', boxShadow: '0 0 6px var(--positive)' }} />
                  Live market data · Groq LLM
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleClear}
                className="ai-clear"
                title="Clear conversation"
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)',
                  width: 28, height: 28, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <RefreshCw size={12} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)',
                  width: 28, height: 28, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="ai-messages"
            style={{
              flex: 1, overflowY: 'auto', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {isLoading && <TypingDots />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {showQuickActions && (
            <div style={{ padding: '0 16px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleSend(a.label)}
                  className="ai-quick"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 8,
                    background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.07)',
                    color: 'var(--text-muted)', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <a.icon size={11} />
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '12px 16px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '6px 6px 6px 14px',
              transition: 'border-color 0.2s',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(245,166,35,0.35)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask anything about crypto..."
                disabled={isLoading}
                className="ai-input"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: 13,
                  opacity: isLoading ? 0.5 : 1,
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className="ai-send"
                style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: inputValue.trim() && !isLoading ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: inputValue.trim() && !isLoading ? '#111' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                <Send size={14} />
              </button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
              Powered by Groq · Not financial advice
            </div>
          </div>
        </div>
      )}
    </>
  );
}
