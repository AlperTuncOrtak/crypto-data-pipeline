import React, { useState, useEffect, useCallback } from "react";
import MotoGame from "./MotoGame";
import { X, RotateCcw, Trophy } from "lucide-react";

interface MotoGameModalProps {
  onClose: () => void;
  chartData?: { time: string; price: number }[];
  symbol?: string;
}

export default function MotoGameModal({ onClose, chartData, symbol = "CHART" }: MotoGameModalProps) {
  const [distance, setDistance] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [restartTrigger, setRestartTrigger] = useState(0);

  // Derive price array from chartData
  const priceData: number[] = chartData && chartData.length > 0
    ? chartData.map(d => d.price)
    : [];

  // High score from localStorage
  const HS_KEY = `moto_hs_${symbol}`;
  const highScore = parseInt(localStorage.getItem(HS_KEY) || "0", 10);

  // Prevent body scroll while in game
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const handleDistanceUpdate = useCallback((dist: number) => {
    setDistance(dist);
  }, []);

  const handleGameOver = useCallback((dist: number) => {
    setFinalScore(dist);
    setIsGameOver(true);
  }, []);

  const handleRestart = useCallback(() => {
    setIsGameOver(false);
    setDistance(0);
    setFinalScore(0);
    setRestartTrigger(prev => prev + 1);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(2,6,23,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Full-screen game canvas */}
      <div style={{ position: "absolute", inset: 0 }}>
        <MotoGame
          priceData={priceData}
          symbol={symbol}
          onGameOver={handleGameOver}
          onDistanceUpdate={handleDistanceUpdate}
          restartTrigger={restartTrigger}
        />
      </div>

      {/* Close button — top right, always on top */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 100,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "50%",
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
      >
        <X size={20} />
      </button>

      {/* GAME OVER OVERLAY */}
      {isGameOver && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            animation: "fadeIn 0.35s ease-out forwards",
          }}
        >
          {/* Backdrop blur panel */}
          <div
            style={{
              background: "rgba(13,17,23,0.85)",
              border: "1px solid rgba(231,76,60,0.3)",
              borderRadius: 24,
              padding: "40px 56px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              boxShadow: "0 0 80px rgba(231,76,60,0.2), 0 0 0 1px rgba(231,76,60,0.1)",
              maxWidth: 420,
              width: "90%",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(48px, 8vw, 80px)",
                fontWeight: 900,
                color: "#e74c3c",
                textShadow: "0 0 40px rgba(231,76,60,0.7)",
                margin: 0,
                fontFamily: "monospace",
                letterSpacing: "0.05em",
              }}
            >
              CRASHED
            </h1>

            {/* Score block */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: "0.1em", marginBottom: 4 }}>
                DISTANCE
              </div>
              <div style={{ fontSize: 48, fontWeight: 900, color: "#00f0ff", fontFamily: "monospace", textShadow: "0 0 20px rgba(0,240,255,0.6)" }}>
                {finalScore}m
              </div>
            </div>

            {/* High score */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ffd700", fontFamily: "monospace", fontSize: 15 }}>
              <Trophy size={16} />
              <span>BEST: {Math.max(highScore, finalScore)}m</span>
              {finalScore > 0 && finalScore >= highScore && (
                <span style={{ color: "#ffd700", fontSize: 12, background: "rgba(255,215,0,0.15)", padding: "2px 8px", borderRadius: 6 }}>
                  🏆 NEW BEST!
                </span>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={handleRestart}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 28px",
                  borderRadius: 100,
                  background: "#00f0ff",
                  color: "#020617",
                  fontSize: 16,
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  boxShadow: "0 0 30px rgba(0,240,255,0.4)",
                  transition: "transform 0.1s ease, box-shadow 0.1s ease",
                }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.96)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <RotateCcw size={18} strokeWidth={3} />
                RESTART
              </button>

              <button
                onClick={onClose}
                style={{
                  padding: "14px 24px",
                  borderRadius: 100,
                  background: "transparent",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 16,
                  fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
              >
                EXIT
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.94); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
