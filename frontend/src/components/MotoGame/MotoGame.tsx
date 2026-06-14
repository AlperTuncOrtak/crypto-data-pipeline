import React, { useCallback, useEffect, useRef, useState } from "react";
import "./MotoGame.css";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase client ──────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_KEY as string
);

// ─── Types ────────────────────────────────────────────────────
export interface OHLCPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface MotoGameProps {
  ohlcData: OHLCPoint[];
  symbol: string;
  coinId: string;
}

interface LeaderboardEntry {
  id: string;
  player_name: string;
  distance_meters: number;
  time_seconds: number;
}

type GameState = "idle" | "playing" | "crashed";

interface BikeState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  crashed: boolean;
  wheelieFrames: number;
  frontWheelY: number;
  backWheelY: number;
  frontCompression: number;
  backCompression: number;
}

// ─── Input State ─────────────────────────────────────────────
interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

// ─── Physics constants ────────────────────────────────────────
const GRAVITY        = 0.45;
const THROTTLE_FORCE = 0.6;
const BRAKE_FORCE    = 0.4;
const MAX_SPEED      = 22;
const MAX_REVERSE    = -5;
const AIR_TURN_SPEED = 0.08;
const GROUND_GRIP    = 0.98;
const AIR_FRICTION   = 0.99;

const BIKE_WHEELBASE = 16;
const BIKE_WHEEL_R   = 10;
const SPRING_K       = 0.3;
const DAMPING        = 0.8;

