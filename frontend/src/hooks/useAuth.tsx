// ============================================================
// hooks/useAuth.jsx
// ============================================================
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  async function fetchPlan(userId) {
    try {
      const { data } = await supabase
        .from("user_plans")
        .select("plan, expires_at")
        .eq("user_id", userId)
        .single();
      if (data) {
        // expires_at kontrolü
        const expired =
          data.expires_at && new Date(data.expires_at) < new Date();
        setPlan(expired ? "free" : data.plan);
      } else {
        setPlan("free");
      }
    } catch {
      setPlan("free");
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchPlan(session.user.id);
      else setPlan("free");
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchPlan(session.user.id);
      else setPlan("free");
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setPlan("free");
  }

  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const value = {
    user: isDev ? { id: 'dev-user', email: 'dev@cryptoneko.com' } : user,
    plan: isDev ? "pro" : plan,
    loading,
    signOut,
    isLoggedIn: isDev ? true : Boolean(user),
    isPro: isDev ? true : (plan === "pro" || plan === "enterprise"),
    isEnterprise: isDev ? true : (plan === "enterprise"),
    displayName: isDev ? "Local Dev (PRO)" : (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"),
    avatar: user?.user_metadata?.avatar_url || null,
    email: isDev ? "dev@cryptoneko.com" : (user?.email || null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
