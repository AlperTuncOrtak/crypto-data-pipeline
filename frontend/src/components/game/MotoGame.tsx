import React, { useEffect, useRef, useCallback } from "react";

interface MotoGameProps {
  priceData: number[];
  symbol: string;
  onGameOver: (distance: number) => void;
  onDistanceUpdate: (distance: number) => void;
  restartTrigger: number;
}

export default function MotoGame({
  priceData,
  symbol,
  onGameOver,
  onDistanceUpdate,
  restartTrigger,
}: MotoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Stop previous game loop if any
    if (gameRef.current?.raf) {
      cancelAnimationFrame(gameRef.current.raf);
    }
    if (gameRef.current?.keydownHandler) {
      window.removeEventListener("keydown", gameRef.current.keydownHandler);
      window.removeEventListener("keyup", gameRef.current.keyupHandler);
    }

    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;

    // ──────────────────────────────────────────────
    // 1. TERRAIN FROM PRICE DATA
    // ──────────────────────────────────────────────
    const PIXELS_PER_POINT = 180;
    const Y_MIN_PX = H * 0.15;   // top 15%
    const Y_MAX_PX = H * 0.82;   // bottom 82%

    // Use fallback sine terrain if no price data
    const rawPrices: number[] =
      priceData && priceData.length > 4
        ? priceData
        : Array.from({ length: 60 }, (_, i) =>
            100 +
            Math.sin(i / 6) * 30 +
            Math.sin(i / 2.5) * 10 +
            Math.cos(i / 4) * 15
          );

    // Moving average smoothing (window = 3)
    const smooth = (arr: number[], w = 3): number[] =>
      arr.map((_, i) => {
        const slice = arr.slice(Math.max(0, i - w), i + w + 1);
        return slice.reduce((s, v) => s + v, 0) / slice.length;
      });

    const smoothed = smooth(smooth(rawPrices, 3), 3);
    const minP = Math.min(...smoothed);
    const maxP = Math.max(...smoothed);

    const priceToY = (p: number) => {
      if (maxP === minP) return (Y_MIN_PX + Y_MAX_PX) / 2;
      return Y_MAX_PX - ((p - minP) / (maxP - minP)) * (Y_MAX_PX - Y_MIN_PX);
    };

    // Build terrain points: each price = PIXELS_PER_POINT apart
    const terrainPoints: { x: number; y: number }[] = smoothed.map((p, i) => ({
      x: i * PIXELS_PER_POINT,
      y: priceToY(p),
    }));
    const TOTAL_WIDTH = terrainPoints[terrainPoints.length - 1].x;

    const getTerrainY = (worldX: number): number => {
      // Extrapolate at boundaries
      if (worldX <= 0) return terrainPoints[0].y;
      if (worldX >= TOTAL_WIDTH) return terrainPoints[terrainPoints.length - 1].y;
      const idx = worldX / PIXELS_PER_POINT;
      const i0 = Math.floor(idx);
      const i1 = Math.min(i0 + 1, terrainPoints.length - 1);
      const t = idx - i0;
      // Cosine interpolation for smoothness
      const mu = (1 - Math.cos(t * Math.PI)) / 2;
      return terrainPoints[i0].y * (1 - mu) + terrainPoints[i1].y * mu;
    };

    const getTerrainAngle = (worldX: number): number => {
      const dx = 2;
      const dy = getTerrainY(worldX + dx) - getTerrainY(worldX - dx);
      return Math.atan2(dy, dx * 2);
    };

    // ──────────────────────────────────────────────
    // 2. BIKE STATE
    // ──────────────────────────────────────────────
    const WHEEL_R = 18;
    const AXLE_LEN = 55; // distance between wheels
    const CHASSIS_H = 32; // rider height above axle center

    let worldX = AXLE_LEN / 2 + 20; // back wheel world X
    let vy = 0;
    let bikeAngle = 0; // visual tilt angle of bike body
    let angularVel = 0;

    const getGroundY = () => getTerrainY(worldX);
    const getContactY = () => getGroundY() - WHEEL_R;

    let posY = getContactY();
    let vely = 0;
    let onGround = false;

    let cameraX = 0;
    let score = 0;
    let startTime = Date.now();
    let gameOver = false;

    const GRAVITY = 0.55;
    const FRICTION = 0.88;
    const TRACTION = 0.7;
    const JUMP_POWER = -9;
    const ENGINE_POWER = 0.45;
    const MAX_VX = 12;

    let vx = 0;
    let jumpPressed = false;
    const keys: Record<string, boolean> = {};

    // ──────────────────────────────────────────────
    // 3. HIGH SCORE from localStorage
    // ──────────────────────────────────────────────
    const HS_KEY = `moto_hs_${symbol}`;
    let highScore = parseInt(localStorage.getItem(HS_KEY) || "0", 10);

    // ──────────────────────────────────────────────
    // 4. INPUT
    // ──────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (onGround) { vely = JUMP_POWER; onGround = false; }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Touch support
    const onTouchStart = () => {
      if (onGround) { vely = JUMP_POWER; onGround = false; }
    };
    canvas.addEventListener("touchstart", onTouchStart);

    // ──────────────────────────────────────────────
    // 5. DRAW HELPERS
    // ──────────────────────────────────────────────
    const drawTerrain = () => {
      ctx.save();
      ctx.beginPath();

      // Build clipped terrain path in screen coords
      const startI = Math.max(0, Math.floor((cameraX - 100) / PIXELS_PER_POINT));
      const endI = Math.min(terrainPoints.length - 1, Math.ceil((cameraX + W + 100) / PIXELS_PER_POINT));

      ctx.moveTo(terrainPoints[startI].x - cameraX, terrainPoints[startI].y);
      for (let i = startI + 1; i <= endI; i++) {
        ctx.lineTo(terrainPoints[i].x - cameraX, terrainPoints[i].y);
      }

      // Close bottom
      ctx.lineTo(terrainPoints[endI].x - cameraX, H + 20);
      ctx.lineTo(terrainPoints[startI].x - cameraX, H + 20);
      ctx.closePath();

      // Dark fill with subtle gradient
      const grad = ctx.createLinearGradient(0, Y_MAX_PX, 0, H);
      grad.addColorStop(0, "rgba(0,255,128,0.08)");
      grad.addColorStop(1, "rgba(0,255,128,0.02)");
      ctx.fillStyle = grad;
      ctx.fill();

      // Neon green stroke
      ctx.beginPath();
      ctx.moveTo(terrainPoints[startI].x - cameraX, terrainPoints[startI].y);
      for (let i = startI + 1; i <= endI; i++) {
        ctx.lineTo(terrainPoints[i].x - cameraX, terrainPoints[i].y);
      }
      ctx.strokeStyle = "#00ff80";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#00ff80";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const drawGrid = () => {
      ctx.save();
      ctx.strokeStyle = "rgba(0,255,128,0.04)";
      ctx.lineWidth = 1;
      const gridSpacing = 80;
      for (let x = -(cameraX % gridSpacing); x < W; x += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.restore();
    };

    const drawBike = (screenX: number, screenY: number, angle: number) => {
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(angle);

      const glow = (color: string, blur: number) => {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
      };

      // Back wheel
      ctx.beginPath();
      ctx.arc(-AXLE_LEN / 2, 0, WHEEL_R, 0, Math.PI * 2);
      glow("#00f0ff", 14);
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(0,240,255,0.12)";
      ctx.fill();

      // Front wheel
      ctx.beginPath();
      ctx.arc(AXLE_LEN / 2, 0, WHEEL_R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();

      // Spokes
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(-AXLE_LEN / 2, 0, WHEEL_R * 0.55, a, a + 0.05);
        ctx.moveTo(-AXLE_LEN / 2, 0);
        ctx.lineTo(-AXLE_LEN / 2 + Math.cos(a) * (WHEEL_R - 3), Math.sin(a) * (WHEEL_R - 3));
        ctx.strokeStyle = "rgba(0,240,255,0.5)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(AXLE_LEN / 2, 0);
        ctx.lineTo(AXLE_LEN / 2 + Math.cos(a) * (WHEEL_R - 3), Math.sin(a) * (WHEEL_R - 3));
        ctx.stroke();
      }

      // Frame (chassis body)
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 3;

      // Swingarm (rear)
      ctx.beginPath();
      ctx.moveTo(-AXLE_LEN / 2, 0);
      ctx.lineTo(-8, -CHASSIS_H * 0.5);
      ctx.stroke();

      // Main frame
      ctx.beginPath();
      ctx.moveTo(-8, -CHASSIS_H * 0.5);
      ctx.lineTo(AXLE_LEN / 2, 0);
      ctx.stroke();

      // Top tube
      ctx.beginPath();
      ctx.moveTo(-8, -CHASSIS_H * 0.5);
      ctx.lineTo(14, -CHASSIS_H);
      ctx.stroke();

      // Fork
      ctx.beginPath();
      ctx.moveTo(14, -CHASSIS_H);
      ctx.lineTo(AXLE_LEN / 2, 0);
      ctx.stroke();

      // Seat / tank
      ctx.beginPath();
      ctx.moveTo(-8, -CHASSIS_H * 0.5);
      ctx.quadraticCurveTo(-2, -CHASSIS_H * 0.85, 8, -CHASSIS_H * 0.7);
      ctx.strokeStyle = "rgba(0,240,255,0.6)";
      ctx.lineWidth = 5;
      ctx.stroke();

      // Rider body
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#fff";

      // Torso
      ctx.strokeStyle = "#e0e8ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-2, -CHASSIS_H * 0.75);
      ctx.lineTo(4, -CHASSIS_H * 1.35);
      ctx.stroke();

      // Head (helmet)
      ctx.beginPath();
      ctx.arc(4, -CHASSIS_H * 1.5, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#00f0ff";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arm
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#aac0d8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, -CHASSIS_H * 1.3);
      ctx.lineTo(14, -CHASSIS_H * 0.9);
      ctx.stroke();

      ctx.restore();
    };

    // ──────────────────────────────────────────────
    // 6. GAME LOOP
    // ──────────────────────────────────────────────
    let raf: number;

    const tick = () => {
      if (gameOver) return;

      // ── Physics ──
      const terrainAngle = getTerrainAngle(worldX);
      const slopeCos = Math.cos(terrainAngle);
      const slopeSin = Math.sin(terrainAngle);

      // Engine / brake input (Right arrow / D to go fast, also always auto-accelerate slightly)
      let engine = ENGINE_POWER * 0.4; // always rolling forward
      if (keys["ArrowRight"] || keys["KeyD"] || keys["ArrowUp"] || keys["KeyW"]) engine = ENGINE_POWER;
      if (keys["ArrowLeft"] || keys["KeyA"]) engine = -ENGINE_POWER * 0.6;

      // Apply engine force along slope
      if (onGround) {
        vx += slopeCos * engine * TRACTION;
        vely += slopeSin * engine * TRACTION;
      }

      // Air tilt
      let tilt = 0;
      if (keys["ArrowLeft"] || keys["KeyA"]) tilt = -0.025;
      if (keys["ArrowRight"] || keys["KeyD"]) tilt = 0.018;
      angularVel += tilt;
      angularVel *= 0.88;
      bikeAngle += angularVel;

      // Gravity
      vely += GRAVITY;

      // Clamp horizontal speed
      vx = Math.max(-MAX_VX, Math.min(MAX_VX, vx));

      // Friction when on ground
      if (onGround) {
        vx *= FRICTION;
      }

      // Update position
      worldX += vx;
      posY += vely;

      // Ground collision
      const groundY = getContactY();
      if (posY >= groundY) {
        posY = groundY;
        vely = 0;
        onGround = true;

        // Align bike angle to terrain when on ground
        const targetAngle = terrainAngle;
        const angleDiff = targetAngle - bikeAngle;
        bikeAngle += angleDiff * 0.25;
        angularVel *= 0.6;
      } else {
        onGround = false;
      }

      // Camera smoothly follows bike
      const targetCamX = worldX - W * 0.35;
      cameraX += (targetCamX - cameraX) * 0.08;
      cameraX = Math.max(0, cameraX);

      // Score = distance in "meters" (pixels / 10)
      score = Math.max(score, Math.round(worldX / 10));
      onDistanceUpdate(score);

      // Flip detection — if bike angle exceeds ±70 degrees, crashed
      const absAngle = Math.abs(bikeAngle);
      if (absAngle > 1.22) { // 70 deg in radians
        endGame();
        return;
      }

      // Fell off track (went backward off screen or below canvas)
      if (posY > H + 100) {
        endGame();
        return;
      }

      // Win / reached end
      if (worldX >= TOTAL_WIDTH - AXLE_LEN) {
        endGame();
        return;
      }

      // ── Draw ──
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, W, H);

      drawGrid();
      drawTerrain();

      const screenX = worldX - cameraX;
      const screenY = posY;
      drawBike(screenX, screenY, bikeAngle);

      // HUD
      drawHUD();

      raf = requestAnimationFrame(tick);
    };

    const drawHUD = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const mins = Math.floor(elapsed / 60);
      const secs = (elapsed % 60).toFixed(1).padStart(4, "0");
      const timeStr = `${mins}:${secs}`;

      // Coin symbol top left
      ctx.save();
      ctx.font = "bold 22px 'Courier New', monospace";
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 12;
      ctx.fillText(`🏍 ${symbol}`, 20, 36);

      // Timer top center
      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "var(--text-secondary)";
      ctx.shadowBlur = 8;
      ctx.textAlign = "center";
      ctx.fillText(timeStr, W / 2, 36);

      // Distance top right
      ctx.textAlign = "right";
      ctx.font = "bold 22px 'Courier New', monospace";
      ctx.fillStyle = "#00ff80";
      ctx.shadowColor = "#00ff80";
      ctx.shadowBlur = 12;
      ctx.fillText(`${score}m`, W - 20, 36);

      // High score
      ctx.font = "13px 'Courier New', monospace";
      ctx.fillStyle = "rgba(0,255,128,0.5)";
      ctx.shadowBlur = 0;
      ctx.fillText(`BEST: ${highScore}m`, W - 20, 56);

      // Controls hint at bottom
      ctx.textAlign = "center";
      ctx.font = "12px 'Courier New', monospace";
      ctx.fillStyle = "var(--text-muted)";
      ctx.fillText("SPACE / W — Jump  •  A/D — Tilt  •  →/D — Accelerate", W / 2, H - 16);

      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const endGame = () => {
      gameOver = true;
      cancelAnimationFrame(raf);

      if (score > highScore) {
        highScore = score;
        localStorage.setItem(HS_KEY, String(highScore));
      }

      // Draw end screen
      ctx.save();
      ctx.fillStyle = "rgba(13,17,23,0.7)";
      ctx.fillRect(0, 0, W, H);

      ctx.font = "bold 72px 'Courier New', monospace";
      ctx.fillStyle = "#e74c3c";
      ctx.shadowColor = "#e74c3c";
      ctx.shadowBlur = 40;
      ctx.textAlign = "center";
      ctx.fillText("CRASHED", W / 2, H / 2 - 60);

      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 16;
      ctx.fillText(`Distance: ${score}m`, W / 2, H / 2);

      if (score >= highScore && score > 0) {
        ctx.font = "bold 18px 'Courier New', monospace";
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 12;
        ctx.fillText("🏆 NEW BEST!", W / 2, H / 2 + 40);
      }

      ctx.font = "bold 20px 'Courier New', monospace";
      ctx.fillStyle = "var(--text-secondary)";
      ctx.shadowBlur = 0;
      ctx.fillText("Press R or click RESTART", W / 2, H / 2 + 90);
      ctx.restore();

      onGameOver(score);
    };

    // Store refs for cleanup
    gameRef.current = {
      raf,
      keydownHandler: onKeyDown,
      keyupHandler: onKeyUp,
      touchHandler: onTouchStart,
      canvas,
    };

    // R key to restart
    const onRestart = (e: KeyboardEvent) => {
      if (e.code === "KeyR" && gameOver) startGame();
    };
    window.addEventListener("keydown", onRestart);

    raf = requestAnimationFrame(tick);
    gameRef.current.raf = raf;

  }, [priceData, symbol, onGameOver, onDistanceUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth || window.innerWidth;
    canvas.height = parent.clientHeight || window.innerHeight;
    startGame();

    const handleResize = () => {
      canvas.width = parent.clientWidth || window.innerWidth;
      canvas.height = parent.clientHeight || window.innerHeight;
      startGame();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (gameRef.current?.raf) cancelAnimationFrame(gameRef.current.raf);
      if (gameRef.current?.keydownHandler) {
        window.removeEventListener("keydown", gameRef.current.keydownHandler);
        window.removeEventListener("keyup", gameRef.current.keyupHandler);
      }
      if (gameRef.current?.canvas && gameRef.current?.touchHandler) {
        gameRef.current.canvas.removeEventListener("touchstart", gameRef.current.touchHandler);
      }
    };
  }, [startGame, restartTrigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
