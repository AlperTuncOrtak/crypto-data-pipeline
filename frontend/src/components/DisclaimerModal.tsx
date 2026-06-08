// ============================================================
// frontend/src/components/DisclaimerModal.jsx
// ============================================================
// Legal disclaimer modal shown on first visit.
// User must explicitly accept to proceed.
// Also shows geo-specific warnings for UK/EU users.
// ============================================================

import { useState, useEffect } from "react";
import { AlertTriangle, Shield, X, ChevronDown, ChevronUp } from "lucide-react";

const STORAGE_KEY = "cryptoneko_disclaimer_accepted_v1";

// Tarayıcı diline göre bölge tahmini (gerçek IP tespiti değil)
function detectRegion() {
  const lang = navigator.language || "";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  if (
    lang.startsWith("en-GB") ||
    tz.includes("London") ||
    tz.includes("Europe/London")
  ) {
    return "UK";
  }
  if (
    tz.startsWith("Europe/") ||
    ["de", "fr", "it", "es", "nl", "pl", "pt", "sv", "da", "fi"].some((l) =>
      lang.startsWith(l),
    )
  ) {
    return "EU";
  }
  return "OTHER";
}

const REGION_WARNINGS = {
  UK: {
    flag: "🇬🇧",
    title: "UK Users — Important Notice",
    text: "CryptoNeko is not authorised by the Financial Conduct Authority (FCA). This platform provides technical analysis tools only and does not constitute a financial promotion or investment advice under the Financial Services and Markets Act 2000. Cryptoassets are high risk and largely unregulated in the UK. You are unlikely to be protected if something goes wrong. Please read the FCA's guidance at fca.org.uk/cryptoassets before using this tool.",
    color: "#e74c3c",
  },
  EU: {
    flag: "🇪🇺",
    title: "EU Users — Important Notice",
    text: "CryptoNeko is not licensed as a Crypto-Asset Service Provider (CASP) under MiCA (Markets in Crypto-Assets Regulation). This platform provides automated technical analysis only and does not constitute investment advice or portfolio management services. EU residents should be aware that crypto-asset investments carry significant risks and are subject to MiCA oversight.",
    color: "#8B5CF6",
  },
};

