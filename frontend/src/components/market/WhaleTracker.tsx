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

const MIN_WHALE_VALUE = 5000; // $5k threshold (lowered for immediate testing)
const MAX_TRADES = 5;

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
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: status === "live" ? "#2ecc71" : status === "connecting" ? "var(--accent)" : "#e74c3c" }}>
          {status === "live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 8px #2ecc71", animation: "pulse 2s infinite" }} />}
          {status === "connecting" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "pulse 1s infinite" }} />}
          {status === "error" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e74c3c" }} />}
          {status.toUpperCase()}
        </div>
      </div>

      <div style={{ padding: "10px 20px", display: "grid", gridTemplateColumns: "50px 1fr 1fr 60px", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.02)", fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        <div>Time</div>
        <div>Asset</div>
        <div style={{ textAlign: "right" }}>Value</div>
        <div style={{ textAlign: "right" }}>Price</div>
      </div>

      <div 
        style={{ 
          flex: 1, 
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "10px 16px"
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
            const color = isBuy ? "#2ecc71" : "#ff4560";
            const bg = isBuy ? "rgba(46, 204, 113, 0.08)" : "rgba(255, 69, 96, 0.08)";
            const isMega = trade.value > 500000;

            return (
              <div
                key={trade.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "50px 1fr 1fr 60px",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px",
                  borderRadius: 12,
                  background: isMega ? "rgba(245, 166, 35, 0.1)" : bg,
                  border: `1px solid ${isMega ? "rgba(245,166,35,0.3)" : "transparent"}`,
                  animation: "slideInRight 0.3s ease-out forwards",
                }}
              >
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {formatTime(trade.timestamp)}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div 
                    style={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: 6, 
                      background: color + "20",
                      color: color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {isBuy ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {trade.symbol}
                  </span>
                  {isMega && <AlertTriangle size={12} color="var(--accent)" style={{ marginLeft: -2 }} />}
                </div>

                <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: color }}>
                  {formatValue(trade.value)}
                </div>

                <div style={{ textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                  {trade.price.toLocaleString(undefined, { maximumFractionDigits: trade.price < 1 ? 4 : 2 })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
