// ============================================================
// hooks/useAuth.jsx
// ============================================================
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
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
      setToken(session?.access_token ?? null);
      if (session?.user) fetchPlan(session.user.id);
      else setPlan("free");
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      if (session?.user) fetchPlan(session.user.id);
      else setPlan("free");
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    setPlan("free");
  }

  const value = {
    user,
    token,
    plan,
    loading,
    signOut,
    isLoggedIn: Boolean(user),
    isPro: (plan === "pro" || plan === "enterprise"),
    isEnterprise: (plan === "enterprise"),
    displayName: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
    avatar: user?.user_metadata?.avatar_url || null,
    email: user?.email || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
