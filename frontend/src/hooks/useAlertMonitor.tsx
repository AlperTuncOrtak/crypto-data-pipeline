// ============================================================
// hooks/useAlertMonitor.jsx
// ============================================================
// Alert monitoring sistemi:
//   - Her 30 saniyede localStorage alertleri kontrol eder
//   - Tetiklenince: Browser Notification + Ses + In-app Toast
// ============================================================

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import { supabase } from "../lib/supabase";
import { apiClient } from "../api/client";

const ToastContext = createContext(null);

// ── Ses üret (Web Audio API — harici dosya gerektirmez) ──────
function playAlertSound(type = "neutral") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    function beep(freq, startTime, duration) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    if (type === "up") {
      // İki yükselen nota — başarı sesi
      beep(523, ctx.currentTime, 0.18); // C5
      beep(784, ctx.currentTime + 0.2, 0.25); // G5
    } else if (type === "down") {
      // İki alçalan nota — uyarı sesi
      beep(659, ctx.currentTime, 0.18); // E5
      beep(392, ctx.currentTime + 0.2, 0.3); // G4
    } else {
      beep(660, ctx.currentTime, 0.2);
      beep(660, ctx.currentTime + 0.25, 0.2);
    }
  } catch (e) {}
}

// ── Browser Notification gönder ──────────────────────────────
async function sendBrowserNotification(title, body, icon) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
    });
  } else if (Notification.permission !== "denied") {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      new Notification(title, { body, icon: icon || "/favicon.ico" });
    }
  }
}

