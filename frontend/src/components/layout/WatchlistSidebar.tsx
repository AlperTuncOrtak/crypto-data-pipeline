import { useState, useMemo, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  X,
  Star,
  TrendingUp,
  TrendingDown,
  Trash2,
  Bell,
  BarChart2,
  Search,
  ArrowUpDown,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMarket } from "../../hooks/useMarket";
import { getCoinColor } from "../../utils/colors";
import PriceCell from "../ui/PriceCell";


function fmtPct(n) {
  const v = Number(n);
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

const SORT_OPTIONS = [
  { id: "added", label: "Added order" },
  { id: "change", label: "24h change" },
  { id: "price", label: "Price" },
  { id: "alpha", label: "A–Z" },
];

// ── Mini Sparkline ────────────────────────────────────────────
function Sparkline({ symbol }) {
  const { data: market } = useMarket(500);
  const coin = market?.find((c) => c.symbol === symbol);
  // Recharts yerine basit SVG sparkline — daha hızlı
  const isUp = (coin?.price_change_percentage_24h || 0) >= 0;
  const color = isUp ? "#2ecc71" : "#e74c3c";
  // Sahte ama tutarlı sparkline (coin'e özel seed ile)
  const seed = symbol.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const pts = Array.from({ length: 12 }, (_, i) => {
    const noise =
      Math.sin(seed * 0.1 + i * 1.3) * 0.4 + Math.cos(i * 0.7 + seed) * 0.3;
    const trend = isUp ? i * 0.06 : -i * 0.06;
    return 20 + (noise + trend) * 8;
  });
  const min = Math.min(...pts),
    max = Math.max(...pts);
  const norm = pts.map((p) => 28 - ((p - min) / (max - min + 0.01)) * 24);
  const path = norm
    .map((y, i) => `${i === 0 ? "M" : "L"} ${i * 8} ${y}`)
    .join(" ");
  return (
    <svg width={88} height={30} style={{ display: "block" }}>
      <path
        d={path}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}

// ── Watchlist Panel ───────────────────────────────────────────
function WatchlistPanel({
  watchlist,
  removeFromWatchlist,
  marketData,
  onClose,
  addToWatchlist,
  isAtLimit,
  limit,
}) {
  const navigate = useNavigate();
  const [sort, setSort] = useState("added");
  const [showSort, setShowSort] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const watchedCoins = useMemo(() => {
    const coins = watchlist
      .map((symbol) => marketData?.find((c) => c.symbol === symbol))
      .filter(Boolean);

    return [...coins].sort((a, b) => {
      if (sort === "change")
        return (
          (b.price_change_percentage_24h || 0) -
          (a.price_change_percentage_24h || 0)
        );
      if (sort === "price")
        return (b.current_price || 0) - (a.current_price || 0);
      if (sort === "alpha") return a.symbol.localeCompare(b.symbol);
      return 0; // added order
    });
  }, [watchlist, marketData, sort]);

  const searchResults = useMemo(() => {
    if (!addSearch.trim() || !marketData) return [];
    return marketData
      .filter(
        (c) =>
          (c.symbol?.toLowerCase().includes(addSearch.toLowerCase()) ||
            c.name?.toLowerCase().includes(addSearch.toLowerCase())) &&
          !watchlist.includes(c.symbol),
      )
      .slice(0, 6);
  }, [addSearch, marketData, watchlist]);

  const totalValue = watchedCoins.reduce(
    (s, c) => s + (c.current_price || 0),
    0,
  );

  return (
    <>
      {/* Header */}
      <div
        style={{ padding: "16px 16px 12px", borderBottom: "1px solid #1e1e1e" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Star
              size={14}
              style={{ color: "var(--accent)" }}
              fill="var(--accent)"
            />
            <span
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            >
              Watchlist
            </span>
            {watchlist.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: "var(--accent-soft)",
                  color: getCoinColor(coin.symbol), textShadow: "none",
                  fontFamily: "monospace",
                }}
              >
                {watchlist.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {/* Sort */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowSort((s) => !s)}
                title="Sort"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  border: "1px solid rgba(255, 255, 255, 0.02)",
                  background: showSort ? "var(--bg-elevated)" : "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowUpDown size={12} />
              </button>
              {showSort && (
                <div
                  style={{
                    position: "absolute",
                    top: 32,
                    right: 0,
                    background: "#1a1a1a",
                    border: "1px solid rgba(255, 255, 255, 0.02)",
                    borderRadius: 10,
                    overflow: "hidden",
                    zIndex: 10,
                    minWidth: 130,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setSort(o.id);
                        setShowSort(false);
                      }}
                      style={{
                        padding: "8px 12px",
                        fontSize: 12,
                        cursor: "pointer",
                        color:
                          sort === o.id
                            ? "var(--accent)"
                            : "var(--text-secondary)",
                        background:
                          sort === o.id
                            ? "var(--accent-soft)"
                            : "transparent",
                        fontWeight: sort === o.id ? 600 : 400,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--bg-elevated)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          sort === o.id
                            ? "var(--accent-soft)"
                            : "transparent")
                      }
                    >
                      {o.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Add coin */}
            <button
              onClick={() => {
                if (!isAtLimit) setShowAdd((s) => !s);
                else setShowLimitAlert(true);
              }}
              title={isAtLimit ? `Free plan: ${limit} coin limit` : "Add coin"}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: `1px solid ${isAtLimit ? "rgba(231,76,60,0.3)" : showAdd ? "var(--accent-soft)" : "var(--border)"}`,
                background: isAtLimit
                  ? "rgba(231,76,60,0.06)"
                  : showAdd
                    ? "var(--accent-soft)"
                    : "transparent",
                color: isAtLimit
                  ? "#e74c3c"
                  : showAdd
                    ? "var(--accent)"
                    : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Add coin search */}
        {showAdd && (
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--accent-soft)",
                borderRadius: 9,
              }}
            >
              <Search
                size={12}
                style={{ color: "var(--text-muted)", flexShrink: 0 }}
              />
              <input
                autoFocus
                type="text"
                placeholder="Search to add..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  flex: 1,
                }}
              />
            </div>
            {searchResults.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  background: "#1a1a1a",
                  border: "1px solid rgba(255, 255, 255, 0.02)",
                  borderRadius: 10,
                  overflow: "hidden",
                  zIndex: 20,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
              >
                {searchResults.map((coin) => (
                  <div
                    key={coin.symbol}
                    onClick={() => {
                      addToWatchlist(coin.symbol);
                      setAddSearch("");
                      setShowAdd(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-elevated)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {coin.image_url ? (
                      <img
                        src={coin.image_url}
                        style={{ width: 22, height: 22, borderRadius: "50%" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "var(--bg-surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 700,
                          color: getCoinColor(coin.symbol), textShadow: "none",
                        }}
                      >
                        {coin.symbol?.[0]}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {coin.symbol}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {coin.name}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: "var(--text-muted)",
                      }}
                    >
                      <PriceCell price={coin.current_price} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coin listesi */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
        {watchlist.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Star
              size={28}
              style={{
                color: "var(--text-muted)",
                marginBottom: 12,
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
              }}
            >
              Watchlist is empty
            </div>
            <div
              style={{ fontSize: 11, marginTop: 4, color: "var(--text-muted)" }}
            >
              Click ★ on any coin or use + to add
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {watchedCoins.map((coin) => {
              const change = Number(coin.price_change_percentage_24h);
              const isUp = change >= 0;
              return (
                <div
                  key={coin.symbol}
                  style={{ borderRadius: 10, transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", border: "1px solid transparent" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-elevated)";
                    e.currentTarget.style.borderColor = "var(--accent-soft)";
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                    }}
                  >
                    {/* Logo */}
                    <div
                      onClick={() => {
                        if (coin.slug) {
                          navigate(`/coin/${coin.slug}`);
                          onClose();
                        }
                      }}
                      style={{ cursor: "pointer", flexShrink: 0 }}
                    >
                      {coin.image_url ? (
                        <img
                          src={coin.image_url}
                          style={{ width: 30, height: 30, borderRadius: "50%" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: "var(--bg-elevated)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            color: getCoinColor(coin.symbol), textShadow: "none",
                          }}
                        >
                          {coin.symbol?.slice(0, 2)}
                        </div>
                      )}
                    </div>

                    {/* İsim + rank */}
                    <div
                      onClick={() => {
                        if (coin.slug) {
                          navigate(`/coin/${coin.slug}`);
                          onClose();
                        }
                      }}
                      style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: getCoinColor(coin.symbol), textShadow: "none",
                            fontFamily: "monospace",
                          }}
                        >
                          {coin.symbol}
                        </span>
                        {coin.market_cap_rank && (
                          <span
                            style={{
                              fontSize: 9,
                              color: "var(--text-muted)",
                              background: "var(--bg-elevated)",
                              padding: "1px 4px",
                              borderRadius: 4,
                            }}
                          >
                            #{coin.market_cap_rank}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {coin.name}
                      </div>
                    </div>

                    {/* Sparkline */}
                    <Sparkline symbol={coin.symbol} />

                    {/* Fiyat + değişim */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "monospace",
                          color: "var(--text-primary)",
                        }}
                      >
                        <PriceCell price={coin.current_price} />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: "monospace",
                          color: isUp ? "#2ecc71" : "#e74c3c",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 2,
                        }}
                      >
                        {isUp ? (
                          <TrendingUp size={9} />
                        ) : (
                          <TrendingDown size={9} />
                        )}
                        {fmtPct(change)}
                      </div>
                    </div>

                    {/* Sil */}
                    <button
                      onClick={() => removeFromWatchlist(coin.symbol)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        padding: 3,
                        borderRadius: 4,
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
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Limit uyarısı — Free plan */}
      {showLimitAlert && (
        <div
          style={{
            margin: "8px 10px",
            padding: "12px 14px",
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-soft)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <Crown size={13} style={{ color: "var(--accent)" }} />
            <span
              style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}
            >
              Free plan limit reached
            </span>
            <button
              onClick={() => setShowLimitAlert(false)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
              }}
            >
              <X size={12} />
            </button>
          </div>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 10,
              lineHeight: 1.5,
            }}
          >
            Free plan includes up to {limit} coins. Upgrade to Pro for unlimited
            watchlist.
          </p>
          <button
            onClick={() => (window.location.href = "/pricing")}
            style={{
              width: "100%",
              padding: "7px",
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
              color: "#111",
              fontWeight: 700,
              fontSize: 11,
              border: "none",
              cursor: "pointer",
            }}
          >
            Upgrade to Pro →
          </button>
        </div>
      )}

      {/* Footer */}
      {watchlist.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #1e1e1e",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {watchlist.length}
            {!isAtLimit && limit ? `/${limit}` : ""} coins tracked
            {isAtLimit && (
              <span style={{ color: "#e74c3c", marginLeft: 4 }}>
                · Limit reached
              </span>
            )}
          </span>
          <button
            onClick={() => {
              if (window.confirm("Clear all?"))
                watchlist.forEach((s) => removeFromWatchlist(s));
            }}
            style={{
              fontSize: 11,
              color: "#e74c3c",
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: 0.7,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            Clear all
          </button>
        </div>
      )}
    </>
  );
}

// ── Alerts Panel ──────────────────────────────────────────────
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
      const coin = marketData?.find((c) => c.symbol === alert.symbol);
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
              border: "1px solid var(--accent-soft)",
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

// ── Main ──────────────────────────────────────────────────────
const PANELS = [
  { key: "watchlist", Icon: Star, label: "Watchlist" },
  { key: "alerts", Icon: Bell, label: "Alerts" },
];

export default function RightSidebar({
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

  // addToWatchlist — prop'tan geliyor (useWatchlist hook)
  function addToWatchlist(symbol) {
    if (addToWatchlistProp) addToWatchlistProp(symbol);
  }

  // Tetiklenen alert sayısı — Supabase'den cekilir, market ile karsilastirilir
  const [sbAlerts, setSbAlerts] = useState([]);
  useEffect(() => {
    supabase
      .from("user_alerts")
      .select("*")
      .eq("active", true)
      .then(({ data }) => setSbAlerts(data || []));
  }, []);

  const triggeredCount = useMemo(() => {
    return sbAlerts.filter((alert) => {
      const coin = market?.find((c) => c.symbol === alert.symbol);
      if (!coin) return false;
      const price = Number(coin.current_price);
      const change = Number(coin.price_change_percentage_24h);
      if (alert.type === "price_above") return price >= alert.target;
      if (alert.type === "price_below") return price <= alert.target;
      if (alert.type === "change_up") return change >= alert.target;
      if (alert.type === "change_down")
        return change <= -Math.abs(alert.target);
      return false;
    }).length;
  }, [sbAlerts, market]);

  return (
    <>
      {/* ICON BAR */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 152,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "8px 6px",
          backgroundColor: "rgba(12, 12, 22, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.02)",
          borderRight: "none",
          borderRadius: "12px 0 0 12px",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
        }}
      >
        {PANELS.map(({ key, Icon, label }) => {
          const isActive = isOpen && activePanel === key;
          const badge =
            key === "watchlist"
              ? watchlist?.length
              : key === "alerts"
                ? triggeredCount
                : 0;
          return (
            <div key={key} style={{ position: "relative" }}>
              <button
                onClick={() => (isActive ? onClose() : onPanelChange(key))}
                title={label}
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: isActive
                    ? "var(--accent-soft)"
                    : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <Icon
                  size={16}
                  fill={
                    key === "watchlist" && watchlist?.length > 0
                      ? "var(--accent)"
                      : "none"
                  }
                />
                {badge > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        key === "alerts" && triggeredCount > 0
                          ? "#e74c3c"
                          : "var(--accent)",
                      border: "1px solid #111",
                      animation:
                        key === "alerts" && triggeredCount > 0
                          ? "pulse 1.5s infinite"
                          : "none",
                    }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 150,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* PANEL */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 44,
          bottom: 0,
          width: 320,
          zIndex: 151,
          backgroundColor: "rgba(2, 6, 23, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-12px 0 48px rgba(0,0,0,0.6)",
          transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 44px))",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {activePanel === "watchlist" && (
          <WatchlistPanel
            watchlist={watchlist}
            removeFromWatchlist={removeFromWatchlist}
            marketData={market}
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

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }`}</style>
    </>
  );
}
