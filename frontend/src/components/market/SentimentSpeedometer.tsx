import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useFearAndGreed, getAiAnalysisText } from '../../hooks/useFearAndGreed';
import { Activity, BrainCircuit } from 'lucide-react';

export default function SentimentSpeedometer() {
  const { t } = useTranslation();
  const { data, loading, error } = useFearAndGreed();

  const score = data ? parseInt(data.value, 10) : 50;
  const classification = data ? data.value_classification : 'Neutral';
  
  // Math for SVG half-circle
  const width = 300;
  const height = 160;
  const cx = width / 2;
  const cy = height - 20;
  const r = 120;
  
  const circumference = Math.PI * r;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Calculate needle rotation: -90 (0 score) to 90 (100 score)
  const needleRotation = -90 + (score / 100) * 180;

  // AI text
  const aiText = useMemo(() => getAiAnalysisText(score), [score]);

  // Color logic based on score
  const getScoreColor = (s: number) => {
    if (s <= 25) return '#ff3333'; // Red
    if (s <= 45) return '#ff9933'; // Orange
    if (s <= 55) return '#f5d300'; // Yellow
    if (s <= 75) return '#99ff33'; // Light Green
    return '#00ff66'; // Neon Green
  };

  const currentColor = getScoreColor(score);

  if (loading) {
    return (
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Activity size={24} color="var(--text-muted)" style={{ animation: 'spin 2s linear infinite' }} />
          <span style={{ color: 'var(--text-muted)' }}>Loading AI Sentiment...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show if API fails
  }

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '24px 24px 32px 24px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Background glow effect based on current score color */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 200,
        height: 200,
        background: currentColor,
        filter: 'blur(100px)',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 20, zIndex: 1 }}>
        <BrainCircuit size={18} color="var(--accent)" />
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          AI Market Sentiment
        </h3>
        <div style={{
          marginLeft: 8,
          fontSize: 10,
          fontWeight: 800,
          background: 'rgba(0, 240, 255, 0.1)',
          color: 'var(--accent)',
          padding: '2px 8px',
          borderRadius: 12,
          letterSpacing: '0.1em'
        }}>LIVE</div>
      </div>

      <div style={{ position: 'relative', width, height, zIndex: 1 }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff3333" />
              <stop offset="25%" stopColor="#ff9933" />
              <stop offset="50%" stopColor="#f5d300" />
              <stop offset="75%" stopColor="#99ff33" />
              <stop offset="100%" stopColor="#00ff66" />
            </linearGradient>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <mask id="gaugeMask">
              <motion.path
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="24"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </mask>
          </defs>

          {/* Tick Labels */}
          <text x={cx - r - 16} y={cy + 4} fill="var(--text-muted)" fontSize="10" fontWeight="700" textAnchor="end">0</text>
          <text x={cx + r + 16} y={cy + 4} fill="var(--text-muted)" fontSize="10" fontWeight="700" textAnchor="start">100</text>
          <text x={cx} y={cy - r - 16} fill="var(--text-muted)" fontSize="10" fontWeight="700" textAnchor="middle">50</text>

          {/* Background Segmented Track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="var(--border)"
            strokeWidth="16"
            strokeDasharray="4 6"
          />

          {/* Colored Segmented Track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="url(#speedGradient)"
            strokeWidth="16"
            strokeDasharray="4 6"
            mask="url(#gaugeMask)"
            filter="url(#glow)"
          />

          {/* Sleek SVG Needle */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: needleRotation }}
            transition={{ duration: 1.5, ease: "easeOut", type: 'spring', damping: 15 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            {/* Needle Body */}
            <polygon 
              points={`${cx - 5},${cy} ${cx + 5},${cy} ${cx},${cy - r + 10}`} 
              fill="var(--text-primary)" 
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' }}
            />
            {/* Glowing Tip */}
            <circle cx={cx} cy={cy - r + 10} r="3" fill="#fff" style={{ filter: `drop-shadow(0 0 8px ${currentColor})` }} />
          </motion.g>

          {/* Center Pin */}
          <circle cx={cx} cy={cy} r="10" fill="var(--bg-surface)" stroke="var(--text-primary)" strokeWidth="4" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
        </svg>

        {/* Score Readout */}
        <div style={{
          position: 'absolute',
          bottom: height - cy + 24, // push down slightly below the pin
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 900, 
            fontFamily: 'monospace',
            color: currentColor,
            textShadow: `0 0 24px ${currentColor}88`,
            lineHeight: 1,
            letterSpacing: '-0.05em'
          }}>
            {score}
          </div>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 800, 
            letterSpacing: '0.15em',
            color: currentColor,
            textTransform: 'uppercase',
            marginTop: 6,
            background: 'rgba(0,0,0,0.4)',
            padding: '4px 12px',
            borderRadius: 12,
            border: `1px solid ${currentColor}44`
          }}>
            {classification}
          </div>
        </div>
      </div>

      {/* AI Analysis Text Box */}
      <div style={{
        marginTop: 40,
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-soft)',
        borderRadius: 12,
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          AI Assessment
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
          {aiText}
        </div>
      </div>
    </div>
  );
}