// ─── Terrain Engine ───────────────────────────────────────────
function movingAverage(arr: number[], w: number): number[] {
  return arr.map((_, i) => {
    const start = Math.max(0, i - Math.floor(w / 2));
    const end   = Math.min(arr.length, start + w);
    const slice = arr.slice(start, end);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

function buildTerrainBase(ohlcData: OHLCPoint[], baseHeight: number): number[] {
  const raw = ohlcData.slice(-120).map(d => d.close);
  if (raw.length < 2) return Array.from({ length: 120 }, () => baseHeight);

  const smoothed = movingAverage(raw, 5);
  const minP = Math.min(...smoothed);
  const maxP = Math.max(...smoothed);
  const range = maxP - minP || 1;

  const TOP    = baseHeight - 150;
  const BOTTOM = baseHeight + 150;

  return smoothed.map(val => {
    const norm = (val - minP) / range;
    return BOTTOM - norm * (BOTTOM - TOP);
  });
}

const SEGMENT_W = 60;

function getTerrainY(worldX: number, basePoints: number[]): number {
  if (basePoints.length === 0) return 0;
  // Make it endless by wrapping
  const N = basePoints.length;
  const rawIdx = Math.floor(worldX / SEGMENT_W);
  const t = (worldX % SEGMENT_W) / SEGMENT_W;
  
  // Wrap index properly for negative numbers
  const i0 = ((rawIdx % N) + N) % N;
  const i1 = (((rawIdx + 1) % N) + N) % N;

  const y0 = basePoints[i0];
  const y1 = basePoints[i1];

  // Cosine interpolation for smoothness
  const ft = t * Math.PI;
  const f = (1 - Math.cos(ft)) * 0.5;
  return y0 * (1 - f) + y1 * f;
}

function getTerrainAngle(worldX: number, basePoints: number[]): number {
  const dx = 2;
  const y1 = getTerrainY(worldX - dx, basePoints);
  const y2 = getTerrainY(worldX + dx, basePoints);
  return Math.atan2(y2 - y1, dx * 2);
}

// ─── Drawing Helpers ─────────────────────────────────────────
function drawEndlessTerrain(
  ctx: CanvasRenderingContext2D,
  basePoints: number[],
  viewportX: number,
  canvasW: number,
  canvasH: number,
  isPositive: boolean
) {
  ctx.save();
  ctx.translate(-viewportX, 0);

  const startX = Math.floor(viewportX / SEGMENT_W) * SEGMENT_W;
  const endX = startX + canvasW + SEGMENT_W * 2;

  ctx.beginPath();
  ctx.moveTo(startX, getTerrainY(startX, basePoints));
  for (let x = startX; x <= endX; x += 10) {
    ctx.lineTo(x, getTerrainY(x, basePoints));
  }
  ctx.lineTo(endX, canvasH + 100);
  ctx.lineTo(startX, canvasH + 100);
  ctx.closePath();

  const colorStr = isPositive ? "46, 204, 113" : "231, 76, 60";
  
  const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
  grad.addColorStop(0, `rgba(${colorStr}, 0.25)`);
  grad.addColorStop(1, `rgba(${colorStr}, 0.0)`);
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw the bright line
  ctx.beginPath();
  ctx.moveTo(startX, getTerrainY(startX, basePoints));
  for (let x = startX; x <= endX; x += 10) {
    ctx.lineTo(x, getTerrainY(x, basePoints));
  }
  ctx.strokeStyle = `rgb(${colorStr})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = `rgb(${colorStr})`;
  ctx.shadowBlur = 10;
  ctx.stroke();

  ctx.restore();
}

function drawBikeEx(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  angle: number,
  frontComp: number,
  backComp: number,
  crashed: boolean,
  wheelAngle: number
) {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(angle);

  const color = crashed ? "#e74c3c" : "#ffffff";
  const frameColor = crashed ? "#c0392b" : "#95a5a6";

  // Wheels
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowBlur = 0;

  // Back wheel
  const bwX = -BIKE_WHEELBASE;
  const bwY = BIKE_WHEELBASE - backComp;
  ctx.save();
  ctx.translate(bwX, bwY);
  ctx.rotate(wheelAngle);
  ctx.beginPath();
  ctx.arc(0, 0, BIKE_WHEEL_R, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*BIKE_WHEEL_R, Math.sin(a)*BIKE_WHEEL_R);
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth=2; ctx.stroke();
  }
  ctx.restore();

  // Front wheel
  const fwX = BIKE_WHEELBASE;
  const fwY = BIKE_WHEELBASE - frontComp;
  ctx.save();
  ctx.translate(fwX, fwY);
  ctx.rotate(wheelAngle);
  ctx.beginPath();
  ctx.arc(0, 0, BIKE_WHEEL_R, 0, Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*BIKE_WHEEL_R, Math.sin(a)*BIKE_WHEEL_R);
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth=2; ctx.stroke();
  }
  ctx.restore();

  // Suspension lines
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bwX, bwY);
  ctx.lineTo(-6, -2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(fwX, fwY);
  ctx.lineTo(10, -6);
  ctx.stroke();

  // Main frame
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.lineTo(6, 2);
  ctx.lineTo(10, -6);
  ctx.lineTo(-6, -2);
  ctx.fillStyle = frameColor;
  ctx.fill();
  ctx.stroke();

  // Rider
  const riderColor = crashed ? "#e74c3c" : "#00f0ff";
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  // Body
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, -14); ctx.stroke();
  // Head
  ctx.beginPath(); ctx.arc(6, -18, 5, 0, Math.PI*2); ctx.fillStyle = riderColor; ctx.fill();
  // Arms
  ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(10, -6); ctx.stroke();

  ctx.restore();
}

function drawHUDEx(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  elapsedMs: number,
  distance: number,
  best: number,
  speed: number,
  symbol: string
) {
  const secs  = Math.floor(elapsedMs / 1000);
  const mins  = Math.floor(secs / 60);
  const ss    = String(secs % 60).padStart(2, "0");
  const mm    = String(mins).padStart(2, "0");

  ctx.save();
  ctx.font = "bold 13px 'Inter', monospace";
  ctx.textBaseline = "top";

  // Top-left Box
  ctx.fillStyle = "rgba(15,23,42,0.8)";
  ctx.beginPath(); ctx.roundRect(16, 16, 180, 72, 12); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1; ctx.stroke();

  ctx.fillStyle = "var(--text-primary)";
  ctx.fillText("TIME: " + `${mm}:${ss}`, 28, 26);
  ctx.fillText("DIST: " + distance + "m", 28, 46);
  
  ctx.fillStyle = "var(--accent)";
  ctx.fillText("BEST: " + best + "m", 28, 66);

  // Speedometer (Top Right)
  ctx.fillStyle = "rgba(15,23,42,0.8)";
  ctx.beginPath(); ctx.roundRect(canvasW - 120, 16, 100, 40, 12); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.stroke();
  
  ctx.fillStyle = speed > 15 ? "#e74c3c" : "#2ecc71";
  ctx.font = "bold 16px 'Inter', monospace";
  ctx.textAlign = "right";
  ctx.fillText(Math.floor(speed * 5) + " KM/H", canvasW - 36, 28);
  
  ctx.restore();
}

// ─── Main component ───────────────────────────────────────────
export default function MotoGame({ ohlcData, symbol, coinId }: MotoGameProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const stateRef    = useRef<GameState>("idle");

  const basePoints  = useRef<number[]>([]);
  const isPositive  = useRef<boolean>(true);

  // Input
  const keys = useRef<InputState>({ up: false, down: false, left: false, right: false });

  // Bike
  const bikeRef = useRef<BikeState>({
    x: 0, y: 0, vx: 0, vy: 0,
    angle: 0, angularVel: 0, crashed: false,
    wheelieFrames: 0, frontWheelY: 0, backWheelY: 0,
    frontCompression: 0, backCompression: 0
  });

  const wheelAngle = useRef<number>(0);
  const startTime  = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [distance, setDistance] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [bestScore, setBestScore] = useState<number>(() =>
    parseInt(localStorage.getItem(`moto_best_${coinId}`) || "0", 10)
  );

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myScoreId, setMyScoreId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoard = async () => {
      const { data } = await supabase.from("motogame_scores").select("*").eq("coin_id", coinId).order("distance_meters", { ascending: false }).limit(10);
      if (data) setLeaderboard(data as LeaderboardEntry[]);
    };
    fetchBoard();
  }, [coinId]);

  const initTerrain = useCallback(() => {
    const h = window.innerWidth < 640 ? 280 : 360;
    basePoints.current = buildTerrainBase(ohlcData, h * 0.6);
    const startY = basePoints.current[0] || 0;
    const endY = basePoints.current[basePoints.current.length - 1] || 0;
    isPositive.current = endY <= startY; // canvas Y is inverted
  }, [ohlcData]);

  const spawnBike = useCallback(() => {
    const startX = 80;
    const startY = getTerrainY(startX, basePoints.current) - 40;
    const spawnAngle = getTerrainAngle(startX, basePoints.current);
    bikeRef.current = {
      x: startX, y: startY, vx: 5, vy: 0,
      angle: spawnAngle, angularVel: 0, crashed: false,
      wheelieFrames: 0, frontWheelY: 0, backWheelY: 0,
      frontCompression: 0, backCompression: 0
    };
    wheelAngle.current = 0;
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.current.up = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.current.down = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.current.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.current.right = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.current.up = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.current.down = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.current.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const resize = () => {
      canvas.width = wrapper.clientWidth;
      canvas.height = window.innerWidth < 640 ? 280 : 360;
      initTerrain();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [initTerrain]);

  // ── Physics Engine Loop ─────────────────────────────────────────
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    startTime.current = performance.now();

    let cameraX = bikeRef.current.x - 150;

    const loop = (now: number) => {
      if (stateRef.current !== "playing") return;

      const elapsed = now - startTime.current;
      elapsedRef.current = elapsed;

      const w = canvas.width;
      const h = canvas.height;
      const b = bikeRef.current;
      const pts = basePoints.current;

      if (!b.crashed) {
        b.vy += GRAVITY;

        // Calculate wheel positions in world space
        const cosA = Math.cos(b.angle);
        const sinA = Math.sin(b.angle);

        const bwX = b.x - BIKE_WHEELBASE * cosA;
        const bwY = b.y - BIKE_WHEELBASE * sinA;
        
        const fwX = b.x + BIKE_WHEELBASE * cosA;
        const fwY = b.y + BIKE_WHEELBASE * sinA;

        // Ground collisions
        const gBwY = getTerrainY(bwX, pts) - BIKE_WHEEL_R;
        const gFwY = getTerrainY(fwX, pts) - BIKE_WHEEL_R;

        let backContact = false;
        let frontContact = false;

        // Suspension physics
        if (bwY > gBwY) {
          b.backCompression = bwY - gBwY;
          const springForce = b.backCompression * SPRING_K;
          b.vy -= springForce * cosA;
          b.angularVel -= springForce * 0.005;
          b.vy *= DAMPING;
          backContact = true;
        } else {
          b.backCompression *= 0.8; // relax
        }

        if (fwY > gFwY) {
          b.frontCompression = fwY - gFwY;
          const springForce = b.frontCompression * SPRING_K;
          b.vy -= springForce * cosA;
          b.angularVel += springForce * 0.005;
          b.vy *= DAMPING;
          frontContact = true;
        } else {
          b.frontCompression *= 0.8;
        }

        const onGround = backContact || frontContact;

        // Inputs
        if (onGround) {
          b.vx *= GROUND_GRIP;
          if (keys.current.up) b.vx += THROTTLE_FORCE * cosA;
          if (keys.current.down) b.vx -= BRAKE_FORCE * cosA;
          
          if (keys.current.left) {
            b.angularVel -= 0.04;
          } else if (keys.current.right) {
            b.angularVel += 0.04;
          }
        } else {
          b.vx *= AIR_FRICTION;
          if (keys.current.left) b.angularVel -= AIR_TURN_SPEED;
          if (keys.current.right) b.angularVel += AIR_TURN_SPEED;
        }

        // Clamp Speed
        b.vx = Math.max(MAX_REVERSE, Math.min(MAX_SPEED, b.vx));

        // Movement
        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.angularVel;
        b.angularVel *= 0.95; // Rotational friction
        
        wheelAngle.current += b.vx * 0.1;

        // Normalize angle for crash detection
        let normAngle = b.angle % (Math.PI * 2);
        if (normAngle > Math.PI) normAngle -= Math.PI * 2;
        if (normAngle < -Math.PI) normAngle += Math.PI * 2;

        // Crash logic (Only crash if upside down and head hits ground)
        const isUpsideDown = Math.abs(normAngle) > 1.6; // ~90 degrees
        const headX = b.x - Math.sin(b.angle) * 15;
        const headY = b.y - Math.cos(b.angle) * 15;
        const gHeadY = getTerrainY(headX, pts);
        
        if ((isUpsideDown && headY > gHeadY - 10) || b.y > h + 400) {
          b.crashed = true;
        }
      }

      // Camera Lerp
      const targetCamX = b.x - w * 0.3;
      cameraX += (targetCamX - cameraX) * 0.1;
      cameraX = Math.max(0, cameraX); // Don't scroll left of start

      // Render
      ctx.fillStyle = "var(--bg-base)";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(15, 23, 42, 0.04)";
      ctx.lineWidth = 1;
      const gridOffset = cameraX % 60;
      for (let x = -gridOffset; x < w; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      drawEndlessTerrain(ctx, pts, cameraX, w, h, isPositive.current);
      drawBikeEx(ctx, b.x - cameraX, b.y, b.angle, b.frontCompression, b.backCompression, b.crashed, wheelAngle.current);
      
      const currentDist = Math.floor(b.x / 10);
      drawHUDEx(ctx, w, elapsed, currentDist, bestScore, b.vx, symbol);

      if (b.crashed) {
        const finalDist = currentDist;
        const finalSec = Math.round(elapsed / 1000);
        if (finalDist > bestScore) {
          localStorage.setItem(`moto_best_${coinId}`, String(finalDist));
          setBestScore(finalDist);
        }
        stateRef.current = "crashed";
        setDistance(finalDist);
        setElapsedSec(finalSec);
        setGameState("crashed");
        setShaking(true);
        setShowFlash(true);
        setTimeout(() => setShaking(false), 400);
        setTimeout(() => setShowFlash(false), 600);
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [coinId, symbol, bestScore]);

  // ── Actions ─────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    initTerrain();
    spawnBike();
    setGameState("playing");
    stateRef.current = "playing";
    setDistance(0);
    setElapsedSec(0);
    setSubmitted(false);
    setNickname("");
    setMyScoreId(null);
    startLoop();
  }, [initTerrain, spawnBike, startLoop]);

  const handleRestart = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
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

  // Auto-start on mount
  useEffect(() => {
    const t = setTimeout(() => {
      handleStart();
    }, 100);
    return () => clearTimeout(t);
  }, [handleStart]);

  return (
    <div className="motogame-container">
      <div
        ref={wrapperRef}
        className={`motogame-canvas-wrapper${shaking ? " shake" : ""}`}
      >
        <canvas ref={canvasRef} className="motogame-canvas" />

        {showFlash && <div className="motogame-crash-flash" />}

        {/* ── IDLE overlay ─────────────────────────────────── */}
        {gameState === "idle" && (
          <div className="motogame-idle-overlay">
            <div className="motogame-idle-card">
              <h2 className="motogame-title">🏍️ Ride the Chart</h2>
              <p className="motogame-subtitle">
                Race over {symbol.toUpperCase()}'s real price history. Controls: <strong>WASD / Arrows</strong>
              </p>
              <button className="motogame-btn-start" onClick={handleStart}>
                ▶ START RIDING
              </button>

              {leaderboard.length > 0 && (
                <div className="motogame-leaderboard mt-6">
                  <div className="motogame-leaderboard-title">
                    🏆 Top Riders — {symbol.toUpperCase()}
                  </div>
                  <table className="motogame-leaderboard-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Player</th>
                        <th>Distance</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.slice(0, 5).map((row, i) => (
                        <tr key={row.id} className={row.id === myScoreId ? "my-score" : ""}>
                          <td>
                            <span className={`motogame-rank-badge${i === 0 ? " gold" : i === 1 ? " silver" : i === 2 ? " bronze" : ""}`}>
                              {i + 1}
                            </span>
                          </td>
                          <td>{row.player_name}</td>
                          <td>{row.distance_meters}m</td>
                          <td>{Math.floor(row.time_seconds/60)}:{(row.time_seconds%60).toString().padStart(2,'0')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CRASHED overlay ──────────────────────────────── */}
        {gameState === "crashed" && (
          <div className="motogame-idle-overlay crashed-overlay">
            <div className="motogame-idle-card">
              <h2 className="motogame-title text-red-500">💥 WIPEOUT!</h2>
              <p className="motogame-subtitle">
                You rode <strong>{distance}m</strong> in {elapsedSec} seconds.
              </p>

              {!submitted ? (
                <div className="motogame-submit-form mt-4">
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="Enter your nickname..."
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="motogame-input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmit();
                    }}
                  />
                  <button
                    className="motogame-btn-submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "..." : "Submit Score"}
                  </button>
                </div>
              ) : (
                <div className="text-green-400 font-bold mt-4">Score submitted!</div>
              )}

              <div className="mt-6 flex justify-center">
                <button className="motogame-btn-start" onClick={handleRestart}>
                  🔄 TRY AGAIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile controls */}
        {gameState === "playing" && (
          <div className="motogame-mobile-controls sm:hidden">
            <div className="controls-left">
              <button onTouchStart={() => keys.current.left=true} onTouchEnd={() => keys.current.left=false}>↩️ Lean Back</button>
              <button onTouchStart={() => keys.current.right=true} onTouchEnd={() => keys.current.right=false}>↪️ Lean Fwd</button>
            </div>
            <div className="controls-right">
              <button onTouchStart={() => keys.current.down=true} onTouchEnd={() => keys.current.down=false}>🛑 Brake</button>
              <button onTouchStart={() => keys.current.up=true} onTouchEnd={() => keys.current.up=false}>🔥 GAS</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
