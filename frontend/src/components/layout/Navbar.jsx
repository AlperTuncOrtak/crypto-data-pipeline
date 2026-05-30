import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  BarChart2,
  Bell,
  LineChart,
  LayoutDashboard,
  X,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  History,
  PlusCircle,
  Combine,
  Network,
  Star,
  Brain,
  LayoutGrid,
  Settings,
  LogOut,
  Crown,
  User,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { useMarket, useMarketStats } from "../../hooks/useMarket";
import { useAuth } from "../../hooks/useAuth";
import AuthModal from "../ui/AuthModal";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard, dropdown: null },
  { to: "/portfolio", label: "Portfolio", Icon: Wallet, dropdown: null },
  {
    to: "/market",
    label: "Market",
    Icon: BarChart2,
    dropdown: [
      {
        to: "/market",
        label: "All Coins",
        Icon: Layers,
        desc: "Browse all tracked coins",
        soon: false,
      },
      {
        to: "/market?sort=gain",
        label: "Top Gainers",
        Icon: TrendingUp,
        desc: "Best performers (24h)",
        soon: false,
      },
      {
        to: "/market?sort=loss",
        label: "Top Losers",
        Icon: TrendingDown,
        desc: "Worst performers (24h)",
        soon: false,
      },
      {
        to: "/market?sort=vol",
        label: "Highest Volume",
        Icon: Activity,
        desc: "Most traded coins",
        soon: false,
      },
      {
        to: "#",
        label: "Categories",
        Icon: Network,
        desc: "DeFi, Layer 1, Memes...",
        soon: true,
      },
    ],
  },
  {
    to: "/alerts",
    label: "Alerts",
    Icon: Bell,
    dropdown: [
      {
        to: "/alerts",
        label: "Active Alerts",
        Icon: Bell,
        desc: "Current market alerts",
        soon: false,
      },
      {
        to: "#",
        label: "Alert History",
        Icon: History,
        desc: "Past 7 days alerts",
        soon: true,
      },
      {
        to: "/alerts/create",
        label: "Create Alert",
        Icon: PlusCircle,
        desc: "Custom alert rules",
        soon: false,
      },
    ],
  },
  {
    to: "/analysis",
    label: "Analysis",
    Icon: LineChart,
    dropdown: [
      {
        to: "/analysis/ai",
        label: "AI Analysis",
        Icon: Brain,
        desc: "AI-powered technical analysis",
        soon: false,
      },
      {
        to: "/analysis",
        label: "Compare Coins",
        Icon: Combine,
        desc: "Multi-coin performance",
        soon: false,
      },
      {
        to: "/heatmap",
        label: "Market Heatmap",
        Icon: LayoutGrid,
        desc: "Visual market overview",
        soon: false,
      },
      {
        to: "#",
        label: "Correlation Matrix",
        Icon: Network,
        desc: "Coin price correlations",
        soon: true,
      },
    ],
  },
];

function formatLarge(n) {
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  return `$${num.toFixed(0)}`;
}

