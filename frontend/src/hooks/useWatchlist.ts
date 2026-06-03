// ============================================================
// hooks/useWatchlist.js
// ============================================================
// Watchlist yönetimi:
//   - Giriş yapmış kullanıcı → Supabase DB (tüm cihazlarda sync)
//   - Misafir kullanıcı       → localStorage (oturum kapanınca kaybolur)
//
// Login olunca localStorage'daki liste Supabase'e migrate edilir.
//
// PLAN-BAZLI GATING:
//   - Free plan: max 10 coin (FREE_LIMIT)
//   - Pro / Enterprise: sınırsız
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth.jsx";

const LS_KEY = "crypto_watchlist";
const FREE_LIMIT = 10;

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeLocal(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

export function useWatchlist() {
  const { user, isLoggedIn, isPro, isEnterprise } = useAuth();
  const [watchlist, setWatchlist] = useState(readLocal);
  const [syncing, setSyncing] = useState(false);

  // Plan kontrolü
  const isUnlimited = isPro || isEnterprise;
  const isAtLimit = !isUnlimited && watchlist.length >= FREE_LIMIT;
  const limit = FREE_LIMIT;

  // ── Supabase'den yükle ──────────────────────────────────────
  const loadFromDB = useCallback(async () => {
    if (!isLoggedIn) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from("watchlist")
        .select("symbol")
        .order("added_at", { ascending: true });
      if (error) throw error;
      const symbols = data.map((r) => r.symbol);
      setWatchlist(symbols);
      writeLocal(symbols); // local'i de güncelle
    } catch (e) {
      console.error("Watchlist load error:", e);
    } finally {
      setSyncing(false);
    }
  }, [isLoggedIn]);

  // ── Login olunca: localStorage → Supabase migrate et ────────
  useEffect(() => {
    if (!isLoggedIn) return;

    async function migrate() {
      const local = readLocal();
      if (local.length > 0) {
        const rows = local.map((symbol) => ({ user_id: user.id, symbol }));
        // upsert: zaten varsa ignore et
        await supabase.from("watchlist").upsert(rows, {
          onConflict: "user_id,symbol",
          ignoreDuplicates: true,
        });
      }
      await loadFromDB();
    }

    migrate();
  }, [isLoggedIn, user?.id]); // eslint-disable-line

  // ── Logout olunca localStorage'a dön ───────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      setWatchlist(readLocal());
    }
  }, [isLoggedIn]);

  // ── Toggle ──────────────────────────────────────────────────
  async function toggleWatchlist(symbol) {
    const isIn = watchlist.includes(symbol);

    // Free plan limit kontrolü — ekleme yaparken
    if (!isIn && !isUnlimited && watchlist.length >= FREE_LIMIT) {
      return { success: false, reason: "limit", limit: FREE_LIMIT };
    }

    // Optimistic update
    const next = isIn
      ? watchlist.filter((s) => s !== symbol)
      : [...watchlist, symbol];
    setWatchlist(next);
    writeLocal(next);

    if (isLoggedIn) {
      try {
        if (isIn) {
          await supabase
            .from("watchlist")
            .delete()
            .eq("user_id", user.id)
            .eq("symbol", symbol);
        } else {
          await supabase.from("watchlist").insert({ user_id: user.id, symbol });
        }
      } catch (e) {
        // Rollback optimistic update
        console.error("Watchlist sync error:", e);
        setWatchlist(watchlist);
        writeLocal(watchlist);
      }
    }

    return { success: true };
  }

  function addToWatchlist(symbol) {
    if (!watchlist.includes(symbol)) return toggleWatchlist(symbol);
    return { success: true };
  }

  function removeFromWatchlist(symbol) {
    if (watchlist.includes(symbol)) toggleWatchlist(symbol);
  }

  function isWatched(symbol) {
    return watchlist.includes(symbol);
  }

  return {
    watchlist,
    syncing,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isWatched,
    // Plan-bazlı gating
    isAtLimit,
    limit,
    isUnlimited,
  };
}
