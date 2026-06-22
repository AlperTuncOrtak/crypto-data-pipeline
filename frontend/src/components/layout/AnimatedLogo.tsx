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
        
        {/* The Bar / Ledge that the paws are holding onto */}
        <div style={{
          position: "absolute",
          bottom: -4,
          left: -20,
          right: -20,
          height: 4,
          background: "linear-gradient(90deg, transparent 0%, var(--border) 20%, var(--text-muted) 50%, var(--border) 80%, transparent 100%)",
          borderRadius: 4,
          boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
          zIndex: 2
        }} />

        {/* Left Part: "Crypto" and Left Paw */}
        <motion.div
          animate={{ x: isHovered ? -12 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 3 }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--accent)" }}>
            Crypto
          </span>
          {/* Left Paw gripping the bar */}
          <div style={{ position: "absolute", bottom: -11, right: 10, width: 18, height: 12, zIndex: 4, pointerEvents: "none" }}>
            <img 
              src="/left-paw.png" 
              alt="Left Paw" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        </motion.div>

        {/* The Gap where the Cat Head appears */}
        <div style={{ position: "relative", width: 4, display: "flex", justifyContent: "center", zIndex: 1 }}>
          {/* Mask container to hide the bottom of the cat exactly at the top of the bar */}
          <div style={{
            position: "absolute",
            bottom: 0, // 0 is exactly the top edge of the bar (which is at -4 with height 4)
            width: 60, // wide enough to not clip the sides of the head
            height: 50, // tall enough to not clip the top
            overflow: "hidden", // masks the bottom
            pointerEvents: "none",
            display: "flex",
            justifyContent: "center"
          }}>
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: isHovered ? 16 : 28, opacity: isHovered ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                position: "absolute",
                bottom: 0, // starts at the bottom of the mask
                width: 44,
                height: 44,
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
        </div>

        {/* Right Part: "Neko" and Right Paw */}
        <motion.div
          animate={{ x: isHovered ? 12 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 3 }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
            Neko
          </span>
          {/* Right Paw gripping the bar */}
          <div style={{ position: "absolute", bottom: -11, left: 10, width: 18, height: 12, zIndex: 4, pointerEvents: "none" }}>
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
