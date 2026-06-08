import React, { useState, useEffect, useRef } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Clock, AlertTriangle } from "lucide-react";

// Types
interface WhaleTrade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  value: number;
  isSell: boolean;
  timestamp: number;
}

const MIN_WHALE_VALUE = 50000; // $50k threshold
const MAX_TRADES = 1;

export default function WhaleTracker() {
  const [trades, setTrades] = useState<WhaleTrade[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: any;
    
    function connect() {
      setStatus("connecting");
      
      const streams = [
        "btcusdt@trade",
        "ethusdt@trade",
        "solusdt@trade",
        "bnbusdt@trade",
        "xrpusdt@trade",
        "dogeusdt@trade"
      ].join("/");

      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("live");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload.data) return;
          
          const d = payload.data;
          const price = parseFloat(d.p);
          const quantity = parseFloat(d.q);
          const value = price * quantity;

          if (value >= MIN_WHALE_VALUE) {
            const trade: WhaleTrade = {
              id: `${d.E}-${d.t || Math.random()}`,
              symbol: d.s.replace("USDT", ""),
              price,
              quantity,
              value,
              isSell: d.m, // If the buyer is the market maker, it means a sell order was executed.
              timestamp: d.E,
            };

            setTrades((prev) => {
              const newTrades = [trade, ...prev];
              if (newTrades.length > MAX_TRADES) {
                return newTrades.slice(0, MAX_TRADES);
              }
              return newTrades;
            });
          }
        } catch (err) {
          // Ignore parsing errors
        }
      };

      ws.onerror = () => {
        setStatus("error");
      };

      ws.onclose = () => {
        setStatus("error");
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Time formatter
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div
      style={{
        background: "rgba(10, 13, 20, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: 20,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 400
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "rgba(245, 166, 35, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)"
            }}
          >
            <Activity size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              Live Whale Tracker
              <span 
                style={{ 
                  fontSize: 10, 
                  padding: "2px 6px", 
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  fontWeight: 500
                }}
              >
                &gt; $50k
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Detecting large market orders
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: status === "live" ? "var(--positive)" : status === "connecting" ? "var(--accent)" : "var(--negative)" }}>
          {status === "live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--positive)", boxShadow: "0 0 8px var(--positive)", animation: "pulse 2s infinite" }} />}
          {status === "connecting" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "pulse 1s infinite" }} />}
          {status === "error" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--negative)" }} />}
          {status.toUpperCase()}
        </div>
      </div>

      <div 
        style={{ 
          flex: 1, 
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "20px"
        }}
      >
        {trades.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, color: "rgba(255,255,255,0.3)", gap: 12 }}>
            <Clock size={24} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: 13 }}>Waiting for whale activity...</span>
          </div>
        ) : (
          trades.map((trade) => {
            const isBuy = !trade.isSell;
            const color = isBuy ? "var(--positive)" : "var(--negative)";
            const bg = isBuy ? "var(--positive-soft)" : "var(--negative-soft)";
            const isMega = trade.value > 500000;

            return (
              <div
                key={trade.id}
                style={{
                  animation: "flashIn 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  background: isMega ? "rgba(245, 166, 35, 0.1)" : bg,
                  border: `1px solid ${isMega ? "rgba(245,166,35,0.4)" : "var(--border)"}`,
                  borderRadius: 24,
                  padding: "32px 20px",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: `0 8px 32px ${bg}`
                }}
              >
                {isMega && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "var(--accent)", boxShadow: "0 0 16px var(--accent)" }} />}
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2 }}>
                    {isBuy ? <ArrowUpRight size={16} color={color} /> : <ArrowDownRight size={16} color={color} />}
                    {isBuy ? "WHALE BUY DETECTED" : "WHALE SELL DETECTED"}
                    {isMega && <AlertTriangle size={14} color="var(--accent)" />}
                </div>

                <div style={{ fontSize: 48, fontWeight: 800, color: color, textShadow: `0 0 32px ${bg}`, lineHeight: 1 }}>
                    {formatValue(trade.value)}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{trade.symbol}</span>
                    <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>@</span>
                    <span style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                      ${trade.price.toLocaleString(undefined, {maximumFractionDigits: trade.price < 1 ? 4 : 2})}
                    </span>
                </div>

                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
                    {formatTime(trade.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes flashIn {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
            filter: brightness(2);
          }
          50% {
            transform: scale(1.02);
            filter: brightness(1.5);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: brightness(1);
          }
        }
      `}</style>
    </div>
  );
}
