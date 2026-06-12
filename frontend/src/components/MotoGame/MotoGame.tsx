import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  symbol: string;   // e.g. "BTC"
  coinId: string;   // e.g. "bitcoin" (Supabase leaderboard key)
}

interface LeaderboardEntry {
  id: string;
  player_name: string;
  distance_meters: number;
  time_seconds: number;
}

type GameState = "idle" | "playing" | "crashed" | "finished";

interface BikeState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  onGround: boolean;
  crashed: boolean;
  finished: boolean;
}

// ─── Physics constants ────────────────────────────────────────
const GRAVITY        = 0.4;
const THROTTLE_FORCE = 0.30;
const AUTO_PUSH      = 0.04;
const MAX_VX         = 14;
const MIN_VX         = -8;
const JUMP_VY        = -9;
const CRASH_ANGLE    = 1.2; // ~70°
const CRASH_FRAMES   = 20;
const ANGLE_LERP     = 0.12;

// ─── Terrain helpers ──────────────────────────────────────────
function movingAverage(arr: number[], w: number): number[] {
  return arr.map((_, i) => {
    const start = Math.max(0, i - Math.floor(w / 2));
    const end   = Math.min(arr.length, start + w);
    const slice = arr.slice(start, end);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

function buildTerrain(
  ohlcData: OHLCPoint[],
  canvasW: number,
  canvasH: number
): { xs: Float32Array; ys: Float32Array; totalW: number } {
  // Use last 120 candles max, close prices
  const raw = ohlcData.slice(-120).map(d => d.close);
  if (raw.length < 2) {
    // Flat fallback
    const n = 120;
    const xs = new Float32Array(n).map((_, i) => (i / (n - 1)) * canvasW * 3);
    const ys = new Float32Array(n).fill(canvasH * 0.55);
    return { xs, ys, totalW: canvasW * 3 };
  }

  const smoothed = movingAverage(raw, 5);
  const minP = Math.min(...smoothed);
  const maxP = Math.max(...smoothed);
  const range = maxP - minP || 1;

  const TOP    = 80;
  const BOTTOM = canvasH - 60;
  const totalW = canvasW * 3;
  const n      = smoothed.length;

  const xs = new Float32Array(n);
  const ys = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    xs[i] = (i / (n - 1)) * totalW;
    // Invert: high price → low Y (top of canvas)
    const norm = (smoothed[i] - minP) / range; // 0–1
    ys[i] = BOTTOM - norm * (BOTTOM - TOP);
  }

  return { xs, ys, totalW };
}

/** Binary-search interpolated terrain Y at world-X */
function terrainYAt(
  worldX: number,
  xs: Float32Array,
  ys: Float32Array
): number {
  if (worldX <= xs[0]) return ys[0];
  if (worldX >= xs[xs.length - 1]) return ys[ys.length - 1];

  let lo = 0, hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= worldX) lo = mid; else hi = mid;
  }
  const t = (worldX - xs[lo]) / (xs[hi] - xs[lo]);
  return ys[lo] + t * (ys[hi] - ys[lo]);
}

/** Terrain slope angle at worldX (radians) */
function terrainAngleAt(
  worldX: number,
  xs: Float32Array,
  ys: Float32Array
): number {
  const dx = 4;
  const y1 = terrainYAt(worldX - dx, xs, ys);
  const y2 = terrainYAt(worldX + dx, xs, ys);
  return Math.atan2(y2 - y1, dx * 2);
}

// ─── Canvas drawing ───────────────────────────────────────────
function drawTerrain(
  ctx: CanvasRenderingContext2D,
  xs: Float32Array,
  ys: Float32Array,
  canvasH: number,
  vx: number
): void {
  ctx.save();
  ctx.translate(-vx, 0);

  ctx.beginPath();
  ctx.moveTo(xs[0], ys[0]);
  for (let i = 1; i < xs.length; i++) {
    ctx.lineTo(xs[i], ys[i]);
  }
  ctx.lineTo(xs[xs.length - 1], canvasH + 5);
  ctx.lineTo(xs[0], canvasH + 5);
  ctx.closePath();

  ctx.fillStyle   = "rgba(0,240,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = "#00f0ff";
  ctx.lineWidth   = 2;
  ctx.stroke();

  ctx.restore();
}

