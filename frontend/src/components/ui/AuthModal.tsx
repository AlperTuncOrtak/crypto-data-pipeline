import { useState, useEffect, useRef } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import HCaptcha from "@hcaptcha/react-hcaptcha";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path
        d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z"
        fill="#FFC107"
      />
      <path
        d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 11.7z"
        fill="#FF3D00"
      />
      <path
        d="M24 45c5.5 0 10.5-1.9 14.4-5.1L31.6 34c-2.1 1.5-4.8 2.4-7.6 2.4-6.1 0-10.7-3.9-11.8-9.1l-7 5.4C8.1 40.7 15.5 45 24 45z"
        fill="#4CAF50"
      />
      <path
        d="M44.5 20H24v8.5h11.8c-.6 2.9-2.4 5.4-4.9 7l6.8 5.3C41.7 37 45 31 45 24c0-1.3-.2-2.7-.5-4z"
        fill="#1976D2"
      />
    </svg>
  );
}

function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#e74c3c" };
  if (score <= 2) return { score, label: "Fair", color: "#f39c12" };
  if (score <= 3) return { score, label: "Good", color: "var(--accent)" };
  if (score <= 4) return { score, label: "Strong", color: "#2ecc71" };
  return { score, label: "Very Strong", color: "#00d084" };
}

