import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { ToastProvider, useAlertMonitor, useToast } from "./hooks/useAlertMonitor.jsx";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import Navbar from "./components/layout/Navbar";
import CoinTicker from "./components/market/CoinTicker";
import RightSidebar from "./components/layout/WatchlistModal";
import ReloadPrompt from "./components/layout/ReloadPrompt";
import Footer from "./components/layout/Footer";
import MobileNav from "./components/layout/MobileNav";
import SwapWidget from "./components/market/SwapWidget";
import { CommandPalette } from "./components/layout/CommandPalette";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/ui/ProtectedRoute";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Market = lazy(() => import("./pages/Market"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Narratives = lazy(() => import("./pages/Narratives"));
const WhaleXRay = lazy(() => import("./pages/WhaleXRay"));
const TimeMachine = lazy(() => import("./pages/TimeMachine"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));

const CoinDetail = lazy(() => import("./pages/CoinDetail"));
const Heatmap = lazy(() => import("./pages/Heatmap"));
const AIAnalysis = lazy(() => import("./pages/AIAnalysis"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Pro = lazy(() => import("./pages/Pro"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CreateAlert = lazy(() => import("./pages/CreateAlert"));
import SearchCommand from "./components/ui/SearchCommand";
import DisclaimerModal from "./components/DisclaimerModal";
const Settings = lazy(() => import("./pages/Settings"));
const Landing = lazy(() => import("./pages/Landing"));
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Documentation from "./pages/Documentation";
import { useWatchlist } from "./hooks/useWatchlist";
import { useMarket } from "./hooks/useMarket";

import AuthModal from "./components/ui/AuthModal";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
import AIChatWidget from "./components/ai/AIChatWidget";

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

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global CMD+K shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Disclaimer — ilk girişte gösterilir, onaylanınca kaybolur */}
      {/* Disclaimer Modal */}
      <DisclaimerModal onAccept={() => setDisclaimerAccepted(true)} />

      {/* Global Ticker */}
      {location.pathname !== "/onboarding" && <CoinTicker />}

      {location.pathname !== "/onboarding" && location.pathname !== "/" && (<><Navbar onWatchlistOpen={() => openPanel("watchlist")} watchlistCount={watchlist.length} onAuthOpen={(mode = "login") => { setAuthMode(mode); setAuthOpen(true); }} authOpen={authOpen} setAuthOpen={setAuthOpen} /></>)}
            {location.pathname !== "/onboarding" && location.pathname !== "/" && (
        <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40">
          <div className="w-[800px] h-[300px] bg-[#533afd] blur-[150px] rounded-[100%] opacity-30 absolute -top-[100px] left-[10%]"></div>
          <div className="w-[600px] h-[250px] bg-[#f96bee] blur-[150px] rounded-[100%] opacity-20 absolute top-[50px] right-[10%]"></div>
        </div>
      )}
      <main
        className={location.pathname === "/" || location.pathname === "/onboarding" ? "pb-20 md:pb-0" : "main-content pb-20 md:pb-0"}
        style={{ position: "relative", zIndex: 20, flex: 1, width: "100%" }}
      >
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#0a0b0d]"><div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div></div>}><Routes><Route path="/onboarding" element={<Onboarding />} /><Route path="/leaderboard" element={<Leaderboard />} />
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
          <Route path="/narratives" element={<Narratives />} />
          <Route path="/whale" element={<WhaleXRay />} />
          <Route path="/timemachine" element={<TimeMachine />} />
          <Route path="/analysis" element={<Analysis />} />

          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/docs" element={<Documentation />} />
          <Route
            path="/pricing"
            element={<Pricing onAuthOpen={() => setAuthOpen(true)} />}
          />
          <Route path="/pro" element={<Pro />} />

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
        </Routes></Suspense></main>
      <SwapWidget />
      {location.pathname !== "/onboarding" && <MobileNav />}
      {location.pathname !== "/onboarding" && <Footer />}

      <AIChatWidget />

      <SearchCommand isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CommandPalette />

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

      <ReloadPrompt />
      <Toaster position="bottom-right" theme="dark" richColors />

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



