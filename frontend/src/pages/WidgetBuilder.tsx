import React, { useState, useEffect } from "react";
import { ResponsiveGridLayout, useContainerWidth, Layout } from "react-grid-layout";
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

const WIDGET_LIBRARY = [
  { id: "hype", label: "Hype vs Reality", w: 3, h: 3 },
  { id: "tokenomics", label: "Tokenomics", w: 3, h: 3 },
  { id: "ai", label: "AI Analysis", w: 6, h: 4 },
];

export default function WidgetBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [width, widthRef] = useContainerWidth();
  
  const [mounted, setMounted] = useState(false);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
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

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
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
  if (user?.plan !== "pro") {
    return (
      <div className="min-h-screen pt-24 px-6 pb-20 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#121212] border border-white/10 rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
          
          <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-purple-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">PRO Feature</h2>
          <p className="text-gray-400 text-[15px] leading-relaxed mb-8">
            The Customizable Dashboard is exclusive to CryptoNeko PRO members. Upgrade your plan to build your own workspace.
          </p>
          
          <button 
            onClick={() => navigate("/pricing")}
            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors"
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
    <div className="min-h-screen pt-24 px-6 pb-20 w-full">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <LayoutDashboard className="text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Widget Builder</h1>
              <div className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                PRO
              </div>
            </div>
            <p className="text-gray-400">Build your custom command center. Drag to move, pull bottom right corner to resize.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMenu(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1d21] hover:bg-[#22262b] border border-white/5 text-white text-sm font-semibold transition-colors"
            >
              <Plus size={16} /> Add Widget
            </button>
            <button 
              onClick={saveLayout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              <Save size={16} /> Save Layout
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div ref={widthRef} className="bg-[#0a0b0d] border border-white/5 rounded-3xl min-h-[600px] p-4 relative">
          
          {activeWidgets.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <LayoutDashboard size={48} className="mb-4 opacity-50" />
              <p>Your dashboard is empty. Add some widgets to start!</p>
            </div>
          )}

          {mounted && (
            <ResponsiveGridLayout
              className="layout"
              width={width}
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={100}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
              margin={[20, 20]}
            >
              {activeWidgets.map(id => (
                <div key={id} className="relative group">
                  {/* Drag Handle & Remove Button */}
                  <div className="absolute top-2 right-2 z-50 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="drag-handle cursor-move bg-black/50 backdrop-blur-md p-1.5 rounded-md hover:bg-white/20 transition-colors text-white">
                      <LayoutDashboard size={14} />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeWidget(id); }}
                      className="bg-black/50 backdrop-blur-md p-1.5 rounded-md hover:bg-red-500/80 transition-colors text-white cursor-pointer"
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
              className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Widget Library</h3>
                <button onClick={() => setShowMenu(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {WIDGET_LIBRARY.map(w => (
                  <button 
                    key={w.id}
                    onClick={() => addWidget(w.id)}
                    disabled={activeWidgets.includes(w.id)}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#1a1d21] hover:bg-[#22262b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                  >
                    <div>
                      <div className="text-white font-semibold mb-1">{w.label}</div>
                      <div className="text-xs text-gray-400">Default Size: {w.w}x{w.h}</div>
                    </div>
                    {activeWidgets.includes(w.id) ? (
                      <span className="text-xs font-bold text-[#14F195] uppercase tracking-wider">Added</span>
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
