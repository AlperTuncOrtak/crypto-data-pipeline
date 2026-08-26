import React, { useState, useEffect } from "react";
import ReactGridLayout, { Layout } from "react-grid-layout";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LayoutDashboard, Plus, X, Save, AlertCircle } from "lucide-react";

// Widget Components
import HypeRealityWidget from "../components/market/HypeRealityWidget";
import TokenomicsWidget from "../components/market/TokenomicsWidget";
import AIAnalysisBox from "../components/market/AIAnalysisBox";

// CSS for react-grid-layout
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = (ReactGridLayout as any).WidthProvider((ReactGridLayout as any).Responsive);

const WIDGET_LIBRARY = [
  { id: "hype", label: "Hype vs Reality", w: 3, h: 3 },
  { id: "tokenomics", label: "Tokenomics", w: 3, h: 3 },
  { id: "ai", label: "AI Analysis", w: 6, h: 4 },
];

export default function WidgetBuilder() {
  const { user, isPro, isEnterprise } = useAuth();
  const navigate = useNavigate();
  
  const [mounted, setMounted] = useState(false);
  const [layouts, setLayouts] = useState<any>({
    lg: [
      { i: "hype", x: 0, y: 0, w: 3, h: 3 },
      { i: "tokenomics", x: 3, y: 0, w: 3, h: 3 },
    ]
  });
  
  const [activeWidgets, setActiveWidgets] = useState<string[]>(["hype", "tokenomics"]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from local storage if exists
    const saved = localStorage.getItem("neko_dashboard_layouts");
    const savedActive = localStorage.getItem("neko_dashboard_active");
    if (saved) setLayouts(JSON.parse(saved));
    if (savedActive) setActiveWidgets(JSON.parse(savedActive));
  }, []);

  const handleLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

  const saveLayout = () => {
    localStorage.setItem("neko_dashboard_layouts", JSON.stringify(layouts));
    localStorage.setItem("neko_dashboard_active", JSON.stringify(activeWidgets));
    alert("Dashboard layout saved successfully!");
  };

  const addWidget = (id: string) => {
    if (activeWidgets.includes(id)) return;
    const widgetInfo = WIDGET_LIBRARY.find(w => w.id === id);
    if (!widgetInfo) return;

    setActiveWidgets([...activeWidgets, id]);
    setLayouts(prev => ({
      ...prev,
      lg: [
        ...(prev.lg || []),
        { i: id, x: 0, y: 99, w: widgetInfo.w, h: widgetInfo.h }
      ]
    }));
    setShowMenu(false);
  };

  const removeWidget = (id: string) => {
    setActiveWidgets(activeWidgets.filter(w => w !== id));
    setLayouts(prev => ({
      ...prev,
      lg: (prev.lg || []).filter(l => l.i !== id)
    }));
  };

  // PRO Guard
  if (!isPro && !isEnterprise) {
    return (
      <div className="min-h-[100dvh] pt-24 px-6 pb-20 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
          
          <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-purple-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-[var(--text-main)] mb-3">PRO Feature</h2>
          <p className="text-[var(--text-muted)] text-[15px] leading-relaxed mb-8">
            The Customizable Dashboard is exclusive to CryptoNeko PRO members. Upgrade your plan to build your own workspace.
          </p>
          
          <button 
            onClick={() => navigate("/pricing")}
            className="w-full bg-white text-black font-bold py-3.5 rounded-3xl hover:bg-gray-100 transition-colors"
          >
            Upgrade to PRO
          </button>
        </motion.div>
      </div>
    );
  }

  const renderWidget = (id: string) => {
    // We pass generic symbols for demo since this is a customizable board
    switch (id) {
      case "hype": return <HypeRealityWidget symbol="BTC" />;
      case "tokenomics": return <TokenomicsWidget coin={{ symbol: "SOL", circulating_supply: 450000000, total_supply: 500000000 }} />;
      case "ai": return <AIAnalysisBox slug="bitcoin" coinName="Bitcoin" symbol="BTC" brandColor="#f7931a" />;
      default: return <div>Unknown Widget</div>;
    }
  };

  return (
    <div className="min-h-[100dvh] pt-24 px-6 pb-20 w-full">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <LayoutDashboard className="text-purple-400" />
              <h1 className="text-3xl font-bold text-[var(--text-main)]">Widget Builder</h1>
              <div className="px-2 py-0.5 rounded-2xl bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                PRO
              </div>
            </div>
            <p className="text-[var(--text-muted)]">Build your custom command center. Drag to move, pull bottom right corner to resize.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMenu(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-3xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] text-sm font-semibold transition-colors"
            >
              <Plus size={16} /> Add Widget
            </button>
            <button 
              onClick={saveLayout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-3xl bg-purple-600 hover:bg-purple-700 text-[var(--text-main)] text-sm font-semibold transition-colors shadow-[0_0_20px_var(--accent)]"
            >
              <Save size={16} /> Save Layout
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-3xl min-h-[600px] p-4 relative">
          
          {activeWidgets.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <LayoutDashboard size={48} className="mb-4 opacity-50" />
              <p>Your dashboard is empty. Add some widgets to start!</p>
            </div>
          )}

          {mounted && (
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 1, xxs: 1 }}
              rowHeight={100}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
              margin={[20, 20]}
            >
              {activeWidgets.map(id => (
                <div key={id} className="relative group">
                  {/* Drag Handle & Remove Button */}
                  <div className="absolute top-2 right-2 z-50 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="drag-handle cursor-move bg-black/50 backdrop-blur-md p-1.5 rounded-2xl hover:bg-white/20 transition-colors text-[var(--text-main)]">
                      <LayoutDashboard size={14} />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeWidget(id); }}
                      className="bg-black/50 backdrop-blur-md p-1.5 rounded-2xl hover:bg-red-500/80 transition-colors text-[var(--text-main)] cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  {/* Widget Content */}
                  <div className="w-full h-full pointer-events-auto overflow-hidden">
                    {renderWidget(id)}
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>
      </div>

      {/* Add Widget Modal */}
      <AnimatePresence>
        {showMenu && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[var(--bg-base)] border border-[var(--border-base)] rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[var(--text-main)]">Widget Library</h3>
                <button onClick={() => setShowMenu(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {WIDGET_LIBRARY.map(w => (
                  <button 
                    key={w.id}
                    onClick={() => addWidget(w.id)}
                    disabled={activeWidgets.includes(w.id)}
                    className="flex items-center justify-between p-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                  >
                    <div>
                      <div className="text-[var(--text-main)] font-semibold mb-1">{w.label}</div>
                      <div className="text-xs text-[var(--text-muted)]">Default Size: {w.w}x{w.h}</div>
                    </div>
                    {activeWidgets.includes(w.id) ? (
                      <span className="text-xs font-bold text-[var(--positive)] uppercase tracking-wider">Added</span>
                    ) : (
                      <Plus className="text-purple-400" size={20} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
