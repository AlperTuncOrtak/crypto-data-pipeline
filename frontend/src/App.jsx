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
import ProtectedRoute from "./components/ui/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Alerts from "./pages/Alerts";
import Analysis from "./pages/Analysis";
import CoinDetail from "./pages/CoinDetail";
import Heatmap from "./pages/Heatmap";
import AIAnalysis from "./pages/AIAnalysis";
import Pricing from "./pages/Pricing";
import Portfolio from "./pages/Portfolio";
import CreateAlert from "./pages/CreateAlert";
import DisclaimerModal from "./components/DisclaimerModal";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import { useWatchlist } from "./hooks/useWatchlist";
import { useMarket } from "./hooks/useMarket";

function AppInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("watchlist");
  const [authOpen, setAuthOpen] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(
    () => !!localStorage.getItem("cryptoneko_disclaimer_accepted_v1"),
  );

  const { isPro, isEnterprise, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (isLoggedIn && window.location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [isLoggedIn]);

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
      {/* Disclaimer — ilk girişte gösterilir, onaylanınca kaybolur */}
      <DisclaimerModal onAccept={() => setDisclaimerAccepted(true)} />

      {location.pathname !== "/" || isLoggedIn ? (
        <Navbar
          onWatchlistOpen={() => openPanel("watchlist")}
          watchlistCount={watchlist.length}
          onAuthOpen={() => setAuthOpen(true)}
          authOpen={authOpen}
          setAuthOpen={setAuthOpen}
        />
      ) : null}
      <main
        style={
          location.pathname === "/" && !isLoggedIn
            ? {}
            : { maxWidth: "1440px", margin: "0 auto", padding: "32px 24px" }
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
                <Landing onAuthOpen={() => setAuthOpen(true)} />
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
                onAuthOpen={() => setAuthOpen(true)}
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
                onAuthOpen={() => setAuthOpen(true)}
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
                onAuthOpen={() => setAuthOpen(true)}
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
                onAuthOpen={() => setAuthOpen(true)}
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
                onAuthOpen={() => setAuthOpen(true)}
              >
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

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
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