export default function DisclaimerModal({ onAccept }) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState(false);
  const [region, setRegion] = useState("OTHER");

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setVisible(true);
      setRegion(detectRegion());
    } else {
      onAccept?.();
    }
  }, []);

  function handleAccept() {
    if (!checked) return;
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setVisible(false);
    onAccept?.();
  }

  if (!visible) return null;

  const regionWarning = REGION_WARNINGS[region];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(12px)",
          overflow: "hidden",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "calc(100% - 32px)",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            backgroundColor: "#0f0f0f",
            border: "1px solid #2a2a2a",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 32px 100px rgba(0,0,0,0.9)",
          }}
        >
          {/* Top accent */}
          <div
            style={{
              height: 3,
              background: "linear-gradient(90deg, #e74c3c, var(--accent), #e74c3c)",
            }}
          />

          <div style={{ padding: "32px 32px 28px" }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  flexShrink: 0,
                  backgroundColor: "rgba(231,76,60,0.15)",
                  border: "1px solid rgba(231,76,60,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={22} style={{ color: "#e74c3c" }} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Important Disclaimer
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    margin: 0,
                    marginTop: 2,
                  }}
                >
                  Please read before using CryptoNeko AI Analysis
                </p>
              </div>
            </div>

            {/* Region-specific warning */}
            {regionWarning && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  marginBottom: 20,
                  backgroundColor: `${regionWarning.color}10`,
                  border: `1px solid ${regionWarning.color}30`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 16 }}>{regionWarning.flag}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: regionWarning.color,
                    }}
                  >
                    {regionWarning.title}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {regionWarning.text}
                </p>
              </div>
            )}

            {/* Main disclaimer */}
            <div
              style={{
                padding: "16px",
                borderRadius: 12,
                marginBottom: 20,
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle
                  size={14}
                  style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}
                />
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}
                >
                  Not Financial Advice
                </span>
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                CryptoNeko provides{" "}
                <strong>automated technical analysis tools only</strong>. All
                signals, scores, indicators, and AI-generated commentary are for
                <strong>
                  {" "}
                  informational and educational purposes only
                </strong>{" "}
                and do not constitute investment advice, financial advice,
                trading advice, or any other type of advice.
              </p>

              {/* Expandable full disclaimer */}
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: 11,
                  marginTop: 10,
                  padding: 0,
                }}
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? "Show less" : "Read full disclaimer"}
              </button>

              {expanded && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border-soft)",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    lineHeight: 1.7,
                  }}
                >
                  <p>
                    <strong style={{ color: "var(--text-secondary)" }}>
                      No guarantee of accuracy:
                    </strong>{" "}
                    Technical indicators, AI commentary, and signals may be
                    inaccurate, incomplete, or outdated. Past performance does
                    not guarantee future results.
                  </p>
                  <p style={{ marginTop: 8 }}>
                    <strong style={{ color: "var(--text-secondary)" }}>
                      High risk:
                    </strong>{" "}
                    Cryptocurrency investments are highly volatile and
                    speculative. You may lose all of your invested capital.
                    Never invest more than you can afford to lose.
                  </p>
                  <p style={{ marginTop: 8 }}>
                    <strong style={{ color: "var(--text-secondary)" }}>
                      No liability:
                    </strong>{" "}
                    CryptoNeko and its operators accept no liability for any
                    financial losses incurred as a result of using this platform
                    or acting on any information provided herein.
                  </p>
                  <p style={{ marginTop: 8 }}>
                    <strong style={{ color: "var(--text-secondary)" }}>
                      Do Your Own Research (DYOR):
                    </strong>{" "}
                    Always conduct your own research and consult a qualified,
                    licensed financial advisor before making any investment
                    decisions.
                  </p>
                  <p style={{ marginTop: 8 }}>
                    <strong style={{ color: "var(--text-secondary)" }}>
                      Regulatory status:
                    </strong>{" "}
                    CryptoNeko is not registered, licensed, or authorized as an
                    investment advisor, broker-dealer, or financial institution
                    in any jurisdiction.
                  </p>
                </div>
              )}
            </div>

            {/* Risk bullets */}
            <div style={{ marginBottom: 24 }}>
              {[
                "Crypto markets are highly volatile — prices can drop 50%+ rapidly",
                "AI signals are based on historical patterns and may not predict future moves",
                "Never make investment decisions based solely on this tool",
                "Past technical signals do not guarantee future performance",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: "#e74c3c",
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>

            {/* Checkbox */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                marginBottom: 20,
              }}
            >
              <div
                onClick={() => setChecked(!checked)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  flexShrink: 0,
                  marginTop: 1,
                  backgroundColor: checked
                    ? "var(--accent)"
                    : "var(--bg-elevated)",
                  border: `2px solid ${checked ? "var(--accent)" : "var(--border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  cursor: "pointer",
                }}
              >
                {checked && (
                  <span
                    style={{ color: "#111", fontSize: 12, fontWeight: 900 }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                I understand that CryptoNeko provides technical analysis tools
                only, not financial advice. I acknowledge the risks of
                cryptocurrency investing and agree to conduct my own research
                before making any investment decisions.
              </span>
            </label>

            {/* Accept button */}
            <button
              onClick={handleAccept}
              disabled={!checked}
              style={{
                width: "100%",
                padding: "14px",
                background: checked
                  ? "linear-gradient(135deg, var(--accent), #8B5CF6)"
                  : "var(--bg-elevated)",
                color: checked ? "#111" : "var(--text-muted)",
                border: "none",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 800,
                cursor: checked ? "pointer" : "not-allowed",
                boxShadow: checked ? "0 4px 24px rgba(245,166,35,0.4)" : "none",
                transition: "all 0.2s",
              }}
            >
              {checked
                ? "✓ I Understand — Continue to CryptoNeko"
                : "Please check the box above to continue"}
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: 10,
                color: "var(--text-muted)",
                marginTop: 12,
                opacity: 0.6,
              }}
            >
              This disclaimer is shown once. You can review it anytime in
              Settings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
