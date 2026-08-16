import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ArrowRight, ShieldAlert, Activity, GitBranch } from "lucide-react";
import { analyzeChartMock, AnalystResponse } from "../services/aiAnalystService";

export default function TradingViewAnalyst() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AnalystResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Risk Calculator State
  const [entry, setEntry] = useState<string>("");
  const [stop, setStop] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const [riskPercent, setRiskPercent] = useState<string>("1");
  const [accountSize, setAccountSize] = useState<string>("10000");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setIsScanning(true);

      try {
        const response = await analyzeChartMock(selectedFile);
        setResult(response);
      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      setResult(null);
      setIsScanning(true);

      try {
        const response = await analyzeChartMock(droppedFile);
        setResult(response);
      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const clearUpload = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setIsScanning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Risk Math
  const entryNum = parseFloat(entry);
  const stopNum = parseFloat(stop);
  const targetNum = parseFloat(target);
  const accountNum = parseFloat(accountSize);
  const riskNum = parseFloat(riskPercent);

  let positionSize = 0;
  let rrRatio = 0;
  let isValidCalc = false;

  if (entryNum && stopNum && accountNum && riskNum) {
    const riskAmount = accountNum * (riskNum / 100);
    const priceRisk = Math.abs(entryNum - stopNum);
    positionSize = riskAmount / priceRisk;
    
    if (targetNum) {
      const reward = Math.abs(targetNum - entryNum);
      rrRatio = reward / priceRisk;
    }
    isValidCalc = true;
  }

  const isSetupValid = result?.setupMatch.isMatched;

  return (
    <div className="flex-1 overflow-y-auto pt-6 px-4 pb-24 md:pb-6 relative w-full">
      <div className="max-w-6xl mx-auto flex flex-col h-full gap-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-main)]">
            TradingView OS
          </h1>
          <p className="text-sm md:text-base text-[var(--text-muted)] max-w-2xl">
            Upload your chart. We scan the structure, levels, setup match, and invalidation points against your strict 1% risk rules. We never decide for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Scanner */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`relative flex-1 min-h-[300px] md:min-h-[400px] border border-[var(--border-subtle)] rounded-3xl overflow-hidden bg-[var(--bg-elevated)] transition-colors ${!file ? "hover:border-[var(--text-muted)] cursor-pointer" : ""}`}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              {!file && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-[var(--text-muted)]">
                    <Upload size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Drop chart here</h3>
                  <p className="text-sm text-[var(--text-muted)]">or click to browse</p>
                </div>
              )}

              {previewUrl && (
                <div className="absolute inset-0">
                  <img src={previewUrl} alt="Chart Preview" className="w-full h-full object-cover opacity-60" />
                  
                  {isScanning && (
                    <>
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                        <span className="text-sm font-mono tracking-widest text-white uppercase">Scanning Structure...</span>
                      </div>
                      <motion.div 
                        initial={{ top: 0 }}
                        animate={{ top: "100%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,113,0.5)] z-10"
                      />
                    </>
                  )}

                  {!isScanning && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); clearUpload(); }}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Risk Calculator */}
            <div className="border border-[var(--border-subtle)] bg-[var(--bg-base)] rounded-3xl p-6">
              <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">Risk Calculator</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Account ($)</label>
                  <input type="number" value={accountSize} onChange={e => setAccountSize(e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Risk (%)</label>
                  <input type="number" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-white/20" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Entry</label>
                  <input type="number" value={entry} onChange={e => setEntry(e.target.value)} placeholder="0.00" className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Stop</label>
                  <input type="number" value={stop} onChange={e => setStop(e.target.value)} placeholder="0.00" className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">Target</label>
                  <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="0.00" className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-white/20" />
                </div>
              </div>

              {isValidCalc && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-muted)]">Position Size (Units)</span>
                    <span className="text-sm font-mono font-bold text-[var(--text-main)]">{positionSize.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-muted)]">Risk Amount</span>
                    <span className="text-sm font-mono font-bold text-red-400">${(accountNum * (riskNum / 100)).toFixed(2)}</span>
                  </div>
                  {targetNum > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-1">
                      <span className="text-sm text-[var(--text-muted)]">R:R Ratio</span>
                      <span className={`text-sm font-mono font-bold ${rrRatio >= 2 ? 'text-emerald-400' : 'text-orange-400'}`}>
                        1 : {rrRatio.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {targetNum > 0 && rrRatio < 2 && (
                    <div className="text-xs text-orange-400 mt-2 flex items-center gap-1 bg-orange-400/10 p-2 rounded-lg">
                      <ShieldAlert size={12} />
                      Warning: R:R is under 1:2 strict rule.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: 4-Step Analysis Results */}
          <div className="lg:col-span-7 flex flex-col h-full gap-6">
            {!result && !isScanning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-[var(--border-subtle)] rounded-3xl border-dashed bg-white/[0.01]">
                <Activity size={32} className="text-[var(--text-muted)] opacity-50 mb-4" />
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Waiting for Chart</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">Upload a screenshot to run the 4-step TradingView OS analysis against your rules.</p>
              </div>
            )}

            {isScanning && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-[var(--border-subtle)] rounded-3xl bg-white/[0.02]">
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-sm font-mono tracking-widest text-[var(--text-muted)] uppercase">Analyzing...</p>
              </div>
            )}

            {result && !isScanning && (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-6"
                >
                  
                  {/* Step 1 & 2: Structure and Setup */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-[var(--border-subtle)] bg-[var(--bg-base)] p-6 rounded-3xl">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">Step 1: Structure</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${result.structure.trend === 'bullish' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : result.structure.trend === 'bearish' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-[var(--text-main)] border-white/10'}`}>
                          {result.structure.trend}
                        </div>
                      </div>
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {result.structure.description}
                      </p>
                    </div>

                    <div className="border border-[var(--border-subtle)] bg-[var(--bg-base)] p-6 rounded-3xl relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none opacity-20 ${isSetupValid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">Step 2: Setup Match</span>
                          <span className={`text-xl font-mono font-bold ${isSetupValid ? 'text-emerald-400' : 'text-red-400'}`}>
                            {result.setupMatch.score}/10
                          </span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border mb-3 ${isSetupValid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {isSetupValid ? 'Valid Setup' : 'Invalid Setup'}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                          {result.setupMatch.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Levels */}
                  <div className="border border-[var(--border-subtle)] bg-[var(--bg-base)] p-6 rounded-3xl">
                    <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase mb-6 block">Step 3: Key Levels</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-4 border-b border-red-500/10 pb-2">Resistance</h4>
                        <div className="flex flex-col gap-3">
                          {result.levels.resistance.map((lvl, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-sm font-mono text-[var(--text-main)]">${lvl.price.toLocaleString()}</span>
                              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{lvl.tests} Tests</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 border-b border-emerald-500/10 pb-2">Support</h4>
                        <div className="flex flex-col gap-3">
                          {result.levels.support.map((lvl, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-sm font-mono text-[var(--text-main)]">${lvl.price.toLocaleString()}</span>
                              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{lvl.tests} Tests</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Invalidation */}
                  <div className="border border-[var(--border-subtle)] bg-[var(--bg-base)] p-6 rounded-3xl">
                    <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase mb-4 block">Step 4: Invalidation</span>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Stop Loss At</span>
                        <span className="text-lg font-mono font-bold text-orange-400">${result.invalidation.price.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)] flex-1 leading-relaxed">
                        {result.invalidation.description}
                      </p>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="mt-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-center">
                    <p className="text-xs text-orange-400/80 leading-relaxed max-w-2xl mx-auto">
                      {result.disclaimer}
                    </p>
                  </div>

                </motion.div>
              </AnimatePresence>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
