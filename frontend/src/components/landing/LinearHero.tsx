import { motion, useScroll, useTransform, useMotionValue, useSpring, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, Activity, Radio, Database, TrendingUp, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useMarket } from "../../hooks/useMarket";

// ─── Animated 3D Globe Canvas ────────────────────────────────────────────────
function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = (canvas.width = 520);
    const H = (canvas.height = 520);
    const cx = W / 2, cy = H / 2, R = 190;
    let rot = 0;

    const pts: { lat: number; lng: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < 200; i++) {
      pts.push({
        lat: (Math.random() - 0.5) * Math.PI,
        lng: Math.random() * Math.PI * 2,
        size: Math.random() * 1.6 + 0.4,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    const gridLines: { lat?: number; lng?: number; isLat: boolean }[] = [];
    for (let i = -75; i <= 75; i += 25) gridLines.push({ lat: (i * Math.PI) / 180, isLat: true });
    for (let i = 0; i < 360; i += 30) gridLines.push({ lng: (i * Math.PI) / 180, isLat: false });

    function project(lat: number, lng: number) {
      const x3 = Math.cos(lat) * Math.cos(lng + rot);
      const y3 = Math.sin(lat);
      const z3 = Math.cos(lat) * Math.sin(lng + rot);
      return { x: cx + x3 * R, y: cy - y3 * R, z: z3 };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Outer ambient glow
      const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.6);
      outerGlow.addColorStop(0, "rgba(99,102,241,0.0)");
      outerGlow.addColorStop(0.6, "rgba(99,102,241,0.06)");
      outerGlow.addColorStop(1, "rgba(99,102,241,0.14)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Sphere base
      const sphere = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, 0, cx, cy, R);
      sphere.addColorStop(0, "rgba(20, 18, 35, 0.92)");
      sphere.addColorStop(1, "rgba(7, 6, 14, 0.98)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = sphere;
      ctx.fill();

      // Clip to sphere for grid lines
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Grid lines
      gridLines.forEach(({ lat, lng, isLat }) => {
        ctx.beginPath();
        let firstVisible = true;
        const steps = 80;
        for (let s = 0; s <= steps; s++) {
          const t = (s / steps) * Math.PI * 2;
          const pLat = isLat ? lat! : t - Math.PI;
          const pLng = isLat ? t : lng!;
          const { x, y, z } = project(pLat, pLng);
          if (z < -0.05) { firstVisible = true; continue; }
          if (firstVisible) { ctx.moveTo(x, y); firstVisible = false; }
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(99,102,241,0.09)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });
      ctx.restore();

      // Points (clipped to front hemisphere)
      pts.forEach((pt) => {
        const { x, y, z } = project(pt.lat, pt.lng);
        if (z < 0) return;
        const b = 0.35 + z * 0.65;
        // Point glow
        const g = ctx.createRadialGradient(x, y, 0, x, y, pt.size * 4);
        g.addColorStop(0, `rgba(160,170,255,${pt.opacity * b * 0.8})`);
        g.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, pt.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        // Point dot
        ctx.beginPath();
        ctx.arc(x, y, pt.size * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,220,255,${pt.opacity * b})`;
        ctx.fill();
      });

      // Atmosphere rim
      const rim = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R * 1.05);
      rim.addColorStop(0, "rgba(99,102,241,0)");
      rim.addColorStop(0.7, "rgba(99,102,241,0.05)");
      rim.addColorStop(1, "rgba(140,120,255,0.22)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = rim;
      ctx.fill();

      rot += 0.0018;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} width={520} height={520} className="w-full h-full" />;
}

// ─── Animated Number Counter ──────────────────────────────────────────────────
function AnimCounter({ to, prefix = "", suffix = "", dec = 0 }: { to: number; prefix?: string; suffix?: string; dec?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, to, { duration: 1.8, ease: "easeOut", onUpdate: setV });
    return () => ctrl.stop();
  }, [to]);
  return <>{prefix}{v.toFixed(dec)}{suffix}</>;
}

// ─── Metric Strip ─────────────────────────────────────────────────────────────
function MetricStrip({ coins }: { coins?: any[] }) {
  const vol = (coins?.reduce((s, c) => s + (Number(c.total_volume) || 0), 0) || 0) / 1e9;
  const mcap = (coins?.reduce((s, c) => s + (Number(c.market_cap) || 0), 0) || 0) / 1e12;

  const metrics = [
    { label: "24h Volume",     num: vol,   prefix: "$", suffix: "B", dec: 1, Icon: BarChart3 },
    { label: "Market Cap",     num: mcap,  prefix: "$", suffix: "T", dec: 2, Icon: Database },
    { label: "Active Feeds",   num: 148,   prefix: "",  suffix: "",  dec: 0, Icon: Radio },
    { label: "24h Signals",    num: 3820,  prefix: "",  suffix: "+", dec: 0, Icon: Zap },
    { label: "Avg Latency",    num: 14,    prefix: "",  suffix: "ms",dec: 0, Icon: Activity },
    { label: "AI Win Rate",    num: 68,    prefix: "",  suffix: "%", dec: 0, Icon: TrendingUp },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.55 }}
      className="relative z-10 w-full border-t border-b border-white/[0.06] bg-[#08080d]/80 backdrop-blur-xl"
    >
      <div className="max-w-[1200px] mx-auto flex items-stretch divide-x divide-white/[0.06] overflow-x-auto scrollbar-none">
        {metrics.map(({ label, num, prefix, suffix, dec, Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.06 }}
            whileHover={{ backgroundColor: "rgba(99,102,241,0.05)" }}
            className="flex-1 min-w-[140px] flex flex-col items-center justify-center py-5 px-4 gap-1.5 cursor-default transition-colors"
          >
            <Icon size={13} className="text-[var(--accent)] opacity-60" />
            <div className="text-[1.15rem] font-bold text-[var(--text-main)] font-mono tabular-nums tracking-tight leading-none">
              {num > 0 ? <AnimCounter to={num} prefix={prefix} suffix={suffix} dec={dec} /> : <span>{prefix}—{suffix}</span>}
            </div>
            <div className="text-[10px] text-[var(--text-faint)] uppercase tracking-[0.14em] font-medium text-center">{label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function LinearHero({ onAuthOpen }: { onAuthOpen?: (mode: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: coins } = useMarket(50);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 18 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width / 2) * 0.018);
    mouseY.set((e.clientY - rect.top - rect.height / 2) * 0.018);
  };

  return (
    <section className="relative flex flex-col overflow-hidden bg-[var(--bg-base)]" onMouseMove={handleMouseMove}>

      {/* ── Ambient radial glows ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.22, 0.15] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] left-[15%] w-[75vw] h-[75vw] max-w-[900px] max-h-[900px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(79,70,229,0.06) 55%, transparent 75%)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.07, 0.13, 0.07] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute top-[25%] -right-[8%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)" }}
        />
        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      {/* ── Two-column content ── */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center min-h-[92vh] max-w-[1200px] mx-auto w-full px-6 lg:px-10 pt-32 pb-16 gap-10 lg:gap-4">

        {/* LEFT: Text + CTAs */}
        <div className="flex-1 flex flex-col items-start max-w-[560px]">

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.04, y: -1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md mb-8 cursor-default"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--positive)] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--positive)]" />
            </span>
            <span className="text-[10px] tracking-[0.2em] font-semibold text-[var(--text-muted)] uppercase font-mono">
              Live · Build v2.5.1
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 36, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.95, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-[2.9rem] sm:text-[3.7rem] lg:text-[4.2rem] leading-[1.04] tracking-[-0.03em] font-black text-[var(--text-main)] mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Algorithmic Crypto
            <br />
            <span className="relative inline-block">
              <motion.span
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-main)] via-[var(--accent)] to-indigo-300 bg-[length:200%_auto]"
              >
                Analytics.
              </motion.span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="text-[16px] md:text-[17px] text-[var(--text-muted)] leading-relaxed mb-10 max-w-[430px]"
          >
            Institutional-grade execution, AI anomaly detection, and tick-level backtesting — the terminal built for the absolute frontier.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2, boxShadow: "0 0 36px rgba(99,102,241,0.45)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { if (user) navigate("/dashboard"); else if (onAuthOpen) onAuthOpen("signup"); }}
              className="relative flex items-center gap-2.5 h-12 pl-6 pr-5 rounded-[12px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-[14px] transition-colors shadow-[0_4px_28px_rgba(99,102,241,0.32)] overflow-hidden"
            >
              <span className="relative z-10">Get Started</span>
              <ArrowRight size={16} className="relative z-10" />
              <motion.div
                animate={{ x: ["-120%", "220%"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 4.5 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/docs")}
              className="flex items-center gap-2.5 h-12 px-6 rounded-[12px] border border-white/[0.1] bg-white/[0.03] backdrop-blur-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-white/[0.18] hover:bg-white/[0.06] font-medium text-[14px] transition-all"
            >
              Read Docs
            </motion.button>
          </motion.div>

          {/* Trust tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.52 }}
            className="flex items-center gap-5 mt-8"
          >
            {["Non-custodial", "Real-time", "Audited"].map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.52 + i * 0.07 }}
                className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]"
              >
                <span className="w-1 h-1 rounded-full bg-[var(--positive)] opacity-60" />
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* RIGHT: Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          style={{ x: springX, y: springY }}
          className="flex-1 relative flex items-center justify-center w-full max-w-[520px] aspect-square"
        >
          {/* Rotation rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[3%] rounded-full border border-white/[0.04]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[9%] rounded-full border border-[var(--accent)]/[0.07]"
          />

          {/* Floating data pill — BTC price */}
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.06 }}
            className="absolute top-[8%] right-[4%] bg-white/[0.05] border border-white/[0.09] backdrop-blur-xl rounded-2xl px-4 py-3 shadow-2xl z-10"
          >
            <div className="text-[9px] text-[var(--text-faint)] font-mono mb-1 uppercase tracking-wider">BTC / USD</div>
            <div className="text-[17px] font-bold text-[var(--text-main)] font-mono tracking-tight">$64,231</div>
            <div className="text-[11px] text-[var(--positive)] font-mono mt-0.5">↑ 2.41%</div>
          </motion.div>

          {/* Floating data pill — Signal */}
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            whileHover={{ scale: 1.06 }}
            className="absolute bottom-[12%] left-[2%] bg-white/[0.05] border border-white/[0.09] backdrop-blur-xl rounded-2xl px-4 py-3.5 shadow-2xl z-10"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)] animate-pulse" />
              <span className="text-[9px] text-[var(--text-faint)] font-mono uppercase tracking-wider">Live Signal</span>
            </div>
            <div className="text-[13px] font-semibold text-[var(--text-main)] mb-0.5">ETH volume spike</div>
            <div className="text-[10px] text-[var(--accent)]">4.2σ above 1h avg</div>
          </motion.div>

          {/* Floating data pill — Latency */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            whileHover={{ scale: 1.06 }}
            className="absolute top-[44%] right-[0%] bg-white/[0.05] border border-white/[0.09] backdrop-blur-xl rounded-xl px-3.5 py-2.5 shadow-xl z-10"
          >
            <div className="text-[9px] text-[var(--text-faint)] mb-1 uppercase tracking-wider">Latency</div>
            <div className="text-[15px] font-bold text-[var(--positive)] font-mono">14ms</div>
          </motion.div>

          {/* Globe */}
          <GlobeCanvas />
        </motion.div>
      </div>

      {/* ── Metric Strip ── */}
      <MetricStrip coins={coins as any[]} />
    </section>
  );
}
