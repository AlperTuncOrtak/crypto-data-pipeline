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
import GlobalSidebar from "./components/layout/GlobalSidebar";
import TopHeader from "./components/layout/TopHeader";
import CoinTicker from "./components/market/CoinTicker";
import RightSidebar from "./components/layout/WatchlistModal";
import ReloadPrompt from "./components/layout/ReloadPrompt";
import Footer from "./components/layout/Footer";
import MobileNav from "./components/layout/MobileNav";
import { Navigate } from "react-router-dom";

import { Toaster } from "sonner";
import ProtectedRoute from "./components/ui/ProtectedRoute";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Market = lazy(() => import("./pages/Market"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Swap = lazy(() => import("./pages/Swap"));
const WidgetBuilder = lazy(() => import("./pages/WidgetBuilder"));

const CoinDetail = lazy(() => import("./pages/CoinDetail"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Pro = lazy(() => import("./pages/Pro"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CreateAlert = lazy(() => import("./pages/CreateAlert"));
import SearchCommand from "./components/ui/SearchCommand";
import DisclaimerModal from "./components/DisclaimerModal";
const Settings = lazy(() => import("./pages/Settings"));
const Support = lazy(() => import("./pages/Support"));
const Landing = lazy(() => import("./pages/Landing"));
const Success = lazy(() => import("./pages/Success"));
const Cancel = lazy(() => import("./pages/Cancel"));
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Documentation from "./pages/Documentation";
import { useWatchlist } from "./hooks/useWatchlist";
import { useMarket } from "./hooks/useMarket";

import AuthModal from "./components/ui/AuthModal";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
import AIChatWidget from "./components/ai/AIChatWidget";

import { usePushNotifications } from "./hooks/usePushNotifications";

function AppInner() {
  usePushNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("watchlist");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(
    () => !!localStorage.getItem("cryptoneko_disclaimer_accepted_v2"),
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

  // Global redirect for /admin
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      window.location.href = 'https://www.egm.gov.tr/';
    }
  }, [location.pathname]);

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

  // Custom event to trigger login modal from anywhere
  useEffect(() => {
    const handleOpenLogin = () => {
      setAuthMode("login");
      setAuthOpen(true);
    };
    window.addEventListener('open-login', handleOpenLogin);
    return () => window.removeEventListener('open-login', handleOpenLogin);
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
        overflow: "hidden",
        display: "flex",
      }}
    >
      <DisclaimerModal onAccept={() => setDisclaimerAccepted(true)} />

      {location.pathname !== "/onboarding" && location.pathname !== "/" && location.pathname !== "/terminal" && (
        <GlobalSidebar 
          onSearchOpen={() => setIsSearchOpen(true)} 
          onAuthOpen={() => {
            setAuthMode("login");
            setAuthOpen(true);
          }}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        {location.pathname !== "/onboarding" && location.pathname !== "/" && location.pathname !== "/terminal" && (
          <TopHeader onMobileMenuToggle={() => setSidebarOpen(true)} />
        )}

        {location.pathname !== "/onboarding" && location.pathname !== "/terminal" && <CoinTicker />}

        {location.pathname !== "/onboarding" && location.pathname !== "/" && location.pathname !== "/terminal" && (
          <div className="absolute top-0 left-0 right-0 h-[500px] pointer-events-none z-0 overflow-hidden flex justify-center opacity-40">
            <div className="w-[800px] h-[300px] bg-white blur-[150px] rounded-[100%] opacity-5 absolute -top-[100px] left-[10%]"></div>
            <div className="w-[600px] h-[250px] bg-white blur-[150px] rounded-[100%] opacity-5 absolute top-[50px] right-[10%]"></div>
          </div>
        )}

        <main
          className={location.pathname === "/" || location.pathname === "/onboarding" ? "flex-1 overflow-y-auto overflow-x-hidden relative z-20 pb-24 md:pb-0 flex flex-col" : "flex-1 overflow-y-auto overflow-x-hidden relative z-20 pb-24 md:pb-0 main-content flex flex-col"}
        >
          <div className="flex-1 shrink-0 flex flex-col w-full">
            <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-[var(--bg-base)]"><div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div></div>}>
              <Routes>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/swap" element={<Swap />} />
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
                  <Dashboard />
                }
              />
              <Route
                path="/market"
                element={
                  <Market />
                }
              />
              <Route path="/coin/:slug" element={<CoinDetail />} />

              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/docs" element={<Documentation />} />
              <Route
                path="/pricing"
                element={<Pricing onAuthOpen={() => setAuthOpen(true)} />}
              />
              <Route path="/pro" element={<Pro />} />
              <Route path="/success" element={<Success />} />
              <Route path="/cancel" element={<Cancel />} />

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
                path="/dashboard/builder"
                element={
                  <ProtectedRoute
                    requirePro
                    featureName="Customizable Dashboard"
                    onAuthOpen={() => {
                      setAuthMode("login");
                      setAuthOpen(true);
                    }}
                  >
                    <WidgetBuilder />
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
                    <Settings onAuthOpen={() => {
                      setAuthMode("login");
                      setAuthOpen(true);
                    }} />
                  } 
                />
                <Route 
                  path="/support" 
                  element={<Support />} 
                />
            </Routes>
            </Suspense>
          </div>
          {location.pathname !== "/onboarding" && location.pathname !== "/" && location.pathname !== "/terminal" && (
            <div className="shrink-0 w-full mt-auto">
              <Footer />
            </div>
          )}
        </main>
      </div>
      
      {location.pathname !== "/onboarding" && location.pathname !== "/terminal" && <MobileNav />}

      <AIChatWidget />


      <SearchCommand isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

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



