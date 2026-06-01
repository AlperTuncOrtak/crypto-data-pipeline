import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastProvider, useAlertMonitor } from "./hooks/useAlertMonitor.jsx";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import Navbar from "./components/layout/Navbar";
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
import { ThemeProvider } from "./hooks/useTheme";

function AppInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("watchlist");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(
    () => !!localStorage.getItem("cryptoneko_disclaimer_accepted_v1"),
  );

  const { isPro, isEnterprise, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    // If logged in and on root without preview query, redirect to dashboard
    if (isLoggedIn && window.location.pathname === "/" && !window.location.search.includes("preview=1")) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

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
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Global Background Effects */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.022) 1px,transparent 1px)",
          backgroundSize: "36px 36px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 1000,
          height: 500,
          background:
            "radial-gradient(ellipse,rgba(245,166,35,.04) 0%,transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* Disclaimer — ilk girişte gösterilir, onaylanınca kaybolur */}
      <DisclaimerModal onAccept={() => setDisclaimerAccepted(true)} />

      {location.pathname !== "/" || isLoggedIn ? (
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
              isLoggedIn ? (
                <Dashboard
                  isWatched={isWatched}
                  toggleWatchlist={toggleWatchlist}
                />
              ) : (
                <Landing onAuthOpen={(mode = "login") => {
                  setAuthMode(mode);
                  setAuthOpen(true);
                }} />
              )
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
