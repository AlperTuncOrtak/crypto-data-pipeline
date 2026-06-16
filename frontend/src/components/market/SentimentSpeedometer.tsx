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
  const width = 240;
  const height = 120;
  const strokeWidth = 16;
  const r = width / 2 - strokeWidth;
  const cx = width / 2;
  const cy = height; // Bottom of the SVG
  
  const circumference = Math.PI * r;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // AI text
  const aiText = useMemo(() => getAiAnalysisText(score), [score]);

  // Color logic based on score
  const getScoreColor = (s: number) => {
    if (s <= 25) return '#ef4444'; // Minimal Red
    if (s <= 45) return '#f97316'; // Minimal Orange
    if (s <= 55) return '#eab308'; // Minimal Yellow
    if (s <= 75) return '#84cc16'; // Minimal Lime
    return '#22c55e'; // Minimal Green
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
        height: 260
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Activity size={24} color="var(--text-muted)" style={{ animation: 'spin 2s linear infinite' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 260
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 24 }}>
        <BrainCircuit size={16} color="var(--text-muted)" />
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Market Sentiment
        </h3>
      </div>

      <div style={{ position: 'relative', width, height, marginBottom: 20 }}>
        <svg width={width} height={height + strokeWidth} viewBox={`0 0 ${width} ${height + strokeWidth}`}>
          {/* Background Track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored Track with Animation */}
          <motion.path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>

        {/* Score Readout (Centered perfectly) */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          width: '100%'
        }}>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 800, 
            color: 'var(--text-primary)',
            lineHeight: 1,
            letterSpacing: '-0.02em'
          }}>
            {score}
          </div>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: currentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: 4
          }}>
            {classification}
          </div>
        </div>
      </div>

      {/* AI Analysis Text (Minimalist) */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: 13, 
        color: 'var(--text-secondary)', 
        lineHeight: 1.5,
        maxWidth: '90%'
      }}>
        {aiText}
      </div>
    </div>
  );
}
