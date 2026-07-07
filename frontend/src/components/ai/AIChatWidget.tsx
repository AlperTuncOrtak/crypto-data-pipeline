import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Brain, X, Send, Sparkles, TrendingUp, Activity, Shield, FileDown, Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useVoice } from '../../hooks/useVoice';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function TypingDots() {
  return (
    <div className="flex gap-1.5 p-3 w-fit items-center bg-[#16181c] border border-[#273951]/50 rounded-2xl rounded-tl-none shadow-[inset_0_0_20px_rgba(39,57,81,0.2)]">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay }}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
        />
      ))}
    </div>
  );
}

function Message({ msg }: { msg: any }) {
  const isUser = msg.role === 'user';
  const isError = msg.isError;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex flex-col mb-4 ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div
        className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isError
            ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl rounded-tl-none'
            : isUser
            ? 'bg-white text-black rounded-2xl rounded-tr-none font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)]'
            : 'bg-[#16181c] border border-[#273951]/50 text-gray-200 rounded-2xl rounded-tl-none shadow-[inset_0_0_20px_rgba(39,57,81,0.2)]'
        }`}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

// Siri-like Audio Visualizer Component
function AudioVisualizer({ isSpeaking, isListening }: { isSpeaking: boolean, isListening: boolean }) {
  if (!isSpeaking && !isListening) return null;
  
  const barCount = 12;
  const color = isSpeaking ? "bg-blue-400" : "bg-purple-400";
  const glow = isSpeaking ? "shadow-[0_0_15px_rgba(96,165,250,0.6)]" : "shadow-[0_0_15px_rgba(168,85,247,0.6)]";
  const label = isListening ? "Listening..." : "Speaking...";

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-col items-center justify-center p-6 bg-[#0a0b0d]/50 rounded-2xl border border-white/5 mx-5 mb-4"
    >
      <div className="flex items-center gap-1.5 mb-3 h-10">
        {Array.from({ length: barCount }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              height: isSpeaking ? [8, Math.random() * 30 + 10, 8] : isListening ? [8, Math.random() * 20 + 8, 8] : 8
            }}
            transition={{ 
              duration: isSpeaking ? 0.4 : 0.8, 
              repeat: Infinity, 
              delay: i * 0.05 
            }}
            className={`w-1.5 rounded-full ${color} ${glow}`}
          />
        ))}
      </div>
      <div className="text-xs font-mono text-gray-400 uppercase tracking-widest animate-pulse">
        {label}
      </div>
    </motion.div>
  );
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'CryptoNeko AI online. I analyze live market data and on-chain metrics. How can I assist you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Voice Hook
  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking, isSupported } = useVoice((text) => {
    // When speech is recognized, set it to input and automatically send
    setInputValue(text);
    handleSend(text);
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isSpeaking, isListening]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      // Stop voice features when closing
      stopListening();
      stopSpeaking();
    }
  }, [isOpen]);

  const getContextActions = () => {
    const path = location.pathname;
    if (path.startsWith('/coin/')) {
      const coinSlug = path.split('/')[2].toUpperCase();
      return [
        { id: `analyze_${coinSlug}`, label: `Analyze ${coinSlug}`, icon: Activity },
        { id: `sentiment_${coinSlug}`, label: `Sentiment on ${coinSlug}?`, icon: Brain },
      ];
    } else if (path === '/portfolio') {
      return [
        { id: 'portfolio_risk', label: 'Assess my portfolio risk', icon: Shield },
        { id: 'tax_report', label: 'Generate tax summary', icon: FileDown },
      ];
    } else if (path === '/heatmap') {
      return [
        { id: 'market_movers', label: 'Who are the top movers?', icon: TrendingUp },
      ];
    }
    return [
      { id: 'btc_outlook', label: 'BTC outlook?', icon: TrendingUp },
      { id: 'market_sentiment', label: 'Market sentiment', icon: Activity },
      { id: 'scan_anomalies', label: 'Volume anomalies', icon: Sparkles },
    ];
  };

  const quickActions = getContextActions();

  const buildHistory = () =>
    messages
      .filter(m => !m.isError)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

  const handleSend = async (text: string) => {
    const msg = (text || inputValue).trim();
    if (!msg || isLoading) return;

    // Stop listening/speaking when sending a new message manually
    stopListening();
    stopSpeaking();

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
          context: { path: location.pathname }
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (!reader) throw new Error("No reader available");

      // Add an empty assistant message that will be populated via stream
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      setIsLoading(false); // Hide TypingDots since we are about to type characters

      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            if (dataStr === "[DONE]") break;
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.error) throw new Error(data.error);
              if (data.text) {
                fullText += data.text;
                // Append text to the last message
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content: fullText };
                  return newMsgs;
                });
              }
            } catch (e) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }

      // Speak the response if the user was using voice
      if (fullText) {
        speak(fullText);
      }

    } catch (err: any) {
      setMessages(prev => {
        // If the last message is the empty assistant message we created, update it
        const newMsgs = [...prev];
        if (newMsgs[newMsgs.length - 1].role === 'assistant' && !newMsgs[newMsgs.length - 1].content) {
          newMsgs[newMsgs.length - 1] = {
            role: 'assistant',
            content: 'I am unable to reach the AI servers at the moment. Please ensure the backend is running and reachable.',
            isError: true,
          };
          return newMsgs;
        }
        return [...prev, {
          role: 'assistant',
          content: 'I am unable to reach the AI servers at the moment. Please ensure the backend is running and reachable.',
          isError: true,
        }];
      });
      setIsLoading(false);
    }
  };


  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 md:bottom-6 right-6 w-14 h-14 bg-white text-black rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center z-[9999] hover:bg-gray-100 transition-colors"
          >
            <Brain size={24} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] max-w-[calc(100vw-48px)] max-h-[80vh] bg-[#0a0b0d]/90 backdrop-blur-3xl border border-[#273951]/50 rounded-[32px] shadow-[inset_0_0_80px_rgba(39,57,81,0.2),0_30px_60px_-12px_rgba(0,0,0,0.8)] z-[9999] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#273951]/30 bg-[#16181c]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg relative">
                  <Brain size={20} strokeWidth={2.5} />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#0a0b0d] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm">CryptoNeko AI</h3>
                  <div className="text-xs text-gray-400">Context-Aware Assistant</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 transition-colors"
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
              {messages.map((m, i) => (
                <Message key={i} msg={m} />
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <TypingDots />
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <AudioVisualizer isSpeaking={isSpeaking} isListening={isListening} />

            {messages.length === 1 && !isLoading && !isSpeaking && !isListening && (
              <div className="px-5 pb-2 flex flex-wrap gap-2">
                {quickActions.map(action => {
                  const Icon = action.icon as any;
                  return (
                    <motion.button
                      key={action.id}
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSend(action.label)}
                      className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-full border border-white/10 bg-white/5 text-gray-300 transition-colors"
                    >
                      {Icon && <Icon size={12} />}
                      {action.label}
                    </motion.button>
                  );
                })}
              </div>
            )}

            <div className="p-4 bg-[#16181c]/80 border-t border-[#273951]/30">
              <div className="flex items-center gap-2 bg-[#0a0b0d] border border-[#273951]/50 rounded-[20px] p-1.5 focus-within:border-white/30 transition-colors shadow-inner">
                
                {isSupported && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleVoice}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isListening 
                        ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                        : isSpeaking 
                        ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {isListening ? <Mic size={18} className="animate-pulse" /> : <Mic size={18} />}
                  </motion.button>
                )}

                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend('')}
                  placeholder={isListening ? "Listening..." : "Ask me anything..."}
                  disabled={isListening}
                  className="flex-1 bg-transparent text-sm text-white px-2 py-2 outline-none placeholder-gray-500 disabled:opacity-50"
                />
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend('')}
                  disabled={!inputValue.trim() || isLoading}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                    inputValue.trim() && !isLoading
                      ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >
                  <Send size={18} className={inputValue.trim() && !isLoading ? "ml-1" : ""} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
