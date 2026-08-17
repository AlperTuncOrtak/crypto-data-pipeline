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
      className="relative flex items-center justify-start cursor-pointer select-none h-10 w-[150px]"
    >
      <div className="flex items-baseline relative">
        {/* The Bar / Ledge that the paws are holding onto */}
        <div className="absolute bottom-[-2px] left-[-10px] right-[-10px] h-[2px] bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent rounded-full z-10" />

        {/* Left Part: "Crypto" and Left Paw */}
        <motion.div
          animate={{ x: isHovered ? -8 : 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="flex flex-col items-center relative z-20"
        >
          <span className="text-[16px] font-extrabold tracking-tight text-white leading-none">
            Crypto
          </span>
          {/* Left Paw */}
          <motion.div 
            animate={{ x: isHovered ? 4 : 0, rotate: -5 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute bottom-[-6px] right-[4px] w-[14px] h-[10px] z-30 pointer-events-none"
          >
            <img 
              src="/left-paw.png" 
              alt="" 
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </motion.div>
        </motion.div>

        {/* The Gap where the Cat Head appears */}
        <div className="relative w-[2px] flex justify-center z-0">
          <div className="absolute bottom-[-1px] w-[40px] h-[34px] overflow-hidden pointer-events-none flex justify-center ml-[6px]">
            <motion.div
              initial={{ y: 22, opacity: 0 }}
              animate={{ 
                y: isHovered ? 10 : 22, 
                opacity: isHovered ? 1 : 0 
              }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="absolute bottom-0 w-8 h-8 flex items-center justify-center"
            >
              <img 
                src="/cat-head.png" 
                alt="" 
                className="w-full h-full object-contain object-bottom grayscale brightness-[1.5]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </motion.div>
          </div>

          {/* Subtitle "Analytics" */}
          <motion.div
            animate={{ opacity: isHovered ? 0 : 1, y: isHovered ? 8 : 0 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[-16px] text-[7px] text-[var(--text-muted)] tracking-[0.15em] uppercase pointer-events-none whitespace-nowrap z-10"
          >
            Analytics
          </motion.div>
        </div>

        {/* Right Part: "Neko" and Right Paw */}
        <motion.div
          animate={{ x: isHovered ? 8 : 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="flex flex-col items-center relative z-20 ml-2"
        >
          <span className="text-[16px] font-extrabold tracking-tight text-[var(--text-primary)] leading-none">
            Neko
          </span>
          {/* Right Paw */}
          <motion.div 
            animate={{ x: isHovered ? -4 : 0, rotate: 5 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute bottom-[-6px] left-[4px] w-[14px] h-[10px] z-30 pointer-events-none"
          >
            <img 
              src="/right-paw.png" 
              alt="" 
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
