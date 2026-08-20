// ============================================================
// hooks/useAuth.jsx
// ============================================================
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<any>(true ? { id: "local-dev-user", email: "dev@localhost", user_metadata: { full_name: "Local Dev" } } : null);
  const [token, setToken] = useState<any>(true ? "mock-token" : null);
  const [plan, setPlan] = useState<string>(true ? "pro" : "free");
  const [loading, setLoading] = useState(true);

  async function fetchPlan(userId) {
    try {
      const { data } = await supabase
        .from("user_plans")
        .select("plan, expires_at")
        .eq("user_id", userId)
        .single();
      if (data) {
        // expires_at kontrolÃ¼
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
    if (true) {
      setLoading(false);
      return;
    }
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
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setUser(null);
      setToken(null);
      setPlan("free");
      // Clear supabase local storage items
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      }
    }
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
    displayName: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Local Dev",
    avatar: user?.user_metadata?.avatar_url || null,
    email: user?.email || "dev@local.host",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

