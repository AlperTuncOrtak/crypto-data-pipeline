// ============================================================
// pages/CreateAlert.jsx
// ============================================================
import { useState, useMemo, useEffect } from "react";
import { useMarket } from "../hooks/useMarket";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Check,
  X,
} from "lucide-react";

const ALERT_TYPES = [
  {
    id: "price_above",
    label: "Price Above",
    icon: TrendingUp,
    color: "#2ecc71",
    desc: "Alert when price goes above target",
  },
  {
    id: "price_below",
    label: "Price Below",
    icon: TrendingDown,
    color: "#e74c3c",
    desc: "Alert when price drops below target",
  },
  {
    id: "change_up",
    label: "% Change Up",
    icon: TrendingUp,
    color: "#2ecc71",
    desc: "Alert when 24h change exceeds threshold",
  },
  {
    id: "change_down",
    label: "% Change Down",
    icon: TrendingDown,
    color: "#e74c3c",
    desc: "Alert when 24h change drops below threshold",
  },
  {
    id: "volume_spike",
    label: "Volume Spike",
    icon: Activity,
    color: "#00F0FF",
    desc: "Alert when volume increases significantly",
  },
];

function fmtPrice(n) {
  const v = Number(n);
  if (isNaN(v)) return "—";
  if (v >= 1000)
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

export default function CreateAlert() {
  const { data: marketData } = useMarket(500);
  const { isLoggedIn } = useAuth();

  const [search, setSearch] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [selectedCoin, setSelected] = useState(null);
  const [alertType, setAlertType] = useState("price_above");
  const [targetValue, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Supabase'den alertleri cek
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoadingAlerts(true);
    supabase
      .from("user_alerts")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAlerts(data || []);
        setLoadingAlerts(false);
      });
  }, [isLoggedIn]);

  const filtered = useMemo(() => {
    if (!search.trim() || !marketData) return [];
    return marketData
      .filter(
        (c) =>
          c.symbol?.toLowerCase().includes(search.toLowerCase()) ||
          c.name?.toLowerCase().includes(search.toLowerCase()),
      )
      .slice(0, 8);
  }, [search, marketData]);

  const selectedType = ALERT_TYPES.find((t) => t.id === alertType);
  const TypeIcon = selectedType?.icon;

  async function handleSave() {
    if (!selectedCoin || !targetValue || !isLoggedIn) return;
    const { data, error } = await supabase
      .from("user_alerts")
      .insert({
        symbol: selectedCoin.symbol,
        type: alertType,
        target: parseFloat(targetValue),
        note: note || null,
        active: true,
      })
      .select()
      .single();

    if (!error && data) {
      setAlerts((prev) => [
        { ...data, name: selectedCoin.name, image_url: selectedCoin.image_url },
        ...prev,
      ]);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setSelected(null);
        setTarget("");
        setNote("");
        setSearch("");
      }, 2000);
    }
  }

  async function deleteAlert(id) {
    await supabase.from("user_alerts").delete().eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  const isPercent = alertType === "change_up" || alertType === "change_down";
  const isVolume = alertType === "volume_spike";

  return (
    <div style={{ color: "var(--text-primary)", maxWidth: 800 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Bell size={24} style={{ color: "var(--accent)" }} /> Create Alert
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          Set price and volume alerts for your coins. Alerts are checked every
          30 seconds.
        </p>
      </div>

      {/* FORM */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        {/* Coin seç */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "block",
              marginBottom: 8,
            }}
          >
            Coin
          </label>
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "var(--bg-elevated)",
                border: `1px solid ${showDrop ? "rgba(245,166,35,0.4)" : "var(--border)"}`,
                borderRadius: 12,
                transition: "border-color 0.2s",
              }}
            >
              <Search
                size={14}
                style={{ color: "var(--text-muted)", flexShrink: 0 }}
              />
              <input
                type="text"
                placeholder={
                  selectedCoin
                    ? `${selectedCoin.name} selected`
                    : "Search coin (BTC, ETH...)"
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDrop(true);
                }}
                onFocus={() => {
                  setShowDrop(true);
                  setSearch("");
                }}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  flex: 1,
                }}
              />
              {selectedCoin && !search && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {selectedCoin.image_url && (
                    <img
                      src={selectedCoin.image_url}
                      style={{ width: 20, height: 20, borderRadius: "50%" }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--accent)",
                      fontFamily: "monospace",
                    }}
                  >
                    {selectedCoin.symbol?.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                    }}
                  >
                    {fmtPrice(selectedCoin.current_price)}
                  </span>
                </div>
              )}
            </div>
            {showDrop && filtered.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  background: "#1a1a1a",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  zIndex: 50,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                }}
              >
                {filtered.map((coin) => (
                  <div
                    key={coin.symbol}
                    onClick={() => {
                      setSelected(coin);
                      setSearch("");
                      setShowDrop(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      cursor: "pointer",
                      transition: "background 0.15s",
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
                        style={{ width: 28, height: 28, borderRadius: "50%" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "var(--bg-surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--accent)",
                        }}
                      >
                        {coin.symbol?.[0]}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {coin.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {coin.symbol?.toUpperCase()}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontFamily: "monospace",
                        color: "var(--text-muted)",
                      }}
                    >
                      {fmtPrice(coin.current_price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alert tipi */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "block",
              marginBottom: 8,
            }}
          >
            Alert Type
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 8,
            }}
          >
            {ALERT_TYPES.map((t) => {
              const Icon = t.icon;
              const selected = alertType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setAlertType(t.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: `1px solid ${selected ? t.color + "44" : "var(--border)"}`,
                    background: selected
                      ? `${t.color}10`
                      : "var(--bg-elevated)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  <Icon
                    size={14}
                    style={{
                      color: selected ? t.color : "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: selected ? 600 : 400,
                      color: selected ? t.color : "var(--text-muted)",
                    }}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedType && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Zap size={11} style={{ color: "var(--accent)" }} />
              {selectedType.desc}
            </div>
          )}
        </div>

        {/* Target değer */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "block",
              marginBottom: 8,
            }}
          >
            {isPercent
              ? "Threshold (%)"
              : isVolume
                ? "Volume Multiplier"
                : "Target Price (USD)"}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontSize: 14,
                }}
              >
                {isPercent ? "%" : isVolume ? "×" : "$"}
              </span>
              <input
                type="number"
                placeholder={
                  isPercent
                    ? "e.g. 5"
                    : isVolume
                      ? "e.g. 2"
                      : selectedCoin
                        ? selectedCoin.current_price?.toFixed(2)
                        : "0.00"
                }
                value={targetValue}
                onChange={(e) => setTarget(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 32px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(245,166,35,0.4)")
                }
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            {selectedCoin && !isPercent && !isVolume && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                Current:{" "}
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                >
                  {fmtPrice(selectedCoin.current_price)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Not */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "block",
              marginBottom: 8,
            }}
          >
            Note (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Support level break"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(245,166,35,0.4)")
            }
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!selectedCoin || !targetValue}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 12,
            border: "none",
            background:
              !selectedCoin || !targetValue
                ? "rgba(245,166,35,0.2)"
                : saved
                  ? "rgba(46,204,113,0.8)"
                  : "linear-gradient(135deg, #00F0FF, #8B5CF6)",
            color: "#111",
            fontSize: 14,
            fontWeight: 700,
            cursor: !selectedCoin || !targetValue ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
        >
          {saved ? (
            <>
              <Check size={16} /> Alert Saved!
            </>
          ) : (
            <>
              <Bell size={15} /> Create Alert
            </>
          )}
        </button>
      </div>

      {/* MEVCUT ALERTLER */}
      {alerts.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
            Your Alerts ({alerts.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alerts.map((a) => {
              const t = ALERT_TYPES.find((x) => x.id === a.type);
              const Icon = t?.icon || Bell;
              return (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                >
                  {a.image_url && (
                    <img
                      src={a.image_url}
                      style={{ width: 32, height: 32, borderRadius: "50%" }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 14 }}>
                        {a.symbol}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 7px",
                          borderRadius: 5,
                          background: `${t?.color || "#888"}18`,
                          color: t?.color || "#888",
                          fontWeight: 600,
                        }}
                      >
                        {a.typeLabel}
                      </span>
                      {a.note && (
                        <span
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          · {a.note}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      Target:{" "}
                      <span
                        style={{
                          color: t?.color,
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {a.type.includes("change")
                          ? `${a.target}%`
                          : a.type === "volume_spike"
                            ? `${a.target}×`
                            : fmtPrice(a.target)}
                      </span>
                      <span style={{ marginLeft: 8 }}>
                        · Created {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAlert(a.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: 4,
                      display: "flex",
                      borderRadius: 6,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#e74c3c")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
