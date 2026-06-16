import React from 'react';
import { motion } from 'framer-motion';
import { useSentiment } from '../../hooks/useSentiment';
import { Brain } from 'lucide-react';

const T = {
  bg: "var(--bg-base)",
  card: "var(--bg-card)",
  border: "var(--border)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
};

export default function SentimentSpeedometer({ mockValue, mockClassification }: { mockValue?: number, mockClassification?: string }) {
  const { data, loading } = useSentiment();
  
  const score = mockValue ?? (data?.value ?? 50);
  const classification = mockClassification ?? (data?.classification ?? "Neutral");

  // Map 0-100 to angle: -90 to 90 degrees
  const angle = (score / 100) * 180 - 90;

  // Determine color based on score
  let color = "#f59e0b"; // Neutral
  if (score <= 25) color = "#ef4444"; // Extreme Fear
  else if (score <= 45) color = "#f97316"; // Fear
  else if (score <= 55) color = "#f59e0b"; // Neutral
  else if (score <= 75) color = "#84cc16"; // Greed
  else color = "#22c55e"; // Extreme Greed

  const aiCommentary = score <= 25 ? "Maximum Fear detected. Often precedes major accumulation phases." :
                       score <= 45 ? "Fearful Market. Cautious buying and scaling in recommended." :
                       score <= 55 ? "Neutral Market. Awaiting directional breakout and volume confirmation." :
                       score <= 75 ? "Greedy Market. Momentum is strong but taking partial profits is advised." :
                                     "Extreme Greed. High risk of immediate correction. Protect capital.";

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 24,
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow based on sentiment color */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 200,
        height: 200,
        background: color,
        filter: 'blur(100px)',
        opacity: 0.15,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, zIndex: 1 }}>
        <Brain size={20} color={color} />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.textPrimary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          AI Market Psychology
        </h3>
      </div>

      <div style={{ position: 'relative', width: 280, height: 160, zIndex: 1 }}>
        {/* SVG Gauge Background */}
        <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          {/* Background Track */}
          <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" strokeLinecap="round" />
          {/* Colored Track */}
          <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="url(#gauge-gradient)" strokeWidth="16" strokeLinecap="round" opacity="0.8" />
        </svg>

        {/* Animated Needle */}
        <motion.div
          initial={{ rotate: -90 }}
          animate={{ rotate: angle }}
          transition={{ type: "spring", damping: 20, stiffness: 60, delay: 0.2 }}
          style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            width: 4,
            height: 110,
            background: 'var(--text-primary)',
            transformOrigin: 'bottom center',
            borderRadius: 4,
            marginLeft: -2,
            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
          }}
        >
          {/* Needle Base Dot */}
          <div style={{
            position: 'absolute',
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--text-primary)',
            border: `4px solid ${T.card}`
          }} />
        </motion.div>

        {/* Score Display inside Gauge */}
        <div style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'monospace', color: color, lineHeight: 1 }}>
            {loading && !mockValue ? "--" : score}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
            {loading && !mockValue ? "Calculating..." : classification}
          </div>
        </div>
      </div>

      {/* AI Commentary Box */}
      <div style={{
        marginTop: 36,
        padding: '16px 20px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        width: '100%',
        textAlign: 'center',
        zIndex: 1
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 8 }}>
          NEKO AI VERDICT
        </div>
        <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5, fontWeight: 500 }}>
          {loading && !mockValue ? "Analyzing global market sentiment vectors..." : aiCommentary}
        </div>
      </div>
    </div>
  );
}
