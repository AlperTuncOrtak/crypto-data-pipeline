import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Bell, Plus, CheckCircle, Clock, Settings, Crown, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useMarket } from "../../hooks/useMarket";
import WatchlistPanel from "./WatchlistPanel";

function formatPrice(val: number) {
  if (val >= 1) return val.toFixed(2);
  if (val >= 0.01) return val.toFixed(4);
  return val.toFixed(8);
}

function AlertsPanel({ marketData, onClose }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    supabase
      .from("user_alerts")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAlerts(data || []));
  }, []);
  const [showSettings, setShowSettings] = useState(false);
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const s = JSON.parse(
        localStorage.getItem("notification_settings") || "{}",
      );
      return {
        price_alerts: s.price_alerts ?? true,
        volume_spikes: s.volume_spikes ?? true,
        sound: s.sound ?? true,
        browser_notif: s.browser_notif ?? true,
      };
    } catch {
      return {
        price_alerts: true,
        volume_spikes: true,
        sound: true,
        browser_notif: true,
      };
    }
  });

  function toggleSetting(key) {
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    localStorage.setItem("notification_settings", JSON.stringify(updated));
  }

  // Fiyatları canlı kontrol et
  const alertsWithStatus = useMemo(() => {
    return alerts.map((alert) => {
      const coin = (Array.isArray(marketData) ? marketData : []).find((c) => c.symbol === alert.symbol);
      if (!coin) return { ...alert, status: "pending", currentPrice: null };

      const price = Number(coin.current_price);
      const change = Number(coin.price_change_percentage_24h);
      const vol = Number(coin.total_volume);
      let triggered = false;

      if (alert.type === "price_above") triggered = price >= alert.target;
      if (alert.type === "price_below") triggered = price <= alert.target;
      if (alert.type === "change_up") triggered = change >= alert.target;
      if (alert.type === "change_down")
        triggered = change <= -Math.abs(alert.target);
      if (alert.type === "volume_spike") triggered = false; // volume_spike için baseline yok

      return {
        ...alert,
        status: triggered ? "triggered" : "pending",
        currentPrice: price,
        currentChange: change,
      };
    });
  }, [alerts, marketData]);

  const triggered = alertsWithStatus.filter((a) => a.status === "triggered");
  const pending = alertsWithStatus.filter((a) => a.status === "pending");

  async function deleteAlert(id) {
    await supabase.from("user_alerts").delete().eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  function fmtTarget(alert) {
    if (alert.type.includes("change")) return `${alert.target}%`;
    if (alert.type === "volume_spike") return `${alert.target}×`;
    return formatPrice(alert.target);
  }

  const TYPE_COLORS = {
    price_above: "#2ecc71",
    price_below: "#e74c3c",
    change_up: "#2ecc71",
    change_down: "#e74c3c",
    volume_spike: "var(--accent)",
  };

  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid #1e1e1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={14} style={{ color: "var(--accent)" }} />
          <span
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: "var(--text-primary)",
            }}
          >
            Alerts
          </span>
          {alerts.length > 0 && (
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 999,
                background: "var(--accent-soft)",
                color: "var(--accent)",
                fontFamily: "monospace",
              }}
            >
              {alerts.length}
            </span>
          )}
          {triggered.length > 0 && (
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 999,
                background: "rgba(231,76,60,0.15)",
                color: "#e74c3c",
                fontFamily: "monospace",
                animation: "pulse 1.5s infinite",
              }}
            >
              {triggered.length} triggered
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => {
              navigate("/alerts/create");
              onClose();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 7,
              border: "1px solid rgba(83,58,253,0.3)",
                boxShadow: "inset 0 0 10px rgba(83,58,253,0.1)",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              cursor: "pointer",
            }}
          >
            <Plus size={11} /> New
          </button>
          <button
            onClick={() => setShowSettings((s) => !s)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: `1px solid ${showSettings ? "var(--accent-soft)" : "var(--border)"}`,
              background: showSettings
                ? "var(--accent-soft)"
                : "transparent",
              color: showSettings ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={12} />
          </button>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: "1px solid rgba(255, 255, 255, 0.02)",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div
          style={{
            padding: "12px 16px",
            background: "#161616",
            borderBottom: "1px solid #222",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            Notification Settings
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                key: "price_alerts",
                label: "Price Alerts",
                desc: "Notify when price targets hit",
              },
              {
                key: "volume_spikes",
                label: "Volume Spikes",
                desc: "Notify on unusual volume activity",
              },
              { key: "sound", label: "Sound", desc: "Play alert sounds" },
              {
                key: "browser_notif",
                label: "Browser Notifications",
                desc: "System-level notifications",
              },
            ].map(({ key, label, desc }) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {desc}
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting(key)}
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 11,
                    border: "none",
                    cursor: "pointer",
                    background: notifSettings[key] ? "var(--accent)" : "#333",
                    position: "relative",
                    flexShrink: 0,
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      left: notifSettings[key] ? 19 : 3,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
        {alerts.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <Bell
              size={28}
              style={{
                color: "var(--text-muted)",
                opacity: 0.3,
                display: "block",
                margin: "0 auto 12px",
              }}
            />
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 4,
              }}
            >
              No alerts set
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginBottom: 16,
              }}
            >
              Create price and volume alerts for your coins
            </div>
            <button
              onClick={() => {
                navigate("/alerts/create");
                onClose();
              }}
              style={{
                padding: "8px 18px",
                borderRadius: 9,
                background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
                color: "#111",
                fontWeight: 700,
                fontSize: 12,
                border: "none",
                cursor: "pointer",
              }}
            >
              Create First Alert
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              padding: "4px 2px",
            }}
          >
            {/* Triggered önce */}
            {triggered.length > 0 && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#e74c3c",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "4px 8px",
                }}
              >
                ⚡ Triggered
              </div>
            )}
            {[...triggered, ...pending].map((alert) => {
              const color = TYPE_COLORS[alert.type] || "var(--accent)";
              const isTriggered = alert.status === "triggered";
              return (
                <div
                  key={alert.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: isTriggered ? `${color}15` : "var(--bg-surface)",
                    border: `1px solid ${isTriggered ? color + "50" : "var(--border)"}`,
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: isTriggered ? `0 0 16px ${color}20` : "none"
                  }}
                  onMouseEnter={e => {
                    if(!isTriggered) {
                      e.currentTarget.style.background = "var(--bg-elevated)";
                      e.currentTarget.style.borderColor = "var(--accent-soft)";
                    }
                  }}
                  onMouseLeave={e => {
                    if(!isTriggered) {
                      e.currentTarget.style.background = "var(--bg-surface)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        {isTriggered ? (
                          <CheckCircle
                            size={12}
                            style={{ color, flexShrink: 0 }}
                          />
                        ) : (
                          <Clock
                            size={12}
                            style={{
                              color: "var(--text-muted)",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: isTriggered ? color : "var(--text-primary)",
                          }}
                        >
                          {alert.symbol}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "1px 5px",
                            borderRadius: 4,
                            background: `${color}15`,
                            color,
                            fontWeight: 600,
                          }}
                        >
                          {alert.typeLabel}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <span>
                          Target:{" "}
                          <span
                            style={{
                              color,
                              fontFamily: "monospace",
                              fontWeight: 600,
                            }}
                          >
                            {fmtTarget(alert)}
                          </span>
                        </span>
                        {alert.currentPrice && (
                          <span>
                            Now:{" "}
                            <span
                              style={{
                                fontFamily: "monospace",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {formatPrice(alert.currentPrice)}
                            </span>
                          </span>
                        )}
                      </div>
                      {alert.note && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
                            marginTop: 3,
                            opacity: 0.7,
                          }}
                        >
                          {alert.note}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        padding: 2,
                        display: "flex",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#e74c3c")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-muted)")
                      }
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
    </>
  );
}


export default function WatchlistModal({
  isOpen,
  activePanel,
  onClose,
  onPanelChange,
  watchlist,
  addToWatchlist: addToWatchlistProp,
  removeFromWatchlist,
  toggleWatchlist,
  marketData,
  isAtLimit,
  limit,
}) {
  const { data: fullMarket } = useMarket(3000);
  const market = fullMarket || marketData;

  function addToWatchlist(symbol) {
    if (addToWatchlistProp) addToWatchlistProp(symbol);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[var(--bg-base)]/80 backdrop-blur-sm"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-[500px] h-[85vh] max-h-[800px] flex flex-col bg-[var(--bg-subtle)] border border-[var(--border-base)]/80 rounded-[32px] p-2 shadow-2xl overflow-hidden"
        >
          {/* Subtle Glow Background */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />

          {/* Header - Zen Browser Style Tabs */}
          <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex gap-2">
              <button
                onClick={() => onPanelChange("watchlist")}
                className={"flex items-center gap-2 px-4 py-2 rounded-3xl text-sm font-bold transition-all " + (activePanel === "watchlist" ? "bg-white/10 text-[var(--text-main)] shadow-sm" : "text-[var(--text-muted)] hover:text-gray-300 hover:bg-[var(--border-subtle)]")}
              >
                <Star size={16} fill={activePanel === "watchlist" ? "currentColor" : "none"} />
                Watchlist
              </button>
              <button
                onClick={() => onPanelChange("alerts")}
                className={"flex items-center gap-2 px-4 py-2 rounded-3xl text-sm font-bold transition-all " + (activePanel === "alerts" ? "bg-white/10 text-[var(--text-main)] shadow-sm" : "text-[var(--text-muted)] hover:text-gray-300 hover:bg-[var(--border-subtle)]")}
              >
                <Bell size={16} fill={activePanel === "alerts" ? "currentColor" : "none"} />
                Alerts
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Panel Content container */}
          <div className="relative z-10 flex-1 overflow-hidden rounded-b-[24px]">
            {activePanel === "watchlist" && (
              <WatchlistPanel
                watchlist={watchlist}
                removeFromWatchlist={removeFromWatchlist}
                safeMarketData={market}
                onClose={onClose}
                addToWatchlist={addToWatchlist}
                isAtLimit={isAtLimit}
                limit={limit}
              />
            )}
            {activePanel === "alerts" && (
              <AlertsPanel marketData={market} onClose={onClose} />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
