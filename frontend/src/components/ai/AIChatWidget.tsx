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
      display: 'flex', gap: 4, padding: '8px 12px',
      width: 'fit-content',
    }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <div key={i} style={{
          width: 4, height: 4,
          background: 'var(--text-muted)',
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
      marginBottom: 8,
    }}>
      <div style={{
        maxWidth: '90%',
        padding: isUser ? '10px 14px' : '4px 0',
        borderRadius: isUser ? 12 : 0,
        background: isError
          ? 'rgba(231,76,60,0.1)'
          : isUser
            ? 'rgba(255,255,255,0.05)'
            : 'transparent',
        border: isError
          ? '1px solid rgba(231,76,60,0.3)'
          : isUser
            ? '1px solid rgba(255,255,255,0.08)'
            : 'none',
        color: isError ? 'var(--negative)' : 'var(--text-primary)',
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
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
        .ai-fab { 
          box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1); 
        }
        .ai-fab:hover { 
          transform: scale(1.05) !important; 
          box-shadow: 0 8px 32px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2) !important; 
        }
        .ai-input::placeholder { color: var(--text-muted); }
        .ai-send:hover { background: rgba(255,255,255,0.1) !important; }
        .ai-send-active:hover { background: #fff !important; }
        .ai-quick:hover { color: var(--text-primary) !important; border-color: rgba(255,255,255,0.1) !important; background: rgba(255,255,255,0.08) !important; }
        .ai-clear:hover { color: var(--text-primary) !important; border-color: rgba(255,255,255,0.15) !important; }
        .ai-messages::-webkit-scrollbar { width: 3px; }
        .ai-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* ── FAB ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="ai-fab"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 52, height: 52, borderRadius: 26,
          background: 'rgba(20,20,25,0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <TerminalSquare size={20} color="#fff" />
      </button>

      {/* ── CHAT PANEL ── */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 380, height: 560,
          background: 'rgba(5, 5, 5, 0.85)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          boxShadow: '0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column',
          zIndex: 10000, overflow: 'hidden',
          animation: 'widgetSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>

          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TerminalSquare size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                  AI Copilot
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  [ ONLINE ]
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleClear}
                className="ai-clear"
                title="Clear conversation"
                style={{
                  background: 'transparent', border: '1px solid transparent',
                  width: 28, height: 28, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <RefreshCw size={12} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="ai-clear"
                style={{
                  background: 'transparent', border: '1px solid transparent',
                  width: 28, height: 28, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <X size={14} />
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
            <div style={{ padding: '0 20px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleSend(a.label)}
                  className="ai-quick"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--text-muted)', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <a.icon size={10} />
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '12px 20px 20px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            background: 'transparent',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: 0, padding: '0',
            }}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="ai-input"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#fff', fontSize: 13,
                  opacity: isLoading ? 0.5 : 1,
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className={inputValue.trim() && !isLoading ? 'ai-send-active' : 'ai-send'}
                style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: inputValue.trim() && !isLoading ? '#fff' : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: inputValue.trim() && !isLoading ? '#000' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