function NavItem({ item, isActive }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  function onEnter() {
    clearTimeout(timerRef.current);
    setOpen(true);
  }
  function onLeave() {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  }

  const Icon = item.Icon;

  return (
    <div
      className="relative"
      onMouseEnter={item.dropdown ? onEnter : undefined}
      onMouseLeave={item.dropdown ? onLeave : undefined}
    >
      <div
        onClick={() => navigate(item.to)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          borderRadius: 10,
          cursor: "pointer",
          userSelect: "none",
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
          background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
          border: isActive
            ? "1px solid rgba(255,255,255,0.12)"
            : "1px solid transparent",
          transition: "all 0.18s ease",
          backdropFilter: isActive ? "blur(8px)" : "none",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = "rgba(255,255,255,0.85)";
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = "rgba(255,255,255,0.45)";
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <Icon size={14} />
        {item.label}
        {item.dropdown && (
          <ChevronDown
            size={11}
            style={{
              opacity: 0.6,
              transform: open ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s ease",
            }}
          />
        )}
      </div>

      {item.dropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            zIndex: 1000,
            borderRadius: 16,
            overflow: "hidden",
            minWidth: 280,
            background: "rgba(10,10,12,0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,166,35,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
            opacity: open ? 1 : 0,
            transform: open
              ? "translateY(0) scale(1)"
              : "translateY(-6px) scale(0.97)",
            pointerEvents: open ? "auto" : "none",
            transition:
              "opacity 0.18s ease, transform 0.18s cubic-bezier(0.4,0,0.2,1)",
            transformOrigin: "top left",
          }}
        >
          {/* accent line */}
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, rgba(245,166,35,0.6), transparent)",
            }}
          />
          <div style={{ padding: "6px" }}>
            {item.dropdown.map((sub, idx) => {
              const SubIcon = sub.Icon;
              return (
                <div
                  key={sub.label}
                  onClick={() => {
                    if (!sub.soon) navigate(sub.to);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: sub.soon ? "not-allowed" : "pointer",
                    opacity: sub.soon ? 0.4 : 1,
                    transition: "background 0.15s",
                    animation: open
                      ? `fadeSlideIn 0.2s ease ${idx * 0.04}s both`
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!sub.soon)
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    className="icon-wrap"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(135deg, rgba(245,166,35,0.18), rgba(245,166,35,0.06))",
                      border: "1px solid rgba(245,166,35,0.15)",
                      color: "var(--accent)",
                    }}
                  >
                    <SubIcon size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.9)",
                        }}
                      >
                        {sub.label}
                      </span>
                      {sub.soon && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 4,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            background: "rgba(245,166,35,0.12)",
                            color: "var(--accent)",
                          }}
                        >
                          SOON
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 1,
                      }}
                    >
                      {sub.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar({
  onWatchlistOpen,
  watchlistCount,
  onAuthOpen,
  authOpen,
  setAuthOpen,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: statsData } = useMarketStats();
  const { data: marketData } = useMarket(2000);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);
  const {
    isLoggedIn,
    signOut,
    displayName,
    avatar,
    email,
    isPro,
    isEnterprise,
  } = useAuth();

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalVolume =
    marketData?.reduce((s, c) => s + (Number(c.total_volume) || 0), 0) || 0;
  const btcDom = marketData
    ? (() => {
        const btc = marketData.find((c) => c.symbol === "BTC");
        const total = marketData.reduce(
          (s, c) => s + (Number(c.market_cap) || 0),
          0,
        );
        return btc && total
          ? ((Number(btc.market_cap) / total) * 100).toFixed(1)
          : "—";
      })()
    : "—";
  const btcPrice = marketData?.find((c) => c.symbol === "BTC")?.current_price;
  const gainers =
    marketData?.filter((c) => Number(c.price_change_percentage_24h) > 0)
      .length || 0;
  const losers =
    marketData?.filter((c) => Number(c.price_change_percentage_24h) < 0)
      .length || 0;

  useEffect(() => {
    if (!search.trim() || !marketData) {
      setSearchResults([]);
      return;
    }
    const term = search.toLowerCase();
    setSearchResults(
      marketData
        .filter(
          (c) =>
            c.symbol?.toLowerCase().includes(term) ||
            c.name?.toLowerCase().includes(term),
        )
        .slice(0, 6),
    );
  }, [search, marketData]);

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,166,35,0); }
          50%       { box-shadow: 0 0 0 4px rgba(245,166,35,0.12); }
        }
      `}</style>

      {/* ── STATS BAR ───────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "rgba(12, 12, 22, 0.65)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            padding: "6px 28px",
            maxWidth: 1440,
            margin: "0 auto",
            overflowX: "hidden",
          }}
        >
          {[
            {
              label: "Coins",
              value: statsData?.coin_count ?? marketData?.length ?? 0,
              valueColor: "rgba(255,255,255,0.6)",
            },
            {
              label: "24h Vol",
              value: formatLarge(totalVolume),
              valueColor: "rgba(255,255,255,0.6)",
            },
            {
              label: "BTC",
              value: btcPrice
                ? `$${Number(btcPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "—",
              valueColor: "var(--accent)",
            },
            {
              label: "BTC Dom",
              value: `${btcDom}%`,
              valueColor: "rgba(255,255,255,0.6)",
            },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 16px",
                borderRight: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: s.valueColor,
                  fontFamily: "monospace",
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 16px",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#2ecc71",
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            >
              ↑ {gainers}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>
              ·
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#e74c3c",
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            >
              ↓ {losers}
            </span>
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--accent)",
                animation: "pulseGlow 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: "var(--accent)",
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN NAVBAR ─────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "10px 20px",
          transition: "all 0.3s ease",
          background: scrolled ? "rgba(12, 12, 22, 0.85)" : "rgba(12, 12, 22, 0.65)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: scrolled
            ? "1px solid rgba(245,166,35,0.15)"
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: scrolled ? "0 12px 48px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(245,166,35,0.05)" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            maxWidth: 1440,
            margin: "0 auto",
          }}
        >
          {/* LOGO */}
          <div
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              marginRight: 32,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                flexShrink: 0,
                overflow: "hidden"
              }}
            >
              <img src="/logo.png" alt="CryptoNeko Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                <span style={{ color: "var(--accent)" }}>Crypto</span>
                <span style={{ color: "rgba(255,255,255,0.9)" }}>Neko</span>
              </div>
              <div
                style={{
                  fontSize: 8,
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Analytics
              </div>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav
            style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);
              return <NavItem key={item.to} item={item} isActive={isActive} />;
            })}
          </nav>

          {/* RIGHT SIDE */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* WATCHLIST */}
            <button
              onClick={onWatchlistOpen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                background:
                  watchlistCount > 0
                    ? "rgba(245,166,35,0.1)"
                    : "rgba(255,255,255,0.04)",
                border:
                  watchlistCount > 0
                    ? "1px solid rgba(245,166,35,0.25)"
                    : "1px solid rgba(255,255,255,0.07)",
                color:
                  watchlistCount > 0
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.4)",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  watchlistCount > 0
                    ? "rgba(245,166,35,0.25)"
                    : "rgba(255,255,255,0.07)";
                e.currentTarget.style.color =
                  watchlistCount > 0
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.4)";
              }}
            >
              <Star
                size={12}
                fill={watchlistCount > 0 ? "var(--accent)" : "none"}
              />
              <span>Watchlist</span>
              {watchlistCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "var(--accent)",
                    background: "rgba(245,166,35,0.15)",
                    padding: "0 5px",
                    borderRadius: 5,
                  }}
                >
                  {watchlistCount}
                </span>
              )}
            </button>

            {/* SEARCH */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 10,
                  background: searchOpen ? "rgba(245,166,35,0.05)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${searchOpen ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: searchOpen ? "0 0 16px rgba(245,166,35,0.1)" : "none",
                  width: searchOpen ? 220 : 110,
                  transition: "all 0.25s ease",
                }}
              >
                <Search
                  size={12}
                  style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() =>
                    setTimeout(() => {
                      setSearchOpen(false);
                      setSearch("");
                    }, 150)
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 12,
                    width: "100%",
                    color: "rgba(255,255,255,0.8)",
                    caretColor: "var(--accent)",
                  }}
                />
                {search && (
                  <X
                    size={11}
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onClick={() => setSearch("")}
                  />
                )}
              </div>

              {searchResults.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "rgba(10,10,12,0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
                    minWidth: 240,
                    overflow: "hidden",
                    zIndex: 200,
                  }}
                >
                  {searchResults.map((coin) => (
                    <div
                      key={coin.symbol}
                      onClick={() => {
                        if (coin.slug) navigate(`/coin/${coin.slug}`);
                        setSearch("");
                        setSearchOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {coin.image_url ? (
                        <img
                          src={coin.image_url}
                          style={{ width: 26, height: 26, borderRadius: "50%" }}
                          alt={coin.symbol}
                        />
                      ) : (
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: "rgba(245,166,35,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--accent)",
                          }}
                        >
                          {coin.symbol?.slice(0, 1)}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.9)",
                          }}
                        >
                          {coin.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.3)",
                          }}
                        >
                          {coin.symbol?.toUpperCase()}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "var(--accent)",
                          fontWeight: 600,
                        }}
                      >
                        {coin.current_price
                          ? `$${Number(coin.current_price).toLocaleString(undefined, { maximumFractionDigits: 4 })}`
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <div
              style={{
                width: 1,
                height: 20,
                background: "rgba(255,255,255,0.08)",
              }}
            />

            {/* AUTH */}
            {isLoggedIn ? (
              <div style={{ position: "relative" }} ref={profileRef}>
                <div
                  onClick={() => setProfileOpen((o) => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 10px 5px 6px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: profileOpen
                      ? "rgba(245,166,35,0.12)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${profileOpen ? "rgba(245,166,35,0.25)" : "rgba(255,255,255,0.07)"}`,
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(245,166,35,0.1)";
                    e.currentTarget.style.borderColor = "rgba(245,166,35,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!profileOpen) {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.07)";
                    }
                  }}
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "1px solid rgba(245,166,35,0.3)",
                      }}
                      alt={displayName}
                    />
                  ) : (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #f5a623, #e8941a)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#111",
                      }}
                    >
                      {displayName?.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {displayName?.split(" ")[0]}
                  </span>
                  {(isPro || isEnterprise) && (
                    <Crown
                      size={10}
                      style={{
                        color: isEnterprise ? "#8b5cf6" : "var(--accent)",
                      }}
                    />
                  )}
                  <ChevronDown
                    size={10}
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      transform: profileOpen ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>

                {profileOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      width: 260,
                      zIndex: 2000,
                      background: "rgba(10,10,12,0.96)",
                      backdropFilter: "blur(24px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      boxShadow:
                        "0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: 1,
                        background:
                          isPro || isEnterprise
                            ? "linear-gradient(90deg, rgba(245,166,35,0.6), transparent)"
                            : "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)",
                      }}
                    />

                    {/* Profile info */}
                    <div
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        {avatar ? (
                          <img
                            src={avatar}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              border: "2px solid rgba(245,166,35,0.3)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #f5a623, #e8941a)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 15,
                              fontWeight: 800,
                              color: "#111",
                            }}
                          >
                            {displayName?.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "rgba(255,255,255,0.9)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {displayName}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.3)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {email}
                          </div>
                        </div>
                      </div>
                      {/* Plan badge */}
                      <div
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          background: isEnterprise
                            ? "rgba(139,92,246,0.1)"
                            : isPro
                              ? "rgba(245,166,35,0.08)"
                              : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isEnterprise ? "rgba(139,92,246,0.2)" : isPro ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.06)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {isEnterprise ? (
                            <Crown size={11} style={{ color: "#8b5cf6" }} />
                          ) : isPro ? (
                            <Crown
                              size={11}
                              style={{ color: "var(--accent)" }}
                            />
                          ) : (
                            <User
                              size={11}
                              style={{ color: "rgba(255,255,255,0.3)" }}
                            />
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: isEnterprise
                                ? "#8b5cf6"
                                : isPro
                                  ? "var(--accent)"
                                  : "rgba(255,255,255,0.35)",
                            }}
                          >
                            {isEnterprise
                              ? "Enterprise"
                              : isPro
                                ? "Pro"
                                : "Free"}{" "}
                            Plan
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            color:
                              isPro || isEnterprise
                                ? "var(--accent)"
                                : "rgba(255,255,255,0.2)",
                            fontWeight: 600,
                          }}
                        >
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Upgrade */}
                    {!isPro && !isEnterprise && (
                      <div
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/pricing");
                        }}
                        style={{
                          margin: "10px 10px 0",
                          padding: "11px 14px",
                          borderRadius: 10,
                          cursor: "pointer",
                          background:
                            "linear-gradient(135deg, rgba(245,166,35,0.12), rgba(232,148,26,0.06))",
                          border: "1px solid rgba(245,166,35,0.2)",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "linear-gradient(135deg, rgba(245,166,35,0.2), rgba(232,148,26,0.1))")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "linear-gradient(135deg, rgba(245,166,35,0.12), rgba(232,148,26,0.06))")
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                            }}
                          >
                            <Crown
                              size={13}
                              style={{ color: "var(--accent)" }}
                            />
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "var(--accent)",
                              }}
                            >
                              Upgrade to Pro
                            </span>
                          </div>
                          <ChevronRight
                            size={12}
                            style={{ color: "rgba(245,166,35,0.5)" }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(245,166,35,0.5)",
                            marginTop: 3,
                          }}
                        >
                          AI analysis, alerts, priority data
                        </div>
                      </div>
                    )}

                    {/* Menu */}
                    <div style={{ padding: "8px 8px" }}>
                      {[
                        {
                          icon: User,
                          label: "Profile",
                          soon: false,
                          action: null,
                        },
                        {
                          icon: Star,
                          label: "Watchlist",
                          soon: false,
                          action: () => {
                            setProfileOpen(false);
                            onWatchlistOpen();
                          },
                        },
                        {
                          icon: Settings,
                          label: "Settings",
                          soon: false,
                          action: () => {
                            setProfileOpen(false);
                            navigate("/settings");
                          },
                        },
                        {
                          icon: Crown,
                          label: "Plans & Billing",
                          soon: false,
                          action: () => {
                            setProfileOpen(false);
                            navigate("/pricing");
                          },
                        },
                      ].map(({ icon: Icon, label, soon, action }) => (
                        <div
                          key={label}
                          onClick={action}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: 8,
                            cursor: soon ? "default" : "pointer",
                            opacity: soon ? 0.4 : 1,
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (!soon)
                              e.currentTarget.style.background =
                                "rgba(255,255,255,0.04)";
                          }}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 9,
                            }}
                          >
                            <Icon
                              size={13}
                              style={{ color: "rgba(255,255,255,0.3)" }}
                            />
                            <span
                              style={{
                                fontSize: 13,
                                color: "rgba(255,255,255,0.65)",
                              }}
                            >
                              {label}
                            </span>
                          </div>
                          {soon && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: "1px 5px",
                                borderRadius: 4,
                                background: "rgba(245,166,35,0.1)",
                                color: "var(--accent)",
                              }}
                            >
                              SOON
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div
                      style={{
                        padding: "4px 8px 10px",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div
                        onClick={() => {
                          signOut();
                          setProfileOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "8px 10px",
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(231,76,60,0.08)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <LogOut size={13} style={{ color: "#e74c3c" }} />
                        <span style={{ fontSize: 13, color: "#e74c3c" }}>
                          Sign Out
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  onAuthOpen?.();
                  setAuthOpen?.(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #f5a623, #e8941a)",
                  color: "#111",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: "0 4px 16px rgba(245,166,35,0.3)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 6px 24px rgba(245,166,35,0.5)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(245,166,35,0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Sign In <span style={{ opacity: 0.7 }}>→</span>
              </button>
            )}
          </div>
        </div>
      </div>

    </>
  );
}
