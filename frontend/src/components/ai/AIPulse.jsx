import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AIPulse({ slug }) {
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isPro, isEnterprise } = useAuth();
  const navigate = useNavigate();
  const hasAccess = isPro || isEnterprise;

  useEffect(() => {
    if (!slug) return;
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    
    let isMounted = true;
    setLoading(true);

    fetch(`${BASE_URL}/ai/pulse/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.pulse) {
          setPulse(data.pulse);
        }
      })
      .catch(err => console.error("Pulse error:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [slug, hasAccess]);

  if (!slug) return null;

  return (
    <div className="glass-panel" style={{
      borderRadius: 16,
      padding: '16px 20px',
      marginBottom: 20,
      display: 'flex',
      gap: 16,
      alignItems: hasAccess ? 'flex-start' : 'center',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'var(--transition-smooth)'
    }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '4px', height: '100%',
        background: 'linear-gradient(to bottom, #f5a623, #e8941a)',
      }} />

      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'rgba(245,166,35,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: hasAccess ? 2 : 0,
      }}>
        <Sparkles size={16} color="var(--accent)" />
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: 'var(--accent)',
          letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          AI Pulse
          {loading && hasAccess && <Loader2 size={10} className="animate-spin" />}
        </div>
        
        {!hasAccess ? (
          <div style={{ position: 'relative' }}>
             <div style={{
                fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5,
                fontWeight: 500, filter: 'blur(4px)', opacity: 0.5, userSelect: 'none'
             }}>
                Bitcoin's current movement is driven by strong institutional accumulation and positive macroeconomic data. Resistance lies at the 72K zone.
             </div>
             <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start'
             }}>
                <button
                  onClick={() => navigate('/pricing')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', fontSize: 13, fontWeight: 600,
                    background: 'rgba(245,166,35,0.15)', color: 'var(--accent)',
                    border: '1px solid rgba(245,166,35,0.3)', borderRadius: 20,
                    cursor: 'pointer', backdropFilter: 'blur(2px)', transition: '0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(245,166,35,0.25)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(245,166,35,0.15)'}
                >
                  <Lock size={12} />
                  Unlock AI Pulse
                </button>
             </div>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, width: '90%', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, width: '60%', animation: 'pulse 1.5s infinite' }} />
          </div>
        ) : pulse ? (
          <div style={{
            fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5,
            fontWeight: 500,
          }}>
            {pulse}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            AI pulse is currently unavailable for this asset.
          </div>
        )}
      </div>
    </div>
  );
}