// ── Toast Provider ────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function addToast(toast) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // max 5 toast
    setTimeout(() => removeToast(id), toast.duration || 6000);
    return id;
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast container — sol alt */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column-reverse",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: "auto",
              background: "#1a1a1a",
              border: `1px solid ${toast.color || "var(--accent)"}40`,
              borderLeft: `3px solid ${toast.color || "var(--accent)"}`,
              borderRadius: 12,
              padding: "12px 16px",
              minWidth: 280,
              maxWidth: 360,
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${toast.color || "var(--accent)"}10`,
              animation: "slideInRight 0.3s cubic-bezier(0.34,1.26,0.64,1)",
              cursor: "pointer",
            }}
            onClick={() => removeToast(toast.id)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {toast.icon && (
                <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                  {toast.icon}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#f0f0f0",
                    marginBottom: 2,
                  }}
                >
                  {toast.title}
                </div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.4 }}>
                  {toast.body}
                </div>
                {toast.sub && (
                  <div
                    style={{
                      fontSize: 11,
                      color: toast.color || "var(--accent)",
                      marginTop: 4,
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    {toast.sub}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#555",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                ×
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

// ── Alert Monitor Hook ────────────────────────────────────────
// Bildirim ayarları için helper
export function getNotificationSettings() {
  try {
    return JSON.parse(localStorage.getItem("notification_settings") || "{}");
  } catch {
    return {};
  }
}

export function saveNotificationSettings(settings) {
  localStorage.setItem("notification_settings", JSON.stringify(settings));
}

export const DEFAULT_SETTINGS = {
  price_alerts: true, // Fiyat alertleri
  volume_spikes: true, // Hacim anomalileri
  sound: true, // Ses
  browser_notif: true, // Browser bildirimi
};

export function useAlertMonitor(marketData, isPro = false) {
  const { addToast } = useToast();
  const triggeredRef = useRef(new Set());

  // Volume spike'ları backend'den çek ve bildirim gönder
  const checkVolumeSpikes = useCallback(async () => {
    return; // DISABLED: Prevent spam during development
    if (!isPro) return; // Volume spikes — Pro plan only
    const settings = { ...DEFAULT_SETTINGS, ...getNotificationSettings() };
    if (!settings.volume_spikes) return;
    
    try {
      // DÜZELTME: Doğrudan axios instance'ı (apiClient) kullanıldı, lokalhost URL'i kaldırıldı.
      const resp = await apiClient.get("/market/volume-spikes?limit=5");
      const spikes = resp.data;
      
      const lastCheck = Number(localStorage.getItem("last_spike_check") || 0);
      const now = Date.now();
      localStorage.setItem("last_spike_check", now.toString());

      for (const spike of spikes) {
        if (!spike.timestamp) continue;
        // Son 35 saniyede gelmiş spike'ları bildir (30s interval + buffer)
        const spikeMsAgo = now - spike.timestamp * 1000;
        if (spikeMsAgo > 35000) continue;

        const spikeCooldownKey = `spike_notified_${spike.symbol}_${Math.floor(spike.timestamp / 60)}`;
        if (localStorage.getItem(spikeCooldownKey)) continue;
        localStorage.setItem(spikeCooldownKey, "1");

        const emoji = spike.severity === "extreme" ? "🔥" : "⚡";
        const color = "var(--accent)";
        addToast({
          title: `${emoji} ${spike.symbol} Volume Spike!`,
          body: `${spike.multiplier}x above average volume`,
          sub: `Current: $${Number(spike.current_volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          color,
          icon: emoji,
          duration: 8000,
        });
        
        if (settings.sound) playAlertSound("neutral");
        if (settings.browser_notif)
          sendBrowserNotification(
            `${emoji} ${spike.symbol} Volume Spike Detected`,
            `${spike.multiplier}x above normal — unusual activity detected`,
            undefined
          );
      }
    } catch (e) {
      /* backend erişilemiyorsa sessiz geç */
    }
  }, [addToast, isPro]);

  const checkAlerts = useCallback(async () => {
    const settings = { ...DEFAULT_SETTINGS, ...getNotificationSettings() };
    if (!settings.price_alerts) return;
    if (!marketData?.length) return;

    // Supabase'den alertleri cek
    let alerts = [];
    try {
      const { data } = await supabase
        .from("user_alerts")
        .select("*")
        .eq("active", true);
      alerts = data || [];
    } catch {
      return;
    }
    if (!alerts.length) return;

    const now = Date.now();

    alerts.forEach(async (alert) => {
      if (!alert.active) return;
      const coin = marketData.find((c) => c.symbol === alert.symbol);
      if (!coin) return;

      const price = Number(coin.current_price);
      const change = Number(coin.price_change_percentage_24h);

      let triggered = false;
      if (alert.type === "price_above") triggered = price >= alert.target;
      if (alert.type === "price_below") triggered = price <= alert.target;
      if (alert.type === "change_up") triggered = change >= alert.target;
      if (alert.type === "change_down")
        triggered = change <= -Math.abs(alert.target);

      if (!triggered) return;

      // Aynı alert 5 dakikada bir tekrar tetiklenebilir
      const cooldownKey = `${alert.id}_${Math.floor(now / 300000)}`;
      if (triggeredRef.current.has(cooldownKey)) return;
      triggeredRef.current.add(cooldownKey);

      const isUp = alert.type === "price_above" || alert.type === "change_up";
      const color = isUp ? "#2ecc71" : "#e74c3c";
      const emoji = isUp ? "🚀" : "⚠️";
      const fmtTgt = alert.type.includes("change")
        ? `${alert.target}%`
        : `$${Number(alert.target).toLocaleString(undefined, { maximumFractionDigits: 4 })}`;

      const title = `${emoji} ${alert.symbol} Alert Triggered`;
      const body = `${alert.typeLabel}: Target ${fmtTgt}`;
      const sub = `Current price: $${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;

      // 1. In-app toast
      addToast({ title, body, sub, color, icon: emoji, duration: 10000 });

      // 2. Browser notification
      if (settings.browser_notif)
        sendBrowserNotification(title, `${body}\n${sub}`, coin.image_url);

      // 3. Ses
      if (settings.sound) playAlertSound(isUp ? "up" : "down");
      
      // 4. Supabase deaktive et (sadece mutlak fiyat hedefleri için tek seferlik)
      if (alert.type === "price_above" || alert.type === "price_below") {
        try {
          await supabase
            .from("user_alerts")
            .update({ active: false })
            .eq("id", alert.id);
        } catch (e) {
          console.error("Failed to deactivate alert", e);
        }
      }
    });
  }, [marketData, addToast]);

  useEffect(() => {
    // İlk kontrol
    checkAlerts();
    checkVolumeSpikes();
    // Her 30 saniyede kontrol
    const iv1 = setInterval(checkAlerts, 30000);
    const iv2 = setInterval(checkVolumeSpikes, 30000);
    return () => {
      clearInterval(iv1);
      clearInterval(iv2);
    };
  }, [checkAlerts, checkVolumeSpikes]);

  // Bildirim izni iste
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Kullanıcı etkileşimi olmadan istemiyoruz, ilk alert tetiklenince istiyor
    }
  }, []);
}