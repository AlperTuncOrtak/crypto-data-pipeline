import { useState, useEffect } from "react";
import { X, CheckCircle, Mail, Lock, User, Eye, EyeOff, LogIn } from "lucide-react";
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
        className="w-full bg-white/[0.02] border border-white/[0.04] focus:border-[var(--accent)] focus:bg-white/[0.04] rounded-xl text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 font-sans"
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
      <div 
        onClick={onClose} 
        className="fixed inset-0 z-[999] bg-[#09090b]/80 backdrop-blur-xl transition-opacity duration-300"
      />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] w-full max-w-[420px] px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#09090b] border border-white/[0.04] p-8 rounded-3xl shadow-2xl relative">
          
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.02] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>

          <div className="mb-8 text-center mt-2">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-300 mx-auto mb-5 shadow-inner">
              <LogIn size={20} />
            </div>
            <h2 className="text-2xl font-medium text-white tracking-tight mb-2">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-sm text-zinc-500">
              {isLogin ? "Enter your details to sign in to your account" : "Join us to unlock pro features"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <MatteInput icon={User} type="text" placeholder="Full Name" value={name} onChange={(e: any) => setName(e.target.value)} required />
            )}
            
            <MatteInput icon={Mail} type="email" placeholder="Email Address" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
            
            <div className="flex flex-col gap-2">
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              {isLogin ? (
                <div className="flex justify-end w-full">
                  <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
              ) : password && (
                <div className="flex items-center justify-between px-2 mt-1">
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

            {error && <div className="text-red-400 text-sm px-1 py-1 text-center bg-red-400/10 rounded-lg">{error}</div>}
            {success && <div className="text-emerald-400 text-sm px-1 py-1 text-center bg-emerald-400/10 rounded-lg flex items-center justify-center gap-2"><CheckCircle size={14}/> {success}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-medium transition-all disabled:opacity-50 mt-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.04]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#09090b] px-4 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full h-11 flex items-center justify-center gap-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm font-medium text-zinc-300 transition-all cursor-pointer"
          >
            <GoogleIcon /> Google
          </button>

          <div className="mt-8 text-center text-sm text-zinc-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => switchMode(isLogin ? "signup" : "login")}
              className="text-zinc-300 hover:text-white font-medium transition-colors cursor-pointer"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

