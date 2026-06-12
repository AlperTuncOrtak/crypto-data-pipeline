// ============================================================
// components/ui/ProtectedRoute.jsx
// ============================================================
// Pro gerektiren sayfalar için route guard.
// Login değilse → AuthModal aç
// Login ama Free → Pricing sayfasına yönlendir
// Pro ise → içeriği göster
// ============================================================

import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Crown, Lock, ArrowRight, Zap } from "lucide-react";

export default function ProtectedRoute({
  children,
  requirePro = false,
  featureName = "this feature",
  onAuthOpen,
}) {
  const { isLoggedIn, isPro, isEnterprise, loading } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // loading bitince göster (flash önle)
    if (!loading) setTimeout(() => setShow(true), 50);
  }, [loading]);

  if (loading || !show)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );

  // Login gerektiriyor
  if (!isLoggedIn)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 20,
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,166,35,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock size={28} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Sign in to continue
          </h2>
          <p
            style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 340 }}
          >
            Create a free account to access {featureName}.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onAuthOpen}
            style={{
              padding: "11px 24px",
              borderRadius: 12,
              background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
              color: "#111",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "none",
            }}
          >
            Sign In <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );

  // Pro gerektiriyor ama free plan
  if (requirePro && !isPro && !isEnterprise)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 20,
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        {/* Blur preview arkada */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 900,
            overflow: "hidden",
            borderRadius: 16,
            maxHeight: 300,
          }}
        >
          <div
            style={{
              filter: "blur(6px)",
              opacity: 0.4,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {children}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, transparent 0%, var(--bg-base) 80%)",
            }}
          />
        </div>

        {/* Pro lock card */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(245,166,35,0.08), rgba(245,166,35,0.03))",
            border: "1px solid rgba(245,166,35,0.25)",
            borderRadius: 20,
            padding: "32px 40px",
            maxWidth: 480,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Crown size={24} color="#111" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Pro Feature
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            {featureName} is available on the Pro plan. Upgrade to unlock
            advanced analytics, AI signals, alerts, and more.
          </p>

          {/* Feature bullets */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 24,
              textAlign: "left",
            }}
          >
            {[
              "Portfolio tracker with unlimited trades",
              "Multi-exchange CSV import & FIFO tax report",
              "AI portfolio analysis (risk score, rebalance)",
              "Altfins AI signals (150+ indicators)",
              "Custom price & volume alerts",
              "Volume anomaly detection",
              "Unlimited watchlist",
            ].map((f) => (
              <div
                key={f}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <Zap
                  size={12}
                  style={{ color: "var(--accent)", flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {f}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/pricing")}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 12,
              background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
              color: "#111",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-1px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <Crown size={15} /> Upgrade to Pro
          </button>
          <div
            style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}
          >
            Starting at $10/month · Cancel anytime
          </div>
        </div>
      </div>
    );

  return children;
}
