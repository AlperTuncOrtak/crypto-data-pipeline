import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastProvider, useAlertMonitor, useToast } from "./hooks/useAlertMonitor.jsx";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import Navbar from "./components/layout/Navbar";
import CoinTicker from "./components/market/CoinTicker";
import RightSidebar from "./components/layout/WatchlistSidebar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Alerts from "./pages/Alerts";
import Analysis from "./pages/Analysis";
import Correlation from "./pages/Correlation";
import CoinDetail from "./pages/CoinDetail";
import Heatmap from "./pages/Heatmap";
import AIAnalysis from "./pages/AIAnalysis";
import Pricing from "./pages/Pricing";
import Portfolio from "./pages/Portfolio";
import CreateAlert from "./pages/CreateAlert";
import DisclaimerModal from "./components/DisclaimerModal";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Documentation from "./pages/Documentation";
import { useWatchlist } from "./hooks/useWatchlist";
import { useMarket } from "./hooks/useMarket";
import AIChatWidget from "./components/ai/AIChatWidget";
import AuthModal from "./components/ui/AuthModal";
import { ThemeProvider, useTheme } from "./hooks/useTheme";

function AppInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("watchlist");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(
    () => !!localStorage.getItem("cryptoneko_disclaimer_accepted_v1"),
  );

  const { theme } = useTheme();

  const { isPro, isEnterprise, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Auto-redirect removed so users can see the Landing page animations

  const { addToast } = useToast();
  useEffect(() => {
    if (window.location.search.includes("verified=true")) {
      addToast({
        title: "Email Verified! 🎉",
        body: "Your email has been successfully verified. Welcome to CryptoNeko!",
        icon: "✅",
        color: "#2ecc71",
        duration: 8000
      });
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [addToast]);

  const {
    watchlist,
    addToWatchlist,
    toggleWatchlist,
    removeFromWatchlist,
    isWatched,
    isAtLimit,
    limit,
  } = useWatchlist();

  const { data: marketData } = useMarket(2000);

  useAlertMonitor(marketData, isPro || isEnterprise);

  function openPanel(panel) {
    setActivePanel(panel);
    setSidebarOpen(true);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-base)",
        overflowX: "clip",
        position: "relative",
      }}
    >
      {/* Global Background Effects */}
      <div className="amber-bg" />
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            theme === "light"
              ? "radial-gradient(rgba(15,23,42,0.04) 1px,transparent 1px)"
              : "radial-gradient(rgba(255,255,255,.015) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* Disclaimer — ilk girişte gösterilir, onaylanınca kaybolur */}
      <DisclaimerModal onAccept={() => setDisclaimerAccepted(true)} />

      {location.pathname !== "/" || isLoggedIn ? (
        <>
          <CoinTicker />
          <Navbar
            onWatchlistOpen={() => openPanel("watchlist")}
            watchlistCount={watchlist.length}
            onAuthOpen={(mode = "login") => {
              setAuthMode(mode);
              setAuthOpen(true);
            }}
            authOpen={authOpen}
            setAuthOpen={setAuthOpen}
          />
        </>
      ) : null}
      <main
        className={
          location.pathname === "/" && !isLoggedIn
            ? ""
            : "main-content"
        }
      >
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={
              <Landing onAuthOpen={(mode = "login") => {
                setAuthMode(mode);
                setAuthOpen(true);
              }} />
            }
          />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                isWatched={isWatched}
                toggleWatchlist={toggleWatchlist}
              />
            }
          />
          <Route
            path="/market"
            element={
              <Market isWatched={isWatched} toggleWatchlist={toggleWatchlist} />
            }
          />
          <Route path="/coin/:slug" element={<CoinDetail />} />
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/correlation" element={<Correlation />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/docs" element={<Documentation />} />
          <Route
            path="/pricing"
            element={<Pricing onAuthOpen={() => setAuthOpen(true)} />}
          />

          {/* Login gerekli */}
          <Route
            path="/alerts"
            element={
              <ProtectedRoute
                featureName="alerts"
                onAuthOpen={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                <Alerts />
              </ProtectedRoute>
            }
          />

          {/* Pro gerekli — Custom Alerts */}
          <Route
            path="/alerts/create"
            element={
              <ProtectedRoute
                requirePro
                featureName="Custom Alerts & Notifications"
                onAuthOpen={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                <CreateAlert />
              </ProtectedRoute>
            }
          />

          {/* Pro gerekli */}
          <Route
            path="/analysis/ai"
            element={
              <ProtectedRoute
                requirePro
                featureName="AI Technical Analysis"
                onAuthOpen={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                <AIAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute
                requirePro
                featureName="Portfolio Tracker & Tax Reporting"
                onAuthOpen={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                <Portfolio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute
                featureName="Settings"
                onAuthOpen={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {location.pathname !== "/" || isLoggedIn ? <Footer /> : null}

      <RightSidebar
        isOpen={sidebarOpen}
        activePanel={activePanel}
        onClose={() => setSidebarOpen(false)}
        onPanelChange={openPanel}
        watchlist={watchlist}
        addToWatchlist={addToWatchlist}
        removeFromWatchlist={removeFromWatchlist}
        toggleWatchlist={toggleWatchlist}
        marketData={marketData}
        isAtLimit={isAtLimit}
        limit={limit}
      />
      {isLoggedIn && <AIChatWidget />}
      {authOpen && (
        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          onLogin={() => setAuthOpen(false)}
          initialMode={authMode}
        />
      )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppInner />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