function PasswordStrength({ password }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: -4 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= score ? color : "var(--border)",
              transition: "background 0.25s",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function AuthInput({ icon: Icon, rightEl, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <Icon
        size={14}
        style={{
          position: "absolute",
          left: 15,
          top: "50%",
          transform: "translateY(-50%)",
          color: focused ? "var(--accent-border)" : "var(--text-muted)",
          pointerEvents: "none",
          transition: "color 0.2s",
        }}
      />
      <input
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={{
          width: "100%",
          padding: rightEl ? "13px 44px 13px 40px" : "13px 15px 13px 40px",
          background: focused
            ? "var(--accent-soft)"
            : "var(--border-soft)",
          border: `1px solid ${focused ? "var(--accent-border)" : "var(--border)"}`,
          borderRadius: 16,
          color: "var(--text-primary)",
          fontSize: 13,
          outline: "none",
          transition: "all 0.3s ease-out",
          boxSizing: "border-box",
          fontFamily: "Inter, sans-serif",
        }}
      />
      {rightEl}
    </div>
  );
}

const FAIL_LIMIT = 5;
const LOCKOUT_SEC = 30;

export default function AuthModal({ isOpen, onClose, onLogin, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [failCount, setFailCount] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const captchaRef = useRef(null);

  useEffect(() => {
    if (!lockUntil) return;
    const iv = setInterval(() => {
      const rem = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setCountdown(rem);
      if (rem === 0) {
        setLockUntil(null);
        setFailCount(0);
      }
    }, 500);
    return () => clearInterval(iv);
  }, [lockUntil]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);



  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function switchMode(m) {
    setMode(m);
    setError("");
    setSuccess("");
    setCaptchaToken(null);
    captchaRef.current?.resetCaptcha();
  }

  if (!isOpen) return null;
  const isLocked = lockUntil && Date.now() < lockUntil;

  async function handleGoogle(e) {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError(err.message || "Failed to initialize Google login");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (isLocked) return;
    if (!captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });
      if (error) {
        if (error.message && error.message.toLowerCase().includes("email not confirmed")) {
          setError("Please confirm your email address first. Check your inbox.");
          captchaRef.current?.resetCaptcha();
          setCaptchaToken(null);
          return;
        }
        
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          // Redirect to signup instead of incrementing failure counters
          switchMode("signup");
          setError("Account not found or invalid password. Please sign up.");
          return;
        }

        const next = failCount + 1;
        setFailCount(next);
        if (next >= FAIL_LIMIT) {
          setLockUntil(Date.now() + LOCKOUT_SEC * 1000);
          setError(`Too many failed attempts. Try again in ${LOCKOUT_SEC}s.`);
        } else {
          setError(`${error.message} (${FAIL_LIMIT - next} attempts left)`);
        }
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
        return;
      }
      setFailCount(0);
      onLogin?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }
    if (getStrength(password).score < 2) {
      setError("Password too weak. Add uppercase, numbers, or symbols.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { full_name: name }, 
          captchaToken,
          emailRedirectTo: window.location.origin + "/?verified=true"
        },
      });
      if (error) throw error;
      setSuccess("Account created! Check your email to verify.");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } catch (err) {
      setError(err.message);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://www.cryptoneko.online/reset-password",
      });
      if (error) throw error;
      switchMode("forgot_sent");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit =
    mode === "login"
      ? handleLogin
      : mode === "signup"
        ? handleSignup
        : handleForgot;

  const titles = {
    login: { title: "Welcome back 👋", sub: "Sign in to CryptoAnalytics" },
    signup: {
      title: "Create account ✨",
      sub: "Free forever. No credit card.",
    },
    forgot: { title: "Reset password 🔑", sub: "We'll send you a reset link" },
    forgot_sent: {
      title: "Check your email 📬",
      sub: `We sent a link to ${email}`,
    },
  };
  const { title, sub } = titles[mode];
  const submitLabel =
    mode === "login"
      ? "Sign In"
      : mode === "signup"
        ? "Create Account"
        : "Send Reset Link";
  const needsCaptcha = mode === "login" || mode === "signup";
  const submitDisabled = loading || isLocked || (needsCaptcha && !captchaToken);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          backgroundColor: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 1000,
          width: "100%",
          maxWidth: 440,
          padding: "0 16px",
          animation: "slideUp 0.28s cubic-bezier(0.34,1.26,0.64,1)",
        }}
      >
        <div
          style={{
            background: "rgba(2, 6, 23, 0.95)",
            backdropFilter: "blur(24px)",
            borderRadius: 24,
            border: "1px solid var(--border)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, var(--accent), transparent)",
            }}
          />

          <div style={{ padding: "32px 32px 28px" }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.03em",
                    marginBottom: 6,
                  }}
                >
                  {title}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {sub}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "var(--border)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 7,
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  flexShrink: 0,
                  marginTop: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--border)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--border)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <X size={14} />
              </button>
            </div>

            {mode === "forgot_sent" ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle
                  size={48}
                  style={{
                    color: "#2ecc71",
                    margin: "0 auto 16px",
                    display: "block",
                  }}
                />
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.7,
                    marginBottom: 24,
                  }}
                >
                  Click the link in your email to set a new password.
                  <br />
                  Check spam if you don't see it.
                </p>
                <button
                  onClick={() => switchMode("login")}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "10px 20px",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                {/* Google */}
                {(mode === "login" || mode === "signup") && (
                  <>
                    <button
                      type="button"
                      onClick={handleGoogle}
                      disabled={loading || isLocked}
                      style={{
                        width: "100%",
                        padding: "13px 18px",
                        background: "var(--border-soft)",
                        border: "1px solid var(--border)",
                        borderRadius: 16,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        color: "var(--text-secondary)",
                        fontSize: 14,
                        fontWeight: 500,
                        marginBottom: 20,
                        opacity: loading || isLocked ? 0.5 : 1,
                        transition: "all 0.18s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "var(--border)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "var(--border-soft)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      <GoogleIcon /> Continue with Google
                    </button>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 22,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          background: "var(--border)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        OR
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          background: "var(--border)",
                        }}
                      />
                    </div>
                  </>
                )}

                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {mode === "signup" && (
                    <AuthInput
                      icon={User}
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  )}

                  <AuthInput
                    icon={Mail}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  {mode !== "forgot" && (
                    <>
                      <AuthInput
                        icon={Lock}
                        type={showPass ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        rightEl={
                          <button
                            type="button"
                            onClick={() => setShowPass((p) => !p)}
                            style={{
                              position: "absolute",
                              right: 14,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              display: "flex",
                              padding: 2,
                              transition: "color 0.15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color =
                                "var(--text-secondary)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color =
                                "var(--text-muted)")
                            }
                          >
                            {showPass ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        }
                      />
                      {mode === "signup" && password && (
                        <PasswordStrength password={password} />
                      )}
                    </>
                  )}

                  {mode === "login" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 2,
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          style={{
                            accentColor: "var(--accent)",
                            width: 13,
                            height: 13,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                          }}
                        >
                          Remember me
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          color: "var(--accent-border)",
                          padding: 0,
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--accent)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--accent-border)")
                        }
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {needsCaptcha && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: 4,
                      }}
                    >
                      <HCaptcha
                        ref={captchaRef}
                        sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                        onVerify={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken(null)}
                        theme="dark"
                      />
                    </div>
                  )}

                  {isLocked && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "11px 14px",
                        borderRadius: 12,
                        background: "rgba(231,76,60,0.08)",
                        border: "1px solid rgba(231,76,60,0.2)",
                        color: "#e74c3c",
                        fontSize: 12,
                      }}
                    >
                      <ShieldCheck size={14} />
                      Too many attempts. Try again in{" "}
                      <strong>{countdown}s</strong>
                    </div>
                  )}

                  {error && !isLocked && (
                    <div
                      style={{
                        padding: "11px 15px",
                        borderRadius: 12,
                        fontSize: 13,
                        lineHeight: 1.5,
                        background: "rgba(255,69,96,0.07)",
                        border: "1px solid rgba(255,69,96,0.2)",
                        color: "#ff4560",
                      }}
                    >
                      {error}
                    </div>
                  )}
                  {success && (
                    <div
                      style={{
                        padding: "11px 15px",
                        borderRadius: 12,
                        fontSize: 13,
                        lineHeight: 1.5,
                        background: "rgba(0,208,132,0.07)",
                        border: "1px solid rgba(0,208,132,0.2)",
                        color: "#00d084",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <CheckCircle size={14} /> {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitDisabled}
                    style={{
                      width: "100%",
                      padding: "14px",
                      marginTop: 4,
                      borderRadius: 16,
                      border: "none",
                      background: submitDisabled
                        ? "var(--accent-soft)"
                        : "linear-gradient(135deg, var(--accent), #8B5CF6)",
                      color: "#111",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: submitDisabled ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: submitDisabled
                        ? "none"
                        : "0 4px 20px var(--accent-soft)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!submitDisabled) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = submitDisabled
                        ? "none"
                        : "0 4px 20px var(--accent-soft)";
                    }}
                  >
                    {loading ? (
                      <RefreshCw
                        size={14}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                    ) : (
                      <>
                        {submitLabel} <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: 20 }}>
                  {mode === "forgot" ? (
                    <button
                      onClick={() => switchMode("login")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                        color: "var(--text-muted)",
                      }}
                    >
                      ← Back to Sign In
                    </button>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--text-muted)",
                        }}
                      >
                        {mode === "login"
                          ? "Don't have an account? "
                          : "Already have an account? "}
                      </span>
                      <button
                        onClick={() =>
                          switchMode(mode === "login" ? "signup" : "login")
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--accent)",
                          fontSize: 13,
                          fontWeight: 600,
                          padding: 0,
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#ffb94a")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--accent)")
                        }
                      >
                        {mode === "login" ? "Sign Up" : "Sign In"}
                      </button>
                    </>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    marginTop: 18,
                  }}
                >
                  <ShieldCheck
                    size={11}
                    style={{ color: "var(--border)" }}
                  />
                  <span
                    style={{ fontSize: 11, color: "var(--border)" }}
                  >
                    Protected by hCaptcha · 256-bit encryption
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%,-48%) } to { opacity: 1; transform: translate(-50%,-50%) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        input::placeholder { color: var(--text-muted); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #0d0d0d inset !important; -webkit-text-fill-color: #fff !important; }
      `}</style>
    </>
  );
}
