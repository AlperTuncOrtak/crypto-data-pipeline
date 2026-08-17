import { useState, useEffect } from "react";
import { X, CheckCircle, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";

function getStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#EF4444" };
  if (score <= 2) return { score, label: "Fair", color: "#F59E0B" };
  if (score <= 3) return { score, label: "Good", color: "#eab308" };
  if (score <= 4) return { score, label: "Strong", color: "#10B981" };
  return { score, label: "Secure", color: "#10B981" };
}

function MatteInput({ icon: Icon, type, rightEl, ...props }: any) {
  return (
    <div className="relative group w-full">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors pointer-events-none"
        />
      )}
      <input
        type={type}
        {...props}
        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[#6366f1]/50 rounded-[12px] text-[14px] text-zinc-100 outline-none transition-all placeholder:text-zinc-600 font-sans"
        style={{ padding: `12px ${rightEl ? '44px' : '16px'} 12px ${Icon ? '44px' : '16px'}` }}
      />
      {rightEl}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107" />
      <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 11.7z" fill="#FF3D00" />
      <path d="M24 45c5.5 0 10.5-1.9 14.4-5.1L31.6 34c-2.1 1.5-4.8 2.4-7.6 2.4-6.1 0-10.7-3.9-11.8-9.1l-7 5.4C8.1 40.7 15.5 45 24 45z" fill="#4CAF50" />
      <path d="M44.5 20H24v8.5h11.8c-.6 2.9-2.4 5.4-4.9 7l6.8 5.3C41.7 37 45 31 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2" />
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose, onLogin, initialMode = "login" }: any) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  function switchMode(m: string) {
    setMode(m);
    setError("");
    setSuccess("");
  }

  if (!isOpen) return null;

  async function handleGoogle() {
    try {
      setLoading(true);
      setError("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setError("Invalid email or password.");
        } else {
          setError(error.message);
        }
        return;
      }
      onLogin?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (getStrength(password).score < 2) {
      setError("Please choose a stronger password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/?verified=true" },
      });
      if (error) throw error;
      setSuccess("Welcome! Check your email to verify your account.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = mode === "login" ? handleLogin : handleSignup;
  const isLogin = mode === "login";

  return (
    <>
      {/* Soft Glass Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 z-[999] bg-[var(--bg-base)]/80 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Premium Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] w-full max-w-[400px] px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-8 rounded-[24px] shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="mb-8 text-center mt-2">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-xl font-bold mx-auto mb-4 border border-[var(--accent)]/20">
              N
            </div>
            <h2 className="text-[20px] font-semibold text-white tracking-tight mb-1">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-[14px] text-zinc-400">
              {isLogin ? "Enter your details to access your dashboard" : "Join CryptoNeko to unlock pro features"}
            </p>
          </div>

          {/* Fast Login */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-[var(--border-subtle)] rounded-[12px] text-[14px] font-medium text-white transition-all mb-6 cursor-pointer"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">or email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {!isLogin && (
              <MatteInput icon={User} type="text" placeholder="Full Name" value={name} onChange={(e: any) => setName(e.target.value)} required />
            )}
            
            <MatteInput icon={Mail} type="email" placeholder="Email Address" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
            
            <div>
              <MatteInput 
                icon={Lock} 
                type={showPass ? "text" : "password"} 
                placeholder="Password" 
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)} 
                required 
                rightEl={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              {!isLogin && password && (
                <div className="flex items-center justify-between px-2 mt-2">
                  <div className="flex gap-1 flex-1 mr-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: i <= getStrength(password).score ? getStrength(password).color : "rgba(255,255,255,0.06)" }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: getStrength(password).color }}>
                    {getStrength(password).label}
                  </span>
                </div>
              )}
            </div>

            {error && <div className="text-[var(--negative)] text-[13px] px-1 py-1 mt-1 text-center">{error}</div>}
            {success && <div className="text-[var(--positive)] text-[13px] px-1 py-1 mt-1 text-center flex items-center justify-center gap-1"><CheckCircle size={14}/> {success}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[#4f46e5] text-white rounded-[12px] text-[14px] font-semibold transition-all disabled:opacity-50 mt-2 cursor-pointer shadow-md shadow-[var(--accent)]/20"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Switcher */}
          <div className="mt-6 text-center text-[13px] text-zinc-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => switchMode(isLogin ? "signup" : "login")}
              className="text-white hover:underline font-medium transition-colors cursor-pointer"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
