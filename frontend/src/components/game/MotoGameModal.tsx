import React, { useState, useEffect } from "react";
import MotoGame from "./MotoGame";
import { X, RotateCcw } from "lucide-react";

interface MotoGameModalProps {
  onClose: () => void;
}

export default function MotoGameModal({ onClose }: MotoGameModalProps) {
  const [score, setScore] = useState(0);
  const [time, setTime] = useState("0:00.0");
  const [isGameOver, setIsGameOver] = useState(false);
  const [restartTrigger, setRestartTrigger] = useState(0);

  // Prevent scrolling on the main body while playing
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleScoreUpdate = (dist: number, timeStr: string) => {
    setScore(dist);
    setTime(timeStr);
  };

  const handleGameOver = () => {
    setIsGameOver(true);
  };

  const handleRestart = () => {
    setIsGameOver(false);
    setScore(0);
    setTime("0:00.0");
    setRestartTrigger(prev => prev + 1);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(2, 6, 23, 0.85)", // T.bg with opacity
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* TOP HUD */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            padding: "24px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {/* Left HUD: Distance & Instructions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                fontFamily: "monospace",
                color: "#00f0ff",
                textShadow: "0 0 10px rgba(0,240,255,0.5)",
              }}
            >
              {score} m
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              W/S: Drive | A/D: Tilt
            </div>
          </div>

          {/* Center HUD: Timer */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 32,
              fontWeight: 700,
              fontFamily: "monospace",
              color: "#fff",
              letterSpacing: "0.1em",
            }}
          >
            {time}
          </div>

          {/* Right HUD: Close button */}
          <button
            onClick={onClose}
            style={{
              pointerEvents: "auto",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* THE GAME CANVAS */}
        <MotoGame
          onScoreUpdate={handleScoreUpdate}
          onGameOver={handleGameOver}
          isPaused={isGameOver}
          restartTrigger={restartTrigger}
          onRestart={handleRestart}
        />

        {/* GAME OVER OVERLAY */}
        {isGameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(231, 76, 60, 0.15)",
              backdropFilter: "blur(4px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
              animation: "fadeIn 0.3s ease-out forwards",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(48px, 8vw, 96px)",
                fontWeight: 900,
                color: "#e74c3c",
                textShadow: "0 0 40px rgba(231,76,60,0.6)",
                margin: 0,
                letterSpacing: "0.05em",
              }}
            >
              CRASHED
            </h1>
            <p style={{ color: "#fff", fontSize: 20, marginTop: 16, marginBottom: 40, fontFamily: "monospace" }}>
              Distance: <span style={{ color: "#00f0ff", fontWeight: 700 }}>{score}m</span>
            </p>

            <button
              onClick={handleRestart}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 32px",
                borderRadius: 100,
                background: "#00f0ff",
                color: "#020617",
                fontSize: 18,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 0 30px rgba(0,240,255,0.4)",
                transition: "transform 0.1s ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <RotateCcw size={20} strokeWidth={3} />
              RESTART
            </button>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}