function drawBike(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  angle: number,
  crashed: boolean
): void {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(angle);

  const accentColor = crashed ? "#e74c3c" : "#00f0ff";
  const bodyColor   = crashed ? "#e74c3c" : "rgba(255,255,255,0.9)";

  // ── Rear wheel ─────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(-18, 8, 12, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth   = 2.5;
  ctx.stroke();
  // Spokes
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(-18, 8);
    ctx.lineTo(-18 + Math.cos(a) * 10, 8 + Math.sin(a) * 10);
    ctx.strokeStyle = "rgba(0,240,255,0.35)";
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // ── Front wheel ────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(18, 8, 12, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth   = 2.5;
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(18, 8);
    ctx.lineTo(18 + Math.cos(a) * 10, 8 + Math.sin(a) * 10);
    ctx.strokeStyle = "rgba(0,240,255,0.35)";
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // ── Frame ──────────────────────────────────────────────────
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth   = 2.5;
  // Rear axle to seat
  ctx.beginPath();
  ctx.moveTo(-18, 8);
  ctx.lineTo(-6, -14);
  ctx.lineTo(6, -14);
  ctx.stroke();
  // Seat to front axle
  ctx.beginPath();
  ctx.moveTo(6, -14);
  ctx.lineTo(18, 8);
  ctx.stroke();
  // Down tube
  ctx.beginPath();
  ctx.moveTo(-6, -14);
  ctx.lineTo(14, 5);
  ctx.stroke();

  // ── Seat ───────────────────────────────────────────────────
  ctx.beginPath();
  ctx.roundRect(-10, -18, 20, 5, 3);
  ctx.fillStyle = bodyColor;
  ctx.fill();

  // ── Exhaust ────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(-18, 6);
  ctx.quadraticCurveTo(-28, 12, -30, 18);
  ctx.strokeStyle = "rgba(255,150,50,0.7)";
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  // ── Handlebar ──────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(14, -12);
  ctx.lineTo(20, -17);
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // ── Rider ──────────────────────────────────────────────────
  const helmetColor = crashed ? "#e74c3c" : "#00f0ff";
  // Torso
  ctx.beginPath();
  ctx.moveTo(-2, -18);
  ctx.lineTo(4, -30);
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth   = 3;
  ctx.stroke();
  // Head (helmet)
  ctx.beginPath();
  ctx.arc(5, -33, 7, 0, Math.PI * 2);
  ctx.fillStyle = helmetColor;
  ctx.fill();
  // Visor
  ctx.beginPath();
  ctx.arc(5, -33, 7, -0.4, 0.4);
  ctx.strokeStyle = "rgba(2,6,23,0.7)";
  ctx.lineWidth   = 3;
  ctx.stroke();
  // Arms
  ctx.beginPath();
  ctx.moveTo(3, -27);
  ctx.lineTo(16, -21);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth   = 2;
  ctx.stroke();
  // Legs
  ctx.beginPath();
  ctx.moveTo(-2, -18);
  ctx.lineTo(-10, -10);
  ctx.moveTo(-2, -18);
  ctx.lineTo(6, -10);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth   = 2;
  ctx.stroke();

  ctx.restore();
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  elapsedMs: number,
  distance: number,
  best: number,
  symbol: string,
  progress: number // 0–1
): void {
  const secs  = Math.floor(elapsedMs / 1000);
  const mins  = Math.floor(secs / 60);
  const ss    = String(secs % 60).padStart(2, "0");
  const mm    = String(mins).padStart(2, "0");
  const timeStr = `${mm}:${ss}`;

  ctx.save();
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.textBaseline = "top";

  // ── Top-left: timer + distance + best ─────────────────────
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.roundRect(12, 12, 160, 68, 8);
  ctx.fill();

  ctx.fillStyle = "rgba(0,240,255,0.7)";
  ctx.font      = "bold 11px 'Courier New', monospace";
  ctx.fillText("⏱ " + timeStr, 20, 20);
  ctx.fillText("📏 " + distance + "m", 20, 38);
  ctx.fillStyle = "rgba(255,215,0,0.8)";
  ctx.fillText("🏅 BEST: " + best + "m", 20, 56);

  // ── Top-center: symbol badge ────────────────────────────────
  const badgeW = 68;
  const badgeX = (canvasW - badgeW) / 2;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.roundRect(badgeX, 12, badgeW, 28, 8);
  ctx.fill();
  ctx.fillStyle  = "#00f0ff";
  ctx.font       = "bold 14px 'Courier New', monospace";
  ctx.textAlign  = "center";
  ctx.fillText(symbol, canvasW / 2, 19);
  ctx.textAlign  = "left";

  // ── Top-right: progress bar ─────────────────────────────────
  const barW  = 120;
  const barH  = 8;
  const barX  = canvasW - barW - 16;
  const barY  = 16;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.roundRect(barX - 8, barY - 6, barW + 16, 28, 8);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 4);
  ctx.fill();

  ctx.fillStyle = "#00f0ff";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW * Math.min(1, progress), barH, 4);
  ctx.fill();

  ctx.font      = "bold 10px 'Courier New', monospace";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(progress * 100)}%`, canvasW - 16, barY + barH + 6);
  ctx.textAlign = "left";

  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  viewportX: number
): void {
  // Deep navy gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
  grad.addColorStop(0, "#020617");
  grad.addColorStop(1, "#050d20");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Subtle grid lines
  ctx.strokeStyle = "rgba(0,240,255,0.04)";
  ctx.lineWidth   = 1;
  const gridX     = viewportX % 80;
  for (let x = -gridX; x < canvasW; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasH);
    ctx.stroke();
  }
  for (let y = 0; y < canvasH; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasW, y);
    ctx.stroke();
  }
}

// ─── Leaderboard fetcher ──────────────────────────────────────
async function fetchLeaderboard(coinId: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("motogame_scores")
    .select("id, player_name, distance_meters, time_seconds")
    .eq("coin_id", coinId)
    .order("distance_meters", { ascending: false })
    .limit(10);
  if (error) return [];
  return (data as LeaderboardEntry[]) || [];
}

async function submitScore(
  coinId: string,
  symbol: string,
  playerName: string,
  distanceMeters: number,
  timeSeconds: number
): Promise<void> {
  await supabase.from("motogame_scores").insert({
    coin_id: coinId,
    symbol,
    player_name: playerName.trim().slice(0, 20) || "Anonymous",
    distance_meters: distanceMeters,
    time_seconds: timeSeconds,
  });
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Main component ───────────────────────────────────────────
export default function MotoGame({ ohlcData, symbol, coinId }: MotoGameProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const stateRef    = useRef<GameState>("idle");

  // Terrain (rebuilt on resize)
  const terrainXs   = useRef<Float32Array>(new Float32Array());
  const terrainYs   = useRef<Float32Array>(new Float32Array());
  const terrainW    = useRef<number>(0);

  // Bike
  const bikeRef     = useRef<BikeState>({
    x: 0, y: 0, vx: 0, vy: 0,
    angle: 0, angularVel: 0,
    onGround: false, crashed: false, finished: false,
  });
  const throttleRef = useRef<boolean>(false);
  const crashFrames = useRef<number>(0);
  const startTime   = useRef<number>(0);
  const elapsedRef  = useRef<number>(0);

  // React state (only for overlay redraws)
  const [gameState,  setGameState]  = useState<GameState>("idle");
  const [distance,   setDistance]   = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [shaking,    setShaking]    = useState(false);
  const [showFlash,  setShowFlash]  = useState(false);
  const [bestScore,  setBestScore]  = useState<number>(() =>
    parseInt(localStorage.getItem(`moto_best_${coinId}`) || "0", 10)
  );

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nickname,    setNickname]    = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [myScoreId,   setMyScoreId]   = useState<string | null>(null);

  // ── Fetch leaderboard on mount ──────────────────────────────
  useEffect(() => {
    fetchLeaderboard(coinId).then(setLeaderboard);
  }, [coinId]);

  // ── Build terrain ───────────────────────────────────────────
  const rebuildTerrain = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const { xs, ys, totalW } = buildTerrain(ohlcData, w, h);
    terrainXs.current = xs;
    terrainYs.current = ys;
    terrainW.current  = totalW;
  }, [ohlcData]);

  // ── Spawn bike on terrain ───────────────────────────────────
  const spawnBike = useCallback(() => {
    const startX = 80;
    const startY = terrainYAt(startX, terrainXs.current, terrainYs.current) - 26;
    const spawnAngle = terrainAngleAt(startX, terrainXs.current, terrainYs.current);
    bikeRef.current = {
      x: startX, y: startY,
      vx: 0.5, vy: 0,
      angle: spawnAngle, angularVel: 0,
      onGround: true, crashed: false, finished: false,
    };
    crashFrames.current = 0;
  }, []);

  // ── ResizeObserver ──────────────────────────────────────────
  useEffect(() => {
    const canvas  = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const resize = () => {
      const w = wrapper.clientWidth;
      const h = window.innerWidth < 640 ? 280 : 360;
      canvas.width  = w;
      canvas.height = h;
      rebuildTerrain();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [rebuildTerrain]);

  // ── Input handlers ──────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        throttleRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") throttleRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
    };
  }, []);

  const handleTouchStart = useCallback(() => { throttleRef.current = true;  }, []);
  const handleTouchEnd   = useCallback(() => { throttleRef.current = false; }, []);

  // ── Game loop ───────────────────────────────────────────────
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    startTime.current = performance.now();

    const loop = (now: number) => {
      if (stateRef.current !== "playing") return;

      const elapsed = now - startTime.current;
      elapsedRef.current = elapsed;

      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const bike    = bikeRef.current;
      const xs      = terrainXs.current;
      const ys      = terrainYs.current;

      // ── Physics ────────────────────────────────────────────
      if (!bike.crashed && !bike.finished) {
        // Gravity
        bike.vy += GRAVITY;

        // Auto push + throttle
        bike.vx += AUTO_PUSH;
        if (throttleRef.current && bike.onGround) {
          const slope = terrainAngleAt(bike.x, xs, ys);
          bike.vx += Math.cos(slope) * THROTTLE_FORCE;
          // Jump if pressing while on ground
          if (bike.vy >= -1) {
            bike.vy    = JUMP_VY;
            bike.angularVel = -0.05;
          }
        }

        // Clamp horizontal velocity
        bike.vx = Math.max(MIN_VX, Math.min(MAX_VX, bike.vx));

        // Move
        bike.x += bike.vx;
        bike.y += bike.vy;

        // Ground detection
        const groundY = terrainYAt(bike.x, xs, ys) - 26;
        if (bike.y >= groundY) {
          bike.y       = groundY;
          bike.vy      = 0;
          bike.onGround = true;

          const slope  = terrainAngleAt(bike.x, xs, ys);
          // Lerp angle toward slope
          bike.angle  += (slope - bike.angle) * ANGLE_LERP;
          bike.angularVel *= 0.8;
        } else {
          bike.onGround = false;
          // Airborne: apply angular velocity
          bike.angle     += bike.angularVel;
          bike.angularVel *= 0.98;
        }

        // Crash check
        if (Math.abs(bike.angle) > CRASH_ANGLE) {
          crashFrames.current++;
          if (crashFrames.current > CRASH_FRAMES) {
            bike.crashed = true;
          }
        } else {
          crashFrames.current = 0;
        }

        // Finish check
        if (bike.x >= terrainW.current - 20) {
          bike.finished = true;
        }

        // Fall off bottom
        if (bike.y > canvasH + 60) {
          bike.crashed = true;
        }
      }

      // ── Camera ────────────────────────────────────────────
      const viewportX = Math.max(
        0,
        Math.min(terrainW.current - canvasW, bike.x - canvasW * 0.3)
      );

      // ── Render ────────────────────────────────────────────
      drawBackground(ctx, canvasW, canvasH, viewportX);
      drawTerrain(ctx, xs, ys, canvasH, viewportX);

      const screenBx = bike.x - viewportX;
      drawBike(ctx, screenBx, bike.y, bike.angle, bike.crashed);

      const dist    = Math.round(bike.x / 8);
      const prog    = bike.x / terrainW.current;
      const lsBest  = parseInt(localStorage.getItem(`moto_best_${coinId}`) || "0", 10);
      drawHUD(ctx, canvasW, elapsed, dist, lsBest, symbol.toUpperCase(), prog);

      // ── State transitions ─────────────────────────────────
      if (bike.crashed) {
        const finalDist = Math.round(bike.x / 8);
        const finalSec  = Math.round(elapsed / 1000);
        if (finalDist > lsBest) {
          localStorage.setItem(`moto_best_${coinId}`, String(finalDist));
          setBestScore(finalDist);
        }
        stateRef.current = "crashed";
        setDistance(finalDist);
        setElapsedSec(finalSec);
        setGameState("crashed");
        setShaking(true);
        setShowFlash(true);
        setTimeout(() => setShaking(false), 500);
        setTimeout(() => setShowFlash(false), 600);
        return;
      }

      if (bike.finished) {
        const finalDist = Math.round(bike.x / 8);
        const finalSec  = Math.round(elapsed / 1000);
        if (finalDist > lsBest) {
          localStorage.setItem(`moto_best_${coinId}`, String(finalDist));
          setBestScore(finalDist);
        }
        stateRef.current = "finished";
        setDistance(finalDist);
        setElapsedSec(finalSec);
        setGameState("finished");
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [coinId, symbol]);

  // ── Cleanup on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Actions ─────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    rebuildTerrain();
    spawnBike();
    setGameState("playing");
    stateRef.current = "playing";
    setDistance(0);
    setElapsedSec(0);
    setSubmitted(false);
    setNickname("");
    setMyScoreId(null);
    startLoop();
  }, [rebuildTerrain, spawnBike, startLoop]);

  const handleRestart = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    handleStart();
  }, [handleStart]);

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    const name = nickname.trim() || "Anonymous";
    await submitScore(coinId, symbol, name, distance, elapsedSec);
    const newBoard = await fetchLeaderboard(coinId);
    // Find our row
    const myRow = newBoard.find(
      r => r.player_name === name && r.distance_meters === distance
    );
    setMyScoreId(myRow?.id || null);
    setLeaderboard(newBoard);
    setSubmitting(false);
    setSubmitted(true);
  }, [submitting, submitted, nickname, coinId, symbol, distance, elapsedSec]);

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="motogame-container">
      <div
        ref={wrapperRef}
        className={`motogame-canvas-wrapper${shaking ? " shake" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        <canvas ref={canvasRef} className="motogame-canvas" />

        {/* Crash red flash */}
        {showFlash && <div className="motogame-crash-flash" />}

        {/* ── IDLE overlay ─────────────────────────────────── */}
        {gameState === "idle" && (
          <div className="motogame-idle-overlay">
            <div className="motogame-idle-card">
              <h2 className="motogame-title">🏍️ Ride the Chart</h2>
              <p className="motogame-subtitle">
                Race over {symbol.toUpperCase()}'s real price history
              </p>
              <button className="motogame-btn-start" onClick={handleStart}>
                ▶ START RIDING
              </button>

              {leaderboard.length > 0 && (
                <div className="motogame-leaderboard">
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
                        <tr
                          key={row.id}
                          className={row.id === myScoreId ? "my-score" : ""}
                        >
                          <td>
                            <span
                              className={`motogame-rank-badge${
                                i === 0 ? " gold" : i === 1 ? " silver" : i === 2 ? " bronze" : ""
                              }`}
                            >
                              {i + 1}
                            </span>
                          </td>
                          <td>{row.player_name}</td>
                          <td>{row.distance_meters}m</td>
                          <td>{fmtTime(row.time_seconds)}</td>
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
          <div className="motogame-end-overlay">
            <div className="motogame-end-card crashed">
              <h2 className="motogame-end-title crashed">💥 CRASHED!</h2>
              <div className="motogame-stats-row">
                <div className="motogame-stat">
                  <div className="motogame-stat-label">Distance</div>
                  <div className="motogame-stat-value">{distance}m</div>
                </div>
                <div className="motogame-stat">
                  <div className="motogame-stat-label">Time</div>
                  <div className="motogame-stat-value">{fmtTime(elapsedSec)}</div>
                </div>
                <div className="motogame-stat">
                  <div className="motogame-stat-label">Best</div>
                  <div className="motogame-stat-value">{bestScore}m</div>
                </div>
              </div>

              {/* Nickname + submit */}
              {!submitted ? (
                <div className="motogame-nickname-area">
                  <input
                    className="motogame-nickname-input"
                    placeholder="Your nickname..."
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    maxLength={20}
                  />
                  <button
                    className="motogame-btn motogame-btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "..." : "📤 Submit"}
                  </button>
                </div>
              ) : (
                <div className="motogame-submit-confirm">✅ Score submitted!</div>
              )}

              <div className="motogame-btn-row" style={{ marginTop: 12 }}>
                <button
                  className="motogame-btn motogame-btn-primary"
                  onClick={handleRestart}
                >
                  🔄 Try Again
                </button>
                <button
                  className="motogame-btn motogame-btn-secondary"
                  onClick={() => {
                    cancelAnimationFrame(rafRef.current);
                    stateRef.current = "idle";
                    setGameState("idle");
                  }}
                >
                  Exit
                </button>
              </div>

              {/* Mini leaderboard after crash */}
              {leaderboard.length > 0 && (
                <div className="motogame-leaderboard" style={{ marginTop: 16 }}>
                  <div className="motogame-leaderboard-title">🏆 Leaderboard</div>
                  <table className="motogame-leaderboard-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Player</th><th>Distance</th><th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.slice(0, 5).map((row, i) => (
                        <tr key={row.id} className={row.id === myScoreId ? "my-score" : ""}>
                          <td>
                            <span className={`motogame-rank-badge${i===0?" gold":i===1?" silver":i===2?" bronze":""}`}>
                              {i + 1}
                            </span>
                          </td>
                          <td>{row.player_name}</td>
                          <td>{row.distance_meters}m</td>
                          <td>{fmtTime(row.time_seconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FINISHED overlay ─────────────────────────────── */}
        {gameState === "finished" && (
          <div className="motogame-end-overlay">
            <div className="motogame-end-card">
              <h2 className="motogame-end-title finished">🏁 FINISHED!</h2>
              <div className="motogame-stats-row">
                <div className="motogame-stat">
                  <div className="motogame-stat-label">Distance</div>
                  <div className="motogame-stat-value">{distance}m</div>
                </div>
                <div className="motogame-stat">
                  <div className="motogame-stat-label">Time</div>
                  <div className="motogame-stat-value">{fmtTime(elapsedSec)}</div>
                </div>
              </div>

              {!submitted ? (
                <div className="motogame-nickname-area">
                  <input
                    className="motogame-nickname-input"
                    placeholder="Your nickname..."
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    maxLength={20}
                  />
                  <button
                    className="motogame-btn motogame-btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "..." : "📤 Submit Score"}
                  </button>
                </div>
              ) : (
                <div className="motogame-submit-confirm">🎉 Score submitted!</div>
              )}

              <div className="motogame-btn-row" style={{ marginTop: 12 }}>
                <button className="motogame-btn motogame-btn-primary" onClick={handleRestart}>
                  🔄 Play Again
                </button>
                <button
                  className="motogame-btn motogame-btn-secondary"
                  onClick={() => {
                    cancelAnimationFrame(rafRef.current);
                    stateRef.current = "idle";
                    setGameState("idle");
                  }}
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div className="motogame-controls-hint">
        <span><kbd>SPACE</kbd> Throttle / Jump</span>
        <span>· Tap canvas on mobile</span>
        <span>· Don't flip over!</span>
      </div>
    </div>
  );
}
