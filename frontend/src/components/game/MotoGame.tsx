import React, { useEffect, useRef } from "react";

interface MotoGameProps {
  onScoreUpdate: (dist: number, timeStr: string) => void;
  onGameOver: () => void;
  isPaused: boolean;
  onRestart: () => void;
  restartTrigger: number;
  chartData?: { time: string; price: number }[];
}

export default function MotoGame({
  onScoreUpdate,
  onGameOver,
  isPaused,
  restartTrigger,
  chartData,
}: MotoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // --- CHART TERRAIN SETUP ---
    let prices: number[] = [];
    let minP = 0, maxP = 0;
    const pixelsPerPoint = 150; // Each data point is 150 pixels apart
    
    if (chartData && chartData.length > 1) {
      prices = chartData.map(d => d.price);
      minP = Math.min(...prices);
      maxP = Math.max(...prices);
      if (maxP === minP) maxP = minP + 1; // avoid division by zero
    }

    // --- GAME STATE ---
    let animationId: number;
    let isGameOver = false;
    let startTime = Date.now();
    let distance = 0;

    // --- INPUT ---
    const keys = { w: false, s: false, a: false, d: false, up: false, down: false, left: false, right: false };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keys.up = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keys.down = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keys.left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keys.right = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") keys.up = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") keys.down = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") keys.left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") keys.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // --- TERRAIN ---
    const getTerrainHeight = (x: number) => {
      if (prices.length > 1) {
        // Use chart data
        let idx = x / pixelsPerPoint;
        if (idx < 0) idx = 0;
        
        // If beyond data, extend flatly
        if (idx >= prices.length - 1) {
          idx = prices.length - 1;
        }

        const i0 = Math.floor(idx);
        const i1 = Math.min(i0 + 1, prices.length - 1);
        const fract = idx - i0;

        const p0 = prices[i0];
        const p1 = prices[i1];
        
        // Smooth interpolation (cosine)
        const mu2 = (1 - Math.cos(fract * Math.PI)) / 2;
        const pInterp = p0 * (1 - mu2) + p1 * mu2;

        // Map price to height: maxPrice -> 100, minPrice -> 600
        const yTop = 150;
        const yBottom = Math.max(600, height * 0.8);
        return yBottom - ((pInterp - minP) / (maxP - minP)) * (yBottom - yTop);
      } else {
        // Fallback to sine waves
        return (
          Math.sin(x / 400) * 120 +
          Math.sin(x / 150) * 50 +
          Math.sin(x / 60) * 15 +
          300
        );
      }
    };

    const getTerrainNormal = (x: number) => {
      const dx = 1;
      const dy = getTerrainHeight(x + dx) - getTerrainHeight(x - dx);
      const mag = Math.sqrt(dx * 2 * dx * 2 + dy * dy);
      return { nx: -(dy) / mag, ny: (dx * 2) / mag, angle: Math.atan2(dy, dx * 2) };
    };

    // --- PHYSICS ENGINE ---
    const GRAVITY = 0.4;
    const FRICTION = 0.99;
    const WHEEL_RADIUS = 16;

    class Particle {
      x: number;
      y: number;
      vx: number = 0;
      vy: number = 0;
      radius: number;
      isChassis: boolean;

      constructor(x: number, y: number, r: number, isChassis = false) {
        this.x = x;
        this.y = y;
        this.radius = r;
        this.isChassis = isChassis;
      }

      update() {
        this.vy += GRAVITY;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        this.x += this.vx;
        this.y += this.vy;

        // Collision with terrain
        const ty = getTerrainHeight(this.x);
        if (this.y + this.radius > ty) {
          if (this.isChassis) {
            // CRASH
            isGameOver = true;
            onGameOver();
          }

          // Push out of ground
          this.y = ty - this.radius;

          // Align velocity with ground slope
          const { angle } = getTerrainNormal(this.x);
          
          // Simple collision response
          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          // If we hit hard, kill some vertical speed
          this.vy *= 0.5;

          // Apply friction from ground
          this.vx *= 0.95;
        }
      }
    }

    class Spring {
      p1: Particle;
      p2: Particle;
      length: number;
      stiffness: number;

      constructor(p1: Particle, p2: Particle, length: number, stiffness: number = 0.5) {
        this.p1 = p1;
        this.p2 = p2;
        this.length = length;
        this.stiffness = stiffness;
      }

      update() {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const diff = (this.length - dist) / dist;
        
        const offsetX = dx * diff * 0.5 * this.stiffness;
        const offsetY = dy * diff * 0.5 * this.stiffness;

        this.p1.x -= offsetX;
        this.p1.y -= offsetY;
        this.p2.x += offsetX;
        this.p2.y += offsetY;
      }
    }

    // --- MOTORCYCLE SETUP ---
    // A wireframe bike: 2 wheels and a chassis center
    const w1 = new Particle(100, 100, WHEEL_RADIUS); // back wheel
    const w2 = new Particle(180, 100, WHEEL_RADIUS); // front wheel
    const chassis = new Particle(140, 60, 10, true); // rider/chassis head

    const springs = [
      new Spring(w1, w2, 80, 0.8), // wheelbase
      new Spring(w1, chassis, 65, 0.4), // rear suspension
      new Spring(w2, chassis, 65, 0.4), // front suspension
    ];

    const particles = [w1, w2, chassis];

    // --- GAME LOOP ---
    const update = () => {
      if (isGameOver || isPaused) return;

      // Controls
      let enginePower = 0;
      if (keys.up) enginePower = 1.8;
      if (keys.down) enginePower = -1.5; // brake/reverse

      // Apply torque/engine to back wheel if on ground
      const tyBack = getTerrainHeight(w1.x);
      if (w1.y + w1.radius >= tyBack - 2) {
        const { angle } = getTerrainNormal(w1.x);
        w1.vx += Math.cos(angle) * enginePower;
        w1.vy += Math.sin(angle) * enginePower;
      }

      // Air tilt (rotation)
      let tiltForce = 0;
      if (keys.left) tiltForce = -0.5;
      if (keys.right) tiltForce = 0.5;

      if (tiltForce !== 0) {
        const cx = (w1.x + w2.x) / 2;
        const cy = (w1.y + w2.y) / 2;
        
        w1.vy += tiltForce;
        w2.vy -= tiltForce;
      }

      // Physics integration
      particles.forEach(p => p.update());
      
      // Satisfy constraints multiple times for stability
      for (let i = 0; i < 5; i++) {
        springs.forEach(s => s.update());
      }

      // Track distance
      distance = Math.max(0, w1.x - 100);

      // Update HUD
      const now = Date.now();
      const diff = now - startTime;
      const ms = Math.floor((diff % 1000) / 100);
      const sec = Math.floor((diff / 1000) % 60);
      const min = Math.floor(diff / 60000);
      const timeStr = `${min}:${sec.toString().padStart(2, "0")}.${ms}`;
      
      onScoreUpdate(Math.floor(distance / 10), timeStr);
    };

    const draw = () => {
      if (!ctx || !canvas) return;
      
      // Update canvas size if resized
      if (canvas.clientWidth !== width || canvas.clientHeight !== height) {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
      }

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Camera follows the bike
      const camX = chassis.x - width / 3;
      const camY = chassis.y - height / 2;

      ctx.save();
      // Translate for camera
      // Smooth vertical camera tracking (less jittery)
      const smoothCamY = Math.max(0, camY - 100); 
      ctx.translate(-camX, -smoothCamY);

      // Draw Terrain
      ctx.beginPath();
      // start drawing from left of camera to right of camera
      const startX = Math.floor(camX / 20) * 20 - 20;
      const endX = startX + width + 40;
      
      ctx.moveTo(startX, height + smoothCamY + 1000);
      ctx.lineTo(startX, getTerrainHeight(startX));

      for (let x = startX; x <= endX; x += 20) {
        ctx.lineTo(x, getTerrainHeight(x));
      }
      ctx.lineTo(endX, height + smoothCamY + 1000);
      
      ctx.fillStyle = "#0f0f1a"; // Dark navy/grey fill
      ctx.fill();

      // Draw Neon line on top
      ctx.beginPath();
      for (let x = startX; x <= endX; x += 20) {
        if (x === startX) ctx.moveTo(x, getTerrainHeight(x));
        else ctx.lineTo(x, getTerrainHeight(x));
      }
      ctx.strokeStyle = "#00f0ff"; // Neon Cyan
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Draw Motorcycle Wireframe
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;

      // Suspension Springs (Lines)
      ctx.beginPath();
      ctx.moveTo(w1.x, w1.y);
      ctx.lineTo(chassis.x, chassis.y);
      ctx.lineTo(w2.x, w2.y);
      ctx.stroke();

      // Chassis connection
      ctx.beginPath();
      ctx.moveTo(w1.x, w1.y);
      ctx.lineTo(w2.x, w2.y);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.stroke();

      // Wheels
      const drawWheel = (p: Particle) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#020617";
        ctx.fill();
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw spokes based on distance to simulate rotation
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.x / p.radius); // fake rotation
        ctx.beginPath();
        ctx.moveTo(-p.radius, 0);
        ctx.lineTo(p.radius, 0);
        ctx.moveTo(0, -p.radius);
        ctx.lineTo(0, p.radius);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
        ctx.stroke();
        ctx.restore();
      };

      drawWheel(w1);
      drawWheel(w2);

      // Rider head (Chassis)
      ctx.beginPath();
      ctx.arc(chassis.x, chassis.y, chassis.radius, 0, Math.PI * 2);
      ctx.fillStyle = isGameOver ? "#e74c3c" : "#fff";
      ctx.fill();

      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPaused, restartTrigger, onGameOver, onScoreUpdate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "#020617", // Main theme bg
      }}
    />
  );
}
