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
  const [shaking, setShaking] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Matter.js Refs
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bikeRef = useRef<{
    chassis: Matter.Body;
    wheelA: Matter.Body;
    wheelB: Matter.Body;
  } | null>(null);
  
  const terrainBodiesRef = useRef<Matter.Body[]>([]);
  const isPositiveRef = useRef(true);
  const basePointsRef = useRef<{ x: number, y: number }[]>([]);
  const chunkIndexRef = useRef(0);

  const keys = useRef<{ [key: string]: boolean }>({});
  
  // Game loop tracking
  const cameraX = useRef(0);
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

    // Normalizing
    const localPts = smoothedData.map((d, i) => {
      const norm = (d.smoothed - minP) / range;
      const y = BOTTOM - norm * (BOTTOM - TOP);
      const x = i * SEGMENT_WIDTH * CATMULL_POINTS;
      return { x, y };
    });

    const startXOffset = chunkIdx * localPts[localPts.length - 1].x;
    const newPoints: {x:number, y:number}[] = [];

    // Cosine interpolation
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
    
    // Add the last point
    const lastP = localPts[localPts.length - 1];
    newPoints.push({ x: lastP.x + startXOffset, y: lastP.y });

    basePointsRef.current.push(...newPoints);

    // Create Matter.js bodies for this chunk
    const chunkBodies: Matter.Body[] = [];
    for (let i = 0; i < newPoints.length - 1; i++) {
      const p1 = newPoints[i];
      const p2 = newPoints[i + 1];
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      
      const rect = Matter.Bodies.rectangle(cx, cy, length + 2, 40, {
        isStatic: true,
        angle: angle,
        friction: 0.8,
        restitution: 0.1,
        render: { visible: false }
      });
      chunkBodies.push(rect);
    }

    Matter.World.add(engine.world, chunkBodies);
    terrainBodiesRef.current.push(...chunkBodies);
    isPositiveRef.current = smoothedData[smoothedData.length - 1].close >= smoothedData[0].close;
  }, [ohlcData]);

  const handleStart = useCallback(() => {
    if (!canvasRef.current || !wrapperRef.current) return;
    
    // Cleanup old engine if exists
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
    }

    const w = wrapperRef.current.clientWidth;
    const h = wrapperRef.current.clientHeight;
    canvasRef.current.width = w;
    canvasRef.current.height = h;

    // Setup Engine
    const engine = Matter.Engine.create();
    engine.world.gravity.y = 1.2;
    engineRef.current = engine;

    // Reset Tracking
    basePointsRef.current = [];
    terrainBodiesRef.current = [];
    chunkIndexRef.current = 0;
    cameraX.current = 0;

    // Generate initial terrain chunks
    generateTerrainChunk(0, engine);
    generateTerrainChunk(1, engine);

    // Create Bike
    const startX = 100;
    const startY = basePointsRef.current[0].y - 100;

    const group = Matter.Body.nextGroup(true);
    
    // Chassis
    const chassis = Matter.Bodies.rectangle(startX, startY, 40, 15, {
      collisionFilter: { group },
      frictionAir: 0.02,
      density: 0.002
    });

    // Wheels
    const wheelOpts = {
      collisionFilter: { group },
      friction: 0.9,
      restitution: 0.1,
      density: 0.005
    };
    const wheelA = Matter.Bodies.circle(startX - 20, startY + 15, 12, wheelOpts); // Back
    const wheelB = Matter.Bodies.circle(startX + 20, startY + 15, 12, wheelOpts); // Front

    // Suspension
    const axelA = Matter.Constraint.create({
      bodyA: chassis, bodyB: wheelA,
      pointA: { x: -20, y: 10 },
      stiffness: 0.15, damping: 0.3, length: 15
    });
    const axelB = Matter.Constraint.create({
      bodyA: chassis, bodyB: wheelB,
      pointA: { x: 20, y: 10 },
      stiffness: 0.15, damping: 0.3, length: 15
    });

    Matter.World.add(engine.world, [chassis, wheelA, wheelB, axelA, axelB]);
    bikeRef.current = { chassis, wheelA, wheelB };

    // Crash Detection (Head hit or Upside down)
    Matter.Events.on(engine, "collisionStart", (event) => {
      if (stateRef.current !== "playing") return;
      const { pairs } = event;
      
      for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];
        
        // If chassis hits terrain directly
        if (bodyA === chassis || bodyB === chassis) {
          // Check angle to see if it's a dangerous hit
          const angle = Math.abs(chassis.angle % (Math.PI * 2));
          if (angle > 1.2 && angle < 5.0) { // Upside down or steep angle
            triggerCrash();
          }
        }
      }
    });

    // Start Runner
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
    
    // Start custom render loop
    rafRef.current = requestAnimationFrame(renderLoop);
  }, [generateTerrainChunk]);

  // Auto-start
  useEffect(() => {
    const t = setTimeout(() => {
      if (stateRef.current === "idle") handleStart();
    }, 100);
    return () => clearTimeout(t);
  }, [handleStart]);

  const triggerCrash = () => {
    if (stateRef.current === "crashed") return;
    stateRef.current = "crashed";
    setGameState("crashed");
    setShaking(true);
    setShowFlash(true);
    setTimeout(() => setShaking(false), 400);
    setTimeout(() => setShowFlash(false), 600);
    
    // Stop runner
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

    if (stateRef.current === "playing") {
      // 1. Controls
      const k = keys.current;
      
      // In air vs grounded check (very basic based on angular velocity changes)
      if (k["w"] || k["arrowup"]) {
        Matter.Body.setAngularVelocity(wheelA, wheelA.angularVelocity + 0.05); // Gas
      }
      if (k["s"] || k["arrowdown"]) {
        Matter.Body.setAngularVelocity(wheelA, wheelA.angularVelocity - 0.05); // Brake
      }
      if (k["a"] || k["arrowleft"]) {
        Matter.Body.setAngularVelocity(chassis, chassis.angularVelocity - 0.02); // Lean Back
      }
      if (k["d"] || k["arrowright"]) {
        Matter.Body.setAngularVelocity(chassis, chassis.angularVelocity + 0.02); // Lean Fwd
      }

      // Check fall off map
      if (chassis.position.y > h + 400) {
        triggerCrash();
      }

      // 2. Generate new terrain if approaching end
      const lastPt = basePointsRef.current[basePointsRef.current.length - 1];
      if (chassis.position.x > lastPt.x - w * 2) {
        chunkIndexRef.current += 1;
        generateTerrainChunk(chunkIndexRef.current, engine);
        
        // Remove old chunks to save memory
        const keepThreshold = chassis.position.x - w * 2;
        // Filter basePoints
        const trimIdx = basePointsRef.current.findIndex(p => p.x > keepThreshold);
        if (trimIdx > 0) {
          basePointsRef.current = basePointsRef.current.slice(trimIdx);
        }
        // Remove old bodies
        const bodiesToRemove = terrainBodiesRef.current.filter(b => b.position.x < keepThreshold);
        if (bodiesToRemove.length > 0) {
          Matter.World.remove(engine.world, bodiesToRemove);
          terrainBodiesRef.current = terrainBodiesRef.current.filter(b => b.position.x >= keepThreshold);
        }
      }
    }

    // 3. Camera Tracking
    const targetCamX = chassis.position.x - w * 0.3;
    cameraX.current += (targetCamX - cameraX.current) * 0.1;
    cameraX.current = Math.max(0, cameraX.current);

    // 4. Drawing
    ctx.fillStyle = "var(--bg-base)";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(15, 23, 42, 0.04)";
    ctx.lineWidth = 1;
    const gridOffset = cameraX.current % 60;
    for (let x = -gridOffset; x < w; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    // Draw Terrain
    const chartColor = isPositiveRef.current ? "#2ecc71" : "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(0, h);
    
    // Draw all active points
    for (const p of basePointsRef.current) {
      const sx = p.x - cameraX.current;
      if (sx > -100 && sx < w + 100) {
        ctx.lineTo(sx, p.y);
      } else if (sx >= w + 100) {
        ctx.lineTo(sx, p.y);
        break; // Stop drawing off screen
      }
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, chartColor + "33");
    grad.addColorStop(1, chartColor + "00");
    ctx.fillStyle = grad;
    ctx.fill();

    // Terrain Stroke
    ctx.beginPath();
    let first = true;
    for (const p of basePointsRef.current) {
      const sx = p.x - cameraX.current;
      if (sx > -100 && sx < w + 100) {
        if (first) { ctx.moveTo(sx, p.y); first = false; }
        else { ctx.lineTo(sx, p.y); }
      } else if (sx >= w + 100) {
        ctx.lineTo(sx, p.y);
        break;
      }
    }
    ctx.strokeStyle = chartColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Bike (Custom Render)
    const crashed = stateRef.current === "crashed";
    const bx = chassis.position.x - cameraX.current;
    const by = chassis.position.y;
    const angle = chassis.angle;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);

    const riderColor = crashed ? "#e74c3c" : "#00f0ff";
    const frameColor = crashed ? "#c0392b" : "#95a5a6";

    // Frame
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(15, 0);
    ctx.lineTo(5, -10);
    ctx.lineTo(-5, -10);
    ctx.closePath();
    ctx.stroke();

    // Rider
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-2, -10); ctx.lineTo(2, -20); ctx.stroke(); // Body
    ctx.beginPath(); ctx.moveTo(2, -20); ctx.lineTo(10, -10); ctx.stroke(); // Arms
    ctx.beginPath(); ctx.moveTo(-2, -10); ctx.lineTo(5, 0); ctx.stroke(); // Legs
    ctx.beginPath(); ctx.arc(4, -23, 4, 0, Math.PI*2); ctx.fillStyle = riderColor; ctx.fill(); // Head

    ctx.restore();

    // Draw Wheels (Need correct rotation and positions)
    const drawWheel = (body: Matter.Body) => {
      const wx = body.position.x - cameraX.current;
      const wy = body.position.y;
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(body.angle);
      
      ctx.strokeStyle = crashed ? "#e74c3c" : "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.stroke();
      
      // Spokes
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      for(let i=0; i<4; i++) {
        ctx.rotate(Math.PI/4);
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
      }
      ctx.restore();
    };

    drawWheel(wheelA);
    drawWheel(wheelB);

    // Draw HUD
    const elapsed = stateRef.current === "crashed" ? elapsedSec : Math.round((time - startTime.current) / 1000);
    const currDist = Math.max(0, Math.floor(chassis.position.x / 10));
    const speed = Math.abs(wheelA.angularVelocity * 10).toFixed(0);

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(10, 10, 160, 80);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.strokeRect(10, 10, 160, 80);

    ctx.fillStyle = "var(--text-muted)";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(`COIN: ${symbol}`, 20, 30);
    ctx.fillText(`DIST: ${currDist}m (Best: ${bestScore}m)`, 20, 50);
    ctx.fillText(`TIME: ${elapsed}s`, 20, 70);
    
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(w - 120, 10, 100, 50);
    ctx.fillStyle = "var(--accent)";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(`${speed} KM/H`, w - 110, 42);

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

        {showFlash && <div className="motogame-crash-flash" />}

        {gameState === "crashed" && (
          <div className="motogame-idle-overlay crashed-overlay">
            <div className="motogame-idle-card">
              <h2 className="motogame-title text-red-500">💥 WIPEOUT!</h2>
              <p className="motogame-subtitle">
                You rode <strong>{distance}m</strong> in <strong>{elapsedSec}s</strong>.
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
                  <button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="motogame-start-btn"
                  >
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
                    <div 
                      key={entry.id} 
                      className={`flex justify-between px-3 py-2 text-xs border-b border-slate-800 last:border-0 ${
                        entry.id === myScoreId ? "bg-accent/20 text-accent font-bold" : "text-slate-300"
                      }`}
                    >
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
              <button 
                className="control-btn"
                onPointerDown={(e)=>{e.preventDefault(); keys.current["a"]=true;}}
                onPointerUp={(e)=>{e.preventDefault(); keys.current["a"]=false;}}
              >↶</button>
              <button 
                className="control-btn"
                onPointerDown={(e)=>{e.preventDefault(); keys.current["d"]=true;}}
                onPointerUp={(e)=>{e.preventDefault(); keys.current["d"]=false;}}
              >↷</button>
            </div>
            <div className="control-group">
              <button 
                className="control-btn brake"
                onPointerDown={(e)=>{e.preventDefault(); keys.current["s"]=true;}}
                onPointerUp={(e)=>{e.preventDefault(); keys.current["s"]=false;}}
              >Brake</button>
              <button 
                className="control-btn gas"
                onPointerDown={(e)=>{e.preventDefault(); keys.current["w"]=true;}}
                onPointerUp={(e)=>{e.preventDefault(); keys.current["w"]=false;}}
              >Gas</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
