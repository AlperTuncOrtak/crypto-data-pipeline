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
  Menu,
  Wallet,
  Sun,
  Moon,
  Eye,
  Trophy,
} from "lucide-react";
import { useMarket, useMarketStats } from "../../hooks/useMarket";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import AuthModal from "../ui/AuthModal";
import WalletConnectButton from "../web3/WalletConnectButton";
import { useTranslation } from "react-i18next";
import { getCoinColor } from "../../utils/colors";
import AnimatedLogo from "./AnimatedLogo";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, dropdown: null },
  { to: "/portfolio", label: "Portfolio", Icon: Wallet, dropdown: null },
  {
    to: "/market",
    label: "Market",
    Icon: BarChart2,
    dropdown: [
      { to: "/market", label: "All Coins", Icon: Layers, desc: "Browse all tracked coins", soon: false },
      { to: "/market?sort=gain", label: "Top Gainers", Icon: TrendingUp, desc: "Best performers (24h)", soon: false },
      { to: "/market?sort=loss", label: "Top Losers", Icon: TrendingDown, desc: "Worst performers (24h)", soon: false },
      { to: "/narratives", label: "AI Narratives", Icon: Brain, desc: "Live Market Hype Map", soon: false },
    ],
  },
  {
    to: "/analysis",
    label: "Discover",
    Icon: Search,
    dropdown: [
      { to: "/analysis/ai", label: "AI Analysis", Icon: Brain, desc: "AI-powered technical analysis", soon: false },
      { to: "/heatmap", label: "Market Heatmap", Icon: LayoutGrid, desc: "Visual market overview", soon: false },
      { to: "/whale", label: "Whale X-Ray", Icon: Eye, desc: "Analyze wallet portfolios", soon: false },
      { to: "/timemachine", label: "Time Machine", Icon: History, desc: "Historical backtesting", soon: false },
      { to: "/alerts", label: "Active Alerts", Icon: Bell, desc: "Current market alerts", soon: false },
    ],
  },
  { to: "/leaderboard", label: "Leaderboard", Icon: Trophy, dropdown: null },
  { to: "/pro", label: "Pro", Icon: Crown, dropdown: null },
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
  const { t } = useTranslation();

  function onEnter() {
    clearTimeout(timerRef.current);
    setOpen(true);
  }
  function onLeave() {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  }

  const Icon = item.Icon;

  // We map the english label to the translation key
  const translationKey = item.label.toLowerCase().replace(" ", "_");

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
          padding: "6px 12px",
          borderRadius: 8,
          cursor: "pointer",
          userSelect: "none",
          fontSize: 13,
          fontWeight: isActive ? 500 : 400,
          letterSpacing: "-0.01em",
          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
          background: isActive ? "var(--bg-hover)" : "transparent",
          border: "1px solid transparent",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--border)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }
        }}
      >
        <Icon size={14} />
        {t(`nav.${translationKey}`, item.label)}
        {item.dropdown && (
          <ChevronDown
            size={11}
            style={{
              opacity: 0.5,
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
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 1000,
            borderRadius: 16,
            overflow: "hidden",
            minWidth: 272,
            background: "rgba(5, 5, 5, 0.85)",
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            border: "1px solid var(--border)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.97)",
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 0.18s ease, transform 0.18s cubic-bezier(0.4,0,0.2,1)",
            transformOrigin: "top left",
          }}
        >
          {/* top indigo gradient line */}
          <div style={{ height: 1, background: "linear-gradient(90deg, var(--accent), transparent 60%)", opacity: 0.6 }} />
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
                    borderRadius: 8,
                    cursor: sub.soon ? "not-allowed" : "pointer",
                    opacity: sub.soon ? 0.38 : 1,
                    transition: "background 0.2s ease, border-color 0.2s ease",
                    border: "1px solid transparent",
                    animation: open ? `fadeSlideIn 0.2s ease ${idx * 0.04}s both` : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!sub.soon) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--accent-soft)",
                      border: "1px solid var(--accent-border)",
                      color: "var(--accent)",
                    }}
                  >
                    <SubIcon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          letterSpacing: "-0.01em",
                          color: "var(--text-primary)",
                        }}
                      >
                        {t(`nav.${sub.label.toLowerCase().replace(/ /g, "_")}`, sub.label)}
                      </span>
                      {sub.soon && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 4,
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            background: "var(--accent-soft)",
                            color: "var(--accent)",
                            border: "1px solid var(--accent-border)",
                          }}
                        >
                          SOON
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                      {t(`nav.${sub.label.toLowerCase().replace(/ /g, "_")}_desc`, sub.desc)}
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
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef(null);
  const langRef = useRef(null);
  const { t, i18n } = useTranslation();
  const {
    isLoggedIn,
    signOut,
    displayName,
    avatar,
    email,
    isPro,
    isEnterprise,
  } = useAuth();

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
      if (langRef.current && !langRef.current.contains(e.target))
        setLangOpen(false);
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
          50%       { box-shadow: 0 0 0 4px var(--accent-soft); }
        }
      `}</style>

      {/* ── SCROLLING STATS MARQUEE ───────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: theme === 'light' ? "#fafafa" : "#000",
          borderBottom: `1px solid var(--border)`,
          overflow: "hidden",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          height: "36px",
        }}
      >
        <style>{`
          @keyframes marqueeNavbar {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-content {
            display: flex;
            align-items: center;
            width: max-content;
            animation: marqueeNavbar 30s linear infinite;
          }
          .marquee-content:hover {
            animation-play-state: paused;
          }
          .stat-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 0 24px;
            border-right: 1px solid var(--border);
          }
        `}</style>

        {(() => {
          const content = (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className="stat-item">
                <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("nav.coins_marquee")}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  {statsData?.coin_count ?? marketData?.length ?? 0}
                </span>
              </div>
              <div className="stat-item">
                <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("nav.vol_24h_marquee")}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  {formatLarge(totalVolume)}
                </span>
              </div>
              <div className="stat-item">
                <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>BTC</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", fontFamily: "monospace" }}>
                  {btcPrice ? `$${Number(btcPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                </span>
              </div>
              <div className="stat-item">
                <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("nav.btc_dom_marquee")}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  {btcDom}%
                </span>
              </div>
              <div className="stat-item" style={{ gap: 12 }}>
                <span style={{ fontSize: 11, color: "var(--positive)", fontFamily: "monospace", fontWeight: 600 }}>▲ {gainers}</span>
                <span style={{ fontSize: 11, color: "var(--negative)", fontFamily: "monospace", fontWeight: 600 }}>▼ {losers}</span>
              </div>
              {marketData?.slice(0, 10).map((coin) => (
                <div key={coin.symbol} className="stat-item">
                  <span style={{ fontSize: 10, color: getCoinColor(coin.symbol), fontWeight: 800 }}>{coin.symbol.toUpperCase()}</span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-primary)" }}>
                    ${Number(coin.current_price) < 1 ? Number(coin.current_price).toFixed(4) : Number(coin.current_price).toLocaleString()}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 600, color: Number(coin.price_change_percentage_24h) >= 0 ? "var(--positive)" : "var(--negative)" }}>
                    {Number(coin.price_change_percentage_24h) >= 0 ? "▲" : "▼"} {Math.abs(Number(coin.price_change_percentage_24h)).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          );

          return (
            <div className="marquee-content">
              {content}
              {content}
            </div>
          );
        })()}
      </div>

      {/* ── MAIN NAVBAR ─────────────────────────────────────── */}
      <div
        className="frosted"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "6px 20px",
          transition: "border-color 0.2s ease",
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
          <AnimatedLogo />

          {/* NAV LINKS */}
          <nav
            className="desktop-nav-links"
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
                    ? "rgba(255,255,255,0.1)"
                    : "var(--border-soft)",
                border:
                  watchlistCount > 0
                    ? "1px solid rgba(255,255,255,0.2)"
                    : "1px solid var(--border)",
                color:
                  watchlistCount > 0
                    ? "#fff"
                    : "var(--text-muted)",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  watchlistCount > 0
                    ? "rgba(255,255,255,0.2)"
                    : "var(--border)";
                e.currentTarget.style.color =
                  watchlistCount > 0
                    ? "#fff"
                    : "var(--text-muted)";
              }}
            >
              <Star
                size={12}
                fill={watchlistCount > 0 ? "#fff" : "none"}
              />
              <span>{t("nav.watchlist")}</span>
              {watchlistCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "#000",
                    background: "#fff",
                    padding: "0 5px",
                    borderRadius: 5,
                  }}
                >
                  {watchlistCount}
                </span>
              )}
            </button>

            {/* THEME TOGGLE */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 10,
                cursor: "pointer",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                transition: "all 0.18s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* SEARCH */}
            <div className="hide-mobile" style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 10,
                  background: searchOpen ? "rgba(255,255,255,0.05)" : "var(--border-soft)",
                  border: `1px solid ${searchOpen ? "rgba(255,255,255,0.2)" : "var(--border)"}`,
                  boxShadow: searchOpen ? "0 0 16px rgba(255,255,255,0.05)" : "none",
                  width: searchOpen ? 220 : 110,
                  transition: "all 0.25s ease",
                }}
              >
                <Search
                  size={12}
                  style={{ color: "var(--text-muted)", flexShrink: 0 }}
                />
                <input
                  type="text"
                  placeholder={t("nav.search")}
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
                    color: "var(--text-secondary)",
                    caretColor: "var(--accent)",
                  }}
                />
                {search && (
                  <X
                    size={11}
                    style={{
                      color: "var(--text-muted)",
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
                    background: "#16181c",
                    backdropFilter: "blur(20px)",
                    border: "1px solid var(--border)",
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
                        borderBottom: "1px solid var(--border-soft)",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--border)")
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
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#000",
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
                            color: "var(--text-primary)",
                          }}
                        >
                          {coin.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
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

            {/* LANGUAGE SWITCHER */}
            <div className="hide-mobile" style={{ position: "relative" }} ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: langOpen ? "var(--border)" : "var(--border-soft)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
              >
                {i18n.language.toUpperCase().slice(0, 2) === 'TR' ? '🇹🇷 TR' : '🇬🇧 EN'}
              </button>

              {langOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "#16181c",
                    backdropFilter: "blur(20px)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
                    minWidth: 120,
                    overflow: "hidden",
                    zIndex: 200,
                    display: "flex",
                    flexDirection: "column",
                    padding: 4
                  }}
                >
                  <button
                    onClick={() => { i18n.changeLanguage('en'); setLangOpen(false); }}
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      cursor: "pointer",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => { i18n.changeLanguage('tr'); setLangOpen(false); }}
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      cursor: "pointer",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    🇹🇷 Türkçe
                  </button>
                </div>
              )}
            </div>

            {/* WALLET CONNECT — hide on mobile */}
            <div className="hide-mobile">
              <WalletConnectButton />
            </div>

            {/* HAMBURGER — mobile only */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              style={{
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--border-soft)",
                cursor: "pointer",
                color: "var(--text-secondary)",
                flexShrink: 0,
              }}
              className="show-mobile-flex"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            {/* DIVIDER — hide on mobile */}
            <div
              className="hide-mobile"
              style={{
                width: 1,
                height: 20,
                background: "var(--border)",
              }}
            />

            {/* AUTH */}
            {isLoggedIn ? (
              <div className="hide-mobile" style={{ position: "relative" }} ref={profileRef}>
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
                      ? "var(--accent-soft)"
                      : "var(--border-soft)",
                    border: `1px solid ${profileOpen ? "var(--accent-soft)" : "var(--border)"}`,
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--accent-soft)";
                    e.currentTarget.style.borderColor = "var(--accent-soft)";
                  }}
                  onMouseLeave={(e) => {
                    if (!profileOpen) {
                      e.currentTarget.style.background =
                        "var(--border-soft)";
                      e.currentTarget.style.borderColor =
                        "var(--border)";
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
                        border: "1px solid var(--accent-soft)",
                      }}
                      alt={displayName}
                    />
                  ) : (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent), #8B5CF6)",
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
                      color: "var(--text-secondary)",
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
                      color: "var(--text-muted)",
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
                      border: "1px solid var(--border)",
                      borderRadius: 24,
                      boxShadow:
                        "0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: 1,
                        background:
                          isPro || isEnterprise
                            ? "linear-gradient(90deg, var(--accent-border), transparent)"
                            : "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)",
                      }}
                    />

                    {/* Profile info */}
                    <div
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid var(--border)",
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
                              border: "2px solid var(--accent-soft)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, var(--accent), #8B5CF6)",
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
                              color: "var(--text-primary)",
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
                              color: "var(--text-muted)",
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
                            ? "var(--secondary-soft)"
                            : isPro
                              ? "var(--accent-soft)"
                              : "var(--border-soft)",
                          border: `1px solid ${isEnterprise ? "var(--secondary-soft)" : isPro ? "var(--accent-soft)" : "var(--border)"}`,
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
                              style={{ color: "var(--text-muted)" }}
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
                                  : "var(--text-muted)",
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
                                : "var(--text-muted)",
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
                            "linear-gradient(135deg, var(--accent-soft), rgba(232,148,26,0.06))",
                          border: "1px solid var(--accent-soft)",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "linear-gradient(135deg, var(--accent-soft), rgba(232,148,26,0.1))")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "linear-gradient(135deg, var(--accent-soft), rgba(232,148,26,0.06))")
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
                              {t("nav.upgrade_to_pro")}
                            </span>
                          </div>
                          <ChevronRight
                            size={12}
                            style={{ color: "var(--accent-border)" }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--accent-border)",
                            marginTop: 3,
                          }}
                        >
                          {t("nav.upgrade_desc")}
                        </div>
                      </div>
                    )}

                    {/* Menu */}
                    <div style={{ padding: "8px 8px" }}>
                      {[
                        {
                          icon: LayoutGrid,
                          label: t("nav.view_landing"),
                          soon: false,
                          action: () => {
                            setProfileOpen(false);
                            navigate("/?preview=1");
                          },
                        },
                        {
                          icon: User,
                          label: t("nav.profile"),
                          soon: false,
                          action: null,
                        },
                        {
                          icon: Star,
                          label: t("nav.watchlist"),
                          soon: false,
                          action: () => {
                            setProfileOpen(false);
                            onWatchlistOpen();
                          },
                        },
                        {
                          icon: Settings,
                          label: t("nav.settings"),
                          soon: false,
                          action: () => {
                            setProfileOpen(false);
                            navigate("/settings");
                          },
                        },
                        {
                          icon: Crown,
                          label: t("nav.plans_billing"),
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
                                "var(--border-soft)";
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
                              style={{ color: "var(--text-muted)" }}
                            />
                            <span
                              style={{
                                fontSize: 13,
                                color: "var(--text-secondary)",
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
                                background: "var(--accent-soft)",
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
                        borderTop: "1px solid var(--border-soft)",
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
                          {t('nav.logout')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => {
                    onAuthOpen?.("login");
                    setAuthOpen?.(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 16px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--text-muted)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => {
                    onAuthOpen?.("signup");
                    setAuthOpen?.(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 18px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: "var(--accent)",
                    color: "#020617",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 800,
                    boxShadow: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {t('nav.signup')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ MOBILE DRAWER ════════════════════════════════════ */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            top: 0,
            zIndex: 999,
            pointerEvents: "none",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              pointerEvents: "auto",
            }}
          />
          {/* Drawer panel */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "min(320px, 90vw)",
              height: "100vh",
              background: "#16181c",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              pointerEvents: "auto",
              animation: "slideInRight 0.25s cubic-bezier(0.25,1,0.5,1)",
            }}
          >
            {/* Drawer header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Crypto</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>Neko</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ height: 1, background: "var(--border)", margin: "0 20px" }} />

            {/* Nav links */}
            <nav style={{ padding: "12px 12px", flex: 1 }}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.Icon;
                const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
                return (
                  <div key={item.to}>
                    <div
                      onClick={() => { navigate(item.to); setMobileOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: 16,
                        cursor: "pointer",
                        background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                        color: isActive ? "#fff" : "var(--text-secondary)",
                        fontWeight: isActive ? 600 : 400,
                        fontSize: 14,
                        marginBottom: 2,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--border-soft)"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <Icon size={16} />
                      {t(`nav.${item.label.toLowerCase().replace(/ /g, "_")}`, item.label)}
                    </div>
                    {/* Sub-items */}
                    {item.dropdown && (
                      <div style={{ paddingLeft: 20, marginBottom: 4 }}>
                        {item.dropdown.filter(d => !d.soon).map((sub) => (
                          <div
                            key={sub.to}
                            onClick={() => { navigate(sub.to); setMobileOpen(false); }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "9px 14px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontSize: 13,
                              color: "var(--text-muted)",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--border-soft)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                          >
                            <sub.Icon size={13} />
                            {t(`nav.${sub.label.toLowerCase().replace(/ /g, "_")}`, sub.label)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div style={{ height: 1, background: "var(--border)", margin: "0 20px" }} />

            {/* Bottom actions */}
            <div style={{ padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
              <WalletConnectButton />
              {!isLoggedIn && (
                <button
                  onClick={() => { onAuthOpen("login"); setMobileOpen(false); }}
                  style={{
                    padding: "11px", borderRadius: 10, width: "100%",
                    background: "#fff",
                    border: "none", color: "#111", fontSize: 13, fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t('nav.login')} →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
}


