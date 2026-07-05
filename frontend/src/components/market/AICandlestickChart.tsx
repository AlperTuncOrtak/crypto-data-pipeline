import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, ISeriesApi, SeriesMarker, Time } from 'lightweight-charts';
import { Brain, TrendingUp, TrendingDown, Target, Zap, Waves } from 'lucide-react';
import ProPaywall from '../layout/ProPaywall';
import { motion, AnimatePresence } from 'framer-motion';

interface OHLCData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface AICandlestickChartProps {
  symbol: string;
  data: OHLCData[];
}

export default function AICandlestickChart({ symbol, data }: AICandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  
  const [isAIVision, setIsAIVision] = useState(false);
  const [aiStatus, setAiStatus] = useState("Standby");

  // Format data for volume (mock volume based on high-low spread for demo if not provided)
  const volumeData = data.map(d => {
    const spread = d.high - d.low;
    const isUp = d.close >= d.open;
    return {
      time: d.time,
      value: spread * (Math.random() * 1000 + 500),
      color: isUp ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
    };
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af', // gray-400
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(168, 85, 247, 0.5)', // purple
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: '#7e22ce',
        },
        horzLine: {
          color: 'rgba(168, 85, 247, 0.5)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#7e22ce',
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        autoScale: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      }
    });
    
    chartRef.current = chart;

    // Create Candlestick Series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', // neon green
      downColor: '#ef4444', // neon red
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    
    candleSeries.setData(data);
    seriesRef.current = candleSeries;

    // Create Volume Series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '', // set as an overlay
      scaleMargins: {
        top: 0.8, // highest point of the series will be at 80% from the top
        bottom: 0,
      },
    });
    
    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;

    window.addEventListener('resize', handleResize);
    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  // AI Vision Logic
  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;

    if (isAIVision) {
      setAiStatus("Scanning patterns...");
      
      // 1. Calculate Support and Resistance dynamically based on recent highs/lows
      const prices = data.map(d => d.close);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      
      const resistance = maxPrice * 0.98; // approximate local top zone
      const support = minPrice * 1.02; // approximate local bottom zone

      setTimeout(() => {
        // Draw Resistance Line
        seriesRef.current?.createPriceLine({
          price: resistance,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'AI Resistance',
        });

        // Draw Support Line
        seriesRef.current?.createPriceLine({
          price: support,
          color: '#22c55e',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'AI Support',
        });

        // 2. Add Markers for Anomalies / Whale Buys
        const markers: SeriesMarker<Time>[] = [];
        
        for (let i = 2; i < data.length - 1; i++) {
          const prev = data[i-1];
          const curr = data[i];
          const next = data[i+1];
          
          // Simple AI logic: V-Shape bounce (Support confirmation)
          if (prev.close < prev.open && curr.close > curr.open && curr.low <= support * 1.05) {
            markers.push({
              time: curr.time,
              position: 'belowBar',
              color: '#3b82f6', // blue
              shape: 'arrowUp',
              text: 'Whale Accumulation',
              size: 2
            });
          }
          
          // Simple AI logic: Massive dump (Resistance rejection)
          if (prev.close > prev.open && curr.close < curr.open && curr.high >= resistance * 0.95) {
            markers.push({
              time: curr.time,
              position: 'aboveBar',
              color: '#ef4444',
              shape: 'arrowDown',
              text: 'Overbought Distribution',
              size: 2
            });
          }
        }
        
        seriesRef.current?.setMarkers(markers);
        setAiStatus("Neural mapping complete.");
      }, 800);

    } else {
      // Clear AI Data
      // To remove price lines in lightweight-charts, we'd normally store the object returned by createPriceLine
      // and call removePriceLine. Since we are just hacking it for demo, we can just clear the whole series and redraw.
      
      const currentCandles = seriesRef.current;
      if (currentCandles) {
        chartRef.current.removeSeries(currentCandles);
      }
      
      const newCandleSeries = chartRef.current.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      newCandleSeries.setData(data);
      seriesRef.current = newCandleSeries;
      
      setAiStatus("Standby");
    }
  }, [isAIVision, data]);

  return (
    <ProPaywall featureName="AI Candlestick Vision" inline={true}>
    <div className="relative w-full h-full flex flex-col bg-[#0a0b0d] rounded-2xl overflow-hidden border border-[#273951]/50 shadow-[inset_0_0_40px_rgba(39,57,81,0.1)]">
      
      {/* Chart Header & Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#16181c]/50">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-white font-bold tracking-wider">{symbol.toUpperCase()}/USD</span>
            <span className="text-xs text-gray-500 font-mono">1D Timeframe</span>
          </div>
        </div>

        {/* AI Vision Toggle */}
        <button
          onClick={() => setIsAIVision(!isAIVision)}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden ${
            isAIVision 
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          {isAIVision && (
            <motion.div
              layoutId="ai-glow"
              className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
          <Brain size={16} className={isAIVision ? "animate-pulse" : ""} />
          <span className="relative z-10">AI Vision</span>
          
          <div className={`w-2 h-2 rounded-full ml-1 ${isAIVision ? 'bg-purple-400 shadow-[0_0_10px_#c084fc]' : 'bg-gray-600'}`} />
        </button>
      </div>

      {/* AI HUD Overlay */}
      <AnimatePresence>
        {isAIVision && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-4 z-10 pointer-events-none"
          >
            <div className="bg-[#0a0b0d]/80 backdrop-blur-md border border-purple-500/30 rounded-lg p-3 shadow-xl">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold mb-2">
                <Target size={12} className="animate-spin-slow" />
                <span>{aiStatus}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-400 text-[10px] font-mono">
                  <TrendingUp size={10} /> Support Identified
                </div>
                <div className="flex items-center gap-2 text-red-400 text-[10px] font-mono">
                  <TrendingDown size={10} /> Resistance Mapped
                </div>
                <div className="flex items-center gap-2 text-blue-400 text-[10px] font-mono">
                  <Waves size={10} /> Whale Activity Overlay Active
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanline Effect when AI Vision is on */}
      <AnimatePresence>
        {isAIVision && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          >
            <motion.div 
              animate={{ y: ["-10%", "110%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-full h-32 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The actual chart container */}
      <div 
        ref={chartContainerRef} 
        className="flex-1 w-full min-h-[400px] relative z-0"
        style={{ cursor: isAIVision ? 'crosshair' : 'default' }}
      />
    </div>
    </ProPaywall>
  );
}
