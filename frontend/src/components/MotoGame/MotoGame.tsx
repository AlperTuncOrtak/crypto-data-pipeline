import React, { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";
import { supabase } from "../../lib/supabase";
import "./MotoGame.css";

interface MotoGameProps {
  ohlcData: { time: number; open: number; high: number; low: number; close: number }[];
  symbol: string;
  coinId: string;
}

interface LeaderboardEntry {
  id: number;
  player_name: string;
  distance_meters: number;
  time_seconds: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number;
}

const CATMULL_POINTS = 10;
const SEGMENT_WIDTH = 40;

function smoothOHLC(ohlc: any[], window = 5) {
  const res = [];
  for (let i = 0; i < ohlc.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      sum += ohlc[j].close;
      count++;
    }
    res.push({ ...ohlc[i], smoothed: sum / count });
  }
  return res;
}

export default function MotoGame({ ohlcData, symbol, coinId }: MotoGameProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // HUD Refs (for high-perf DOM updates without React re-renders)
  const distHudRef = useRef<HTMLDivElement>(null);
  const speedHudRef = useRef<HTMLDivElement>(null);
  const timeHudRef = useRef<HTMLDivElement>(null);
  
  const [gameState, setGameState] = useState<"idle" | "playing" | "crashed">("idle");
  const stateRef = useRef<"idle" | "playing" | "crashed">("idle");
  
  const [distance, setDistance] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myScoreId, setMyScoreId] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  // Matter.js Refs
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bikeRef = useRef<{ chassis: Matter.Body; wheelA: Matter.Body; wheelB: Matter.Body; } | null>(null);
  
  const terrainBodiesRef = useRef<Matter.Body[]>([]);
  const isPositiveRef = useRef(true);
  const basePointsRef = useRef<{ x: number, y: number }[]>([]);
  const chunkIndexRef = useRef(0);

  const keys = useRef<{ [key: string]: boolean }>({});
  const particlesRef = useRef<Particle[]>([]);
  
  // Game loop tracking
  const cameraX = useRef(0);
  const cameraY = useRef(0);
  const currentScale = useRef(1.0);
  const shakeRef = useRef(0);
  const startTime = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem(`moto_best_${coinId}`);
    if (saved) setBestScore(parseInt(saved, 10));
    
    supabase.from("motogame_scores").select("*").eq("coin_id", coinId)
      .order("distance_meters", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setLeaderboard(data as LeaderboardEntry[]); });
  }, [coinId]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const ku = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  const generateTerrainChunk = useCallback((chunkIdx: number, engine: Matter.Engine) => {
    if (ohlcData.length < 2) return;
    
    let h = 360;
    if (wrapperRef.current) h = wrapperRef.current.clientHeight;
    const baseHeight = h * 0.6;
    const TOP = baseHeight - 150;
    const BOTTOM = baseHeight + 150;

    const smoothedData = smoothOHLC(ohlcData, 5);
    const minP = Math.min(...smoothedData.map(d => d.smoothed));
    const maxP = Math.max(...smoothedData.map(d => d.smoothed));
    const range = (maxP - minP) || 1;

    const localPts = smoothedData.map((d, i) => {
      const norm = (d.smoothed - minP) / range;
      const y = BOTTOM - norm * (BOTTOM - TOP);
      const x = i * SEGMENT_WIDTH * CATMULL_POINTS;
      return { x, y };
    });

    const startXOffset = chunkIdx * localPts[localPts.length - 1].x;
    const newPoints: {x:number, y:number}[] = [];

    // Cosine interpolation for smooth terrain
    for (let i = 0; i < localPts.length - 1; i++) {
      const p1 = localPts[i];
      const p2 = localPts[i + 1];
      for (let j = 0; j < CATMULL_POINTS; j++) {
        const t = j / CATMULL_POINTS;
        const t2 = (1 - Math.cos(t * Math.PI)) / 2;
        const y = p1.y * (1 - t2) + p2.y * t2;
        const x = p1.x + (p2.x - p1.x) * t;
        newPoints.push({ x: x + startXOffset, y });
      }
    }
    
    const lastP = localPts[localPts.length - 1];
    newPoints.push({ x: lastP.x + startXOffset, y: lastP.y });
    basePointsRef.current.push(...newPoints);

    // Matter.js static bodies
    const chunkBodies: Matter.Body[] = [];
    for (let i = 0; i < newPoints.length - 1; i++) {
      const p1 = newPoints[i];
      const p2 = newPoints[i + 1];
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      
      const rect = Matter.Bodies.rectangle(cx, cy, length + 2, 60, {
        isStatic: true,
        angle: angle,
        friction: 0.8,
        restitution: 0.1,
      });
      chunkBodies.push(rect);
    }

    Matter.World.add(engine.world, chunkBodies);
    terrainBodiesRef.current.push(...chunkBodies);
    isPositiveRef.current = smoothedData[smoothedData.length - 1].close >= smoothedData[0].close;
  }, [ohlcData]);

  const handleStart = useCallback(() => {
    if (!canvasRef.current || !wrapperRef.current) return;
    
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
    }

    const w = wrapperRef.current.clientWidth;
    const h = wrapperRef.current.clientHeight;
    canvasRef.current.width = w;
    canvasRef.current.height = h;

    const engine = Matter.Engine.create();
    engine.world.gravity.y = 1.2;
    engineRef.current = engine;

    basePointsRef.current = [];
    terrainBodiesRef.current = [];
    particlesRef.current = [];
    chunkIndexRef.current = 0;
    cameraX.current = 0;
    cameraY.current = h * 0.5;
    currentScale.current = 1.0;
    shakeRef.current = 0;

    generateTerrainChunk(0, engine);
    generateTerrainChunk(1, engine);

    const startX = 100;
    const startY = basePointsRef.current[0].y - 100;
    const group = Matter.Body.nextGroup(true);
    
    const chassis = Matter.Bodies.rectangle(startX, startY, 40, 15, {
      collisionFilter: { group }, frictionAir: 0.02, density: 0.002
    });

    const wheelOpts = { collisionFilter: { group }, friction: 0.9, restitution: 0.1, density: 0.005 };
    const wheelA = Matter.Bodies.circle(startX - 20, startY + 15, 12, wheelOpts);
    const wheelB = Matter.Bodies.circle(startX + 20, startY + 15, 12, wheelOpts);

    const axelA = Matter.Constraint.create({
      bodyA: chassis, bodyB: wheelA, pointA: { x: -20, y: 10 }, stiffness: 0.15, damping: 0.3, length: 15
    });
    const axelB = Matter.Constraint.create({
      bodyA: chassis, bodyB: wheelB, pointA: { x: 20, y: 10 }, stiffness: 0.15, damping: 0.3, length: 15
    });

    Matter.World.add(engine.world, [chassis, wheelA, wheelB, axelA, axelB]);
    bikeRef.current = { chassis, wheelA, wheelB };

    Matter.Events.on(engine, "collisionStart", (event) => {
      if (stateRef.current !== "playing") return;
      const { pairs } = event;
      
      let hardImpact = false;
      for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];
        if (bodyA === chassis || bodyB === chassis) {
          const angle = Math.abs(chassis.angle % (Math.PI * 2));
          if (angle > 1.2 && angle < 5.0) {
            triggerCrash();
          } else {
            hardImpact = true; // Bottom hit
          }
        }
      }
      
      if (hardImpact && chassis.velocity.y > 5) {
        shakeRef.current = Math.min(chassis.velocity.y * 2, 15);
        // Emits sparks
        for(let i=0; i<15; i++) {
          particlesRef.current.push({
            x: chassis.position.x, y: chassis.position.y + 10,
            vx: (Math.random()-0.5)*10, vy: -Math.random()*5,
            life: 20, maxLife: 20, color: "#facc15", size: 2 + Math.random()*2
          });
        }
      }
    });

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    setGameState("playing");
    stateRef.current = "playing";
    setDistance(0);
    setElapsedSec(0);
    setSubmitted(false);
    setNickname("");
    setMyScoreId(null);
    startTime.current = performance.now();
    
    rafRef.current = requestAnimationFrame(renderLoop);
  }, [generateTerrainChunk]);

  useEffect(() => {
    const t = setTimeout(() => { if (stateRef.current === "idle") handleStart(); }, 100);
    return () => clearTimeout(t);
  }, [handleStart]);

  const triggerCrash = () => {
    if (stateRef.current === "crashed") return;
    stateRef.current = "crashed";
    setGameState("crashed");
    shakeRef.current = 20; // Big shake
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 600);
    
    if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
    
    if (bikeRef.current) {
      const finalDist = Math.max(0, Math.floor(bikeRef.current.chassis.position.x / 10));
      setDistance(finalDist);
      const finalSec = Math.round((performance.now() - startTime.current) / 1000);
      setElapsedSec(finalSec);
      
      setBestScore(prev => {
        if (finalDist > prev) {
          localStorage.setItem(`moto_best_${coinId}`, String(finalDist));
          return finalDist;
        }
        return prev;
      });

      // Explosion particles
      const { chassis } = bikeRef.current;
      for(let i=0; i<50; i++) {
        particlesRef.current.push({
          x: chassis.position.x, y: chassis.position.y,
          vx: (Math.random()-0.5)*20, vy: (Math.random()-0.5)*20,
          life: 60, maxLife: 60, color: "#e74c3c", size: 3 + Math.random()*4
        });
      }
    }
  };

  const renderLoop = (time: number) => {
    if (!canvasRef.current || !wrapperRef.current || !engineRef.current || !bikeRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const engine = engineRef.current;
    const { chassis, wheelA, wheelB } = bikeRef.current;

    const currDist = Math.max(0, Math.floor(chassis.position.x / 10));
    const speed = Math.abs(wheelA.angularVelocity * 10).toFixed(0);
    const elapsed = stateRef.current === "crashed" ? elapsedSec : Math.round((time - startTime.current) / 1000);

    // Update HUD React DOM directly for perf
    if (distHudRef.current) distHudRef.current.innerText = `${currDist}m`;
    if (speedHudRef.current) speedHudRef.current.innerText = `${speed} KM/H`;
    if (timeHudRef.current) timeHudRef.current.innerText = `${elapsed}s`;

    if (stateRef.current === "playing") {
      const k = keys.current;
      if (k["w"] || k["arrowup"]) {
        Matter.Body.setAngularVelocity(wheelA, wheelA.angularVelocity + 0.05);
        if (Math.random() > 0.5) {
          particlesRef.current.push({
            x: wheelA.position.x, y: wheelA.position.y + 10,
            vx: -wheelA.velocity.x * 0.5 + (Math.random()-0.5)*2, vy: -1 - Math.random()*2,
            life: 30, maxLife: 30, color: "rgba(255,255,255,0.2)", size: 3 + Math.random()*4
          });
        }
      }
      if (k["s"] || k["arrowdown"]) Matter.Body.setAngularVelocity(wheelA, wheelA.angularVelocity - 0.05);
      if (k["a"] || k["arrowleft"]) Matter.Body.setAngularVelocity(chassis, chassis.angularVelocity - 0.02);
      if (k["d"] || k["arrowright"]) Matter.Body.setAngularVelocity(chassis, chassis.angularVelocity + 0.02);

      if (chassis.position.y > h + 600) triggerCrash();

      const lastPt = basePointsRef.current[basePointsRef.current.length - 1];
      if (chassis.position.x > lastPt.x - w * 2) {
        chunkIndexRef.current += 1;
        generateTerrainChunk(chunkIndexRef.current, engine);
        const keepThreshold = chassis.position.x - w * 2;
        const trimIdx = basePointsRef.current.findIndex(p => p.x > keepThreshold);
        if (trimIdx > 0) basePointsRef.current = basePointsRef.current.slice(trimIdx);
        const bodiesToRemove = terrainBodiesRef.current.filter(b => b.position.x < keepThreshold);
        if (bodiesToRemove.length > 0) {
          Matter.World.remove(engine.world, bodiesToRemove);
          terrainBodiesRef.current = terrainBodiesRef.current.filter(b => b.position.x >= keepThreshold);
        }
      }
    }

    // Camera Lerp & Zoom
    const targetCamX = chassis.position.x - w * 0.3;
    cameraX.current += (targetCamX - cameraX.current) * 0.1;
    cameraX.current = Math.max(0, cameraX.current);
    
    const targetCamY = chassis.position.y - h * 0.6;
    cameraY.current += (targetCamY - cameraY.current) * 0.1;

    // Zoom out based on speed
    const vSpeed = Math.abs(chassis.velocity.x);
    const targetScale = 1.0 - Math.min(vSpeed / 40, 0.3); // Min scale 0.7
    currentScale.current += (targetScale - currentScale.current) * 0.05;

    ctx.save();
    
    // Background (Navy Deep)
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);

    // Apply Camera Transform
    ctx.translate(w/2, h/2);
    ctx.scale(currentScale.current, currentScale.current);
    ctx.translate(-w/2, -h/2);

    if (shakeRef.current > 0) {
      ctx.translate((Math.random()-0.5)*shakeRef.current, (Math.random()-0.5)*shakeRef.current);
      shakeRef.current *= 0.9;
      if (shakeRef.current < 0.5) shakeRef.current = 0;
    }

    ctx.translate(-cameraX.current, -cameraY.current);

    // Parallax Grid Background
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const gridCell = 100;
    const startXOffset = Math.floor(cameraX.current / gridCell) * gridCell;
    const startYOffset = Math.floor(cameraY.current / gridCell) * gridCell;
    
    ctx.beginPath();
    for (let x = startXOffset - w; x < startXOffset + w*2; x += gridCell) {
      ctx.moveTo(x, startYOffset - h); ctx.lineTo(x, startYOffset + h*2);
    }
    for (let y = startYOffset - h; y < startYOffset + h*2; y += gridCell) {
      ctx.moveTo(startXOffset - w, y); ctx.lineTo(startXOffset + w*2, y);
    }
    ctx.stroke();

    // Terrain
    const chartColor = isPositiveRef.current ? "#2ecc71" : "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(cameraX.current - w, cameraY.current + h * 2);
    
    let first = true;
    for (const p of basePointsRef.current) {
      if (p.x > cameraX.current - w && p.x < cameraX.current + w * 2) {
        if (first) { ctx.lineTo(p.x, p.y); first = false; }
        else { ctx.lineTo(p.x, p.y); }
      }
    }
    const lastDrawnX = basePointsRef.current[basePointsRef.current.length-1]?.x || cameraX.current + w;
    ctx.lineTo(lastDrawnX, cameraY.current + h * 2);
    ctx.closePath();
    
    // Fill Gradient
    const grad = ctx.createLinearGradient(0, cameraY.current, 0, cameraY.current + h);
    grad.addColorStop(0, chartColor + "44");
    grad.addColorStop(1, chartColor + "00");
    ctx.fillStyle = grad;
    ctx.fill();

    // Terrain Line
    ctx.beginPath();
    first = true;
    for (const p of basePointsRef.current) {
      if (p.x > cameraX.current - w && p.x < cameraX.current + w * 2) {
        if (first) { ctx.moveTo(p.x, p.y); first = false; }
        else { ctx.lineTo(p.x, p.y); }
      }
    }
    ctx.strokeStyle = chartColor;
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Draw Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx; p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Bike (Modern Cyber-Cycle)
    const crashed = stateRef.current === "crashed";
    const primaryColor = crashed ? "#e74c3c" : "#00f0ff";

    ctx.save();
    ctx.translate(chassis.position.x, chassis.position.y);
    ctx.rotate(chassis.angle);

    // Chassis Body
    ctx.fillStyle = "rgba(20, 25, 40, 0.9)";
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(15, -5);
    ctx.lineTo(20, 5);
    ctx.lineTo(-15, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rider Abstract Geometric Shape
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, -20); ctx.lineTo(12, -12); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(10, -25, 6, 0, Math.PI*2); ctx.fillStyle = primaryColor; ctx.fill(); // Helmet

    ctx.restore();

    // Wheels
    const drawWheel = (body: Matter.Body) => {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      
      // Tire
      ctx.fillStyle = "#111827";
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      
      // Rim detail
      ctx.fillStyle = primaryColor;
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
      
      ctx.lineWidth = 2;
      for(let i=0; i<3; i++) {
        ctx.rotate(Math.PI*2/3);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(10,0); ctx.stroke();
      }
      ctx.restore();
    };

    drawWheel(wheelA);
    drawWheel(wheelB);

    ctx.restore();

    if (stateRef.current !== "crashed") {
      rafRef.current = requestAnimationFrame(renderLoop);
    }
  };

  const handleRestart = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    handleStart();
  }, [handleStart]);

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    const name = nickname.trim() || "Anonymous";
    await supabase.from("motogame_scores").insert({
      coin_id: coinId,
      symbol,
      player_name: name,
      distance_meters: distance,
      time_seconds: elapsedSec,
    });
    const { data } = await supabase.from("motogame_scores").select("*").eq("coin_id", coinId).order("distance_meters", { ascending: false }).limit(10);
    if (data) {
      setLeaderboard(data as LeaderboardEntry[]);
      const myRow = data.find(r => r.player_name === name && r.distance_meters === distance);
      if (myRow) setMyScoreId(myRow.id);
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="motogame-container">
      <div
        className={`motogame-wrapper ${shaking ? "shake" : ""}`}
        ref={wrapperRef}
        onTouchStart={(e) => { e.preventDefault(); keys.current["w"] = true; }}
        onTouchEnd={(e) => { e.preventDefault(); keys.current["w"] = false; }}
      >
        <canvas ref={canvasRef} className="motogame-canvas" />

        {/* --- REACT HUD OVERLAY (Glassmorphism) --- */}
        {gameState !== "idle" && (
          <div className="motogame-hud-overlay">
            <div className="motogame-hud-panel">
              <span className="motogame-hud-label">COIN: {symbol}</span>
              <div className="flex gap-4">
                <div>
                  <span className="motogame-hud-label">Distance</span>
                  <div className="motogame-hud-value" ref={distHudRef}>0m</div>
                </div>
                <div>
                  <span className="motogame-hud-label">Time</span>
                  <div className="motogame-hud-value" ref={timeHudRef}>0s</div>
                </div>
              </div>
            </div>
            <div className="motogame-hud-panel right">
              <span className="motogame-hud-label">Speed</span>
              <div className="motogame-hud-value accent" ref={speedHudRef}>0 KM/H</div>
            </div>
          </div>
        )}

        {showFlash && <div className="motogame-crash-flash" />}

        {gameState === "crashed" && (
          <div className="motogame-idle-overlay crashed-overlay">
            <div className="motogame-idle-card z-20">
              <h2 className="motogame-title text-red-500">💥 WIPEOUT!</h2>
              <p className="motogame-subtitle">
                You rode <strong className="text-white">{distance}m</strong> in <strong className="text-white">{elapsedSec}s</strong>.
              </p>

              {!submitted ? (
                <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
                  <input
                    type="text"
                    placeholder="Enter nickname..."
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={15}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-accent transition-colors"
                  />
                  <button onClick={handleSubmit} disabled={submitting} className="motogame-start-btn">
                    {submitting ? "Submitting..." : "Submit Score"}
                  </button>
                </div>
              ) : (
                <p className="text-green-400 font-semibold mt-4">Score Submitted!</p>
              )}

              <div className="mt-6 w-full max-w-xs">
                <h3 className="text-sm text-slate-400 mb-2 font-semibold">LEADERBOARD ({symbol})</h3>
                <div className="bg-slate-900/50 rounded-lg border border-slate-800 flex flex-col overflow-hidden max-h-48 overflow-y-auto">
                  {leaderboard.map((entry, idx) => (
                    <div key={entry.id} className={`flex justify-between px-3 py-2 text-xs border-b border-slate-800 last:border-0 ${entry.id === myScoreId ? "bg-accent/20 text-accent font-bold" : "text-slate-300"}`}>
                      <span>{idx + 1}. {entry.player_name}</span>
                      <span>{entry.distance_meters}m</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <div className="px-3 py-4 text-xs text-slate-500 text-center">No scores yet. Be the first!</div>
                  )}
                </div>
              </div>

              <button className="motogame-start-btn mt-6" onClick={handleRestart}>
                🔄 Ride Again
              </button>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <div className="motogame-mobile-controls">
            <div className="control-group">
              <button className="control-btn" onPointerDown={(e)=>{e.preventDefault(); keys.current["a"]=true;}} onPointerUp={(e)=>{e.preventDefault(); keys.current["a"]=false;}}>↶</button>
              <button className="control-btn" onPointerDown={(e)=>{e.preventDefault(); keys.current["d"]=true;}} onPointerUp={(e)=>{e.preventDefault(); keys.current["d"]=false;}}>↷</button>
            </div>
            <div className="control-group">
              <button className="control-btn brake" onPointerDown={(e)=>{e.preventDefault(); keys.current["s"]=true;}} onPointerUp={(e)=>{e.preventDefault(); keys.current["s"]=false;}}>Brake</button>
              <button className="control-btn gas" onPointerDown={(e)=>{e.preventDefault(); keys.current["w"]=true;}} onPointerUp={(e)=>{e.preventDefault(); keys.current["w"]=false;}}>Gas</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
