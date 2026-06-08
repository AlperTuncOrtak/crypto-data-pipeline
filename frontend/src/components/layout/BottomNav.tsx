import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BarChart2, Brain, Bell, Wallet } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/market", icon: BarChart2, label: "Market" },
    { to: "/analysis/ai", icon: Brain, label: "AI" },
    { to: "/alerts", icon: Bell, label: "Alerts" },
    { to: "/portfolio", icon: Wallet, label: "Portfolio" },
  ];

  return (
    <div
      className="mobile-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "rgba(12, 12, 22, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.to);
        return (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              flex: 1,
              height: "100%",
              background: "none",
              border: "none",
              color: isActive ? "var(--accent)" : "rgba(255,255,255,0.4)",
              cursor: "pointer",
              transition: "color 0.2s ease",
            }}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
