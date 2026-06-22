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
        Behind the text: Cat Head
        It peeks out from the bottom when hovered.
      */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: isHovered ? -12 : 20, opacity: isHovered ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          position: "absolute",
          top: "40%", // Adjust based on exactly where the head should pop up
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 40,
          height: 40,
          zIndex: 0, // Behind the text
          pointerEvents: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <img 
          src="/cat-head.png" 
          alt="Cat Head" 
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={(e) => {
            // Fallback if image doesn't exist yet
            e.currentTarget.style.display = "none";
          }}
        />
      </motion.div>

      {/* 
        Foreground: The Text Container
        It contains CRYPTO and NEKO, which slide apart.
      */}
      <div style={{ display: "flex", alignItems: "baseline", zIndex: 1 }}>
        {/* Left Part: "Crypto" and Left Paw */}
        <motion.div
          animate={{ x: isHovered ? -8 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--accent)" }}>
            Crypto
          </span>
          {/* Left Paw positioned slightly under the text */}
          <div style={{ position: "absolute", bottom: -12, right: 10, width: 24, height: 16, zIndex: 2, pointerEvents: "none" }}>
            <img 
              src="/left-paw.png" 
              alt="Left Paw" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
        </motion.div>

        {/* Right Part: "Neko" and Right Paw */}
        <motion.div
          animate={{ x: isHovered ? 8 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", marginLeft: 4 }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
            Neko
          </span>
          {/* Right Paw positioned slightly under the text */}
          <div style={{ position: "absolute", bottom: -12, left: 10, width: 24, height: 16, zIndex: 2, pointerEvents: "none" }}>
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
        animate={{ opacity: isHovered ? 0 : 1, y: isHovered ? 10 : 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          bottom: -4,
          fontSize: 8,
          color: "var(--text-muted)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          pointerEvents: "none"
        }}
      >
        Analytics
      </motion.div>
    </div>
  );
}
