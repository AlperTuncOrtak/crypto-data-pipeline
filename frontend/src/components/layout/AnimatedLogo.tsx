import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function AnimatedLogo() {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={() => navigate("/")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        marginRight: 32,
        flexShrink: 0,
        height: 50, // Fixed height to prevent layout shift
        width: 160, // Fixed width to prevent layout shift
        userSelect: "none"
      }}
    >
      {/* 
        Foreground: The Text Container
        It contains CRYPTO and NEKO, which slide apart.
      */}
      <div style={{ display: "flex", alignItems: "baseline", position: "relative" }}>
        
        {/* The Bar that the paws are holding onto */}
        <div style={{
          position: "absolute",
          bottom: -4,
          left: -15,
          right: -15,
          height: 2,
          background: "var(--border)",
          borderRadius: 2,
          zIndex: 1
        }} />

        {/* Left Part: "Crypto" and Left Paw */}
        <motion.div
          animate={{ x: isHovered ? -12 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2 }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--accent)" }}>
            Crypto
          </span>
          {/* Left Paw gripping the bar */}
          <div style={{ position: "absolute", bottom: -11, right: 10, width: 18, height: 12, zIndex: 3, pointerEvents: "none" }}>
            <img 
              src="/left-paw.png" 
              alt="Left Paw" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        </motion.div>

        {/* The Gap where the Cat Head appears */}
        <div style={{ position: "relative", width: 4, display: "flex", justifyContent: "center", zIndex: 0 }}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: isHovered ? -4 : 20, opacity: isHovered ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              position: "absolute",
              bottom: -4, // Relative to the gap baseline
              width: 44,
              height: 44,
              pointerEvents: "none",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <img 
              src="/cat-head.png" 
              alt="Cat Head" 
              style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </motion.div>
        </div>

        {/* Right Part: "Neko" and Right Paw */}
        <motion.div
          animate={{ x: isHovered ? 12 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2 }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
            Neko
          </span>
          {/* Right Paw gripping the bar */}
          <div style={{ position: "absolute", bottom: -11, left: 10, width: 18, height: 12, zIndex: 3, pointerEvents: "none" }}>
            <img 
              src="/right-paw.png" 
              alt="Right Paw" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        </motion.div>
      </div>

      {/* Subtitle "Analytics" positioned at the bottom, centered */}
      <motion.div
        animate={{ opacity: isHovered ? 0 : 1, y: isHovered ? 12 : 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          bottom: -8,
          fontSize: 8,
          color: "var(--text-muted)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          pointerEvents: "none",
          width: "100%",
          textAlign: "center"
        }}
      >
        Analytics
      </motion.div>
    </div>
  );
}
