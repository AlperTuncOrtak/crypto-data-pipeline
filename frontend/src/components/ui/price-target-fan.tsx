import { useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const AMBER = 'var(--chart-amber, #e8b45a)'
const BLUE = 'var(--chart-1, #489ffa)'
const EASE = [0.16, 1, 0.3, 1] as const
const GREEN = 'var(--chart-2, #4dbe95)'
const HAIRLINE = 'var(--border-base, rgba(255,255,255,0.1))'
const SANS = 'inherit'
const SURFACE = 'var(--bg-base, #000)'
const SURFACE_RAISED = 'var(--bg-subtle, #111)'
const TEXT = 'var(--text-main, #fff)'
const TEXT_MUTED = 'var(--text-muted, #888)'

/** #78 Price Target Fan — analyst price targets. History walks to "now", three
 *  projections fan out to the High / Mean / Low targets (green up, amber down,
 *  blue consensus). Scrub the history, or hover a target, and a card flips in
 *  beside the point — value big, context muted, the way the KPI cards read. */

type Target = { key: string; price: number; analysts: number; color: string }

const W = 520
const H = 236
const PAD = { l: 40, r: 104, t: 16, b: 28 }

export default function PriceTargetFan({
  currentPrice = 178.52,
  targets = [
    { key: 'Bull', price: 232, analysts: 9, color: GREEN },
    { key: 'Base', price: 205, analysts: 34, color: BLUE },
    { key: 'Bear', price: 168, analysts: 6, color: AMBER },
  ],
  className = ""
}: {
  currentPrice?: number;
  targets?: Target[];
  className?: string;
}) {
  const CURRENT = currentPrice;
  const TARGETS = targets;

  // deterministic weekly history ending exactly at CURRENT
  const HIST = useMemo(() => {
    let s = 17
    let v = 150
    const out: number[] = []
    for (let i = 0; i < 52; i++) {
      s = (s * 16807) % 2147483647
      v = v + ((s / 2147483647) - 0.44) * 4.2
      out.push(v)
    }
    const lo = Math.min(...out)
    const hi = Math.max(...out)
    const scaled = out.map((x) => 158 + ((x - lo) / (hi - lo)) * 26)
    const shift = CURRENT - scaled[scaled.length - 1]
    return scaled.map((x) => x + shift)
  }, [CURRENT])

  const Y_MIN = Math.min(...HIST, ...TARGETS.map(t => t.price)) * 0.95
  const Y_MAX = Math.max(...HIST, ...TARGETS.map(t => t.price)) * 1.05
  const y = (v: number) => PAD.t + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD.t - PAD.b)
  const pct = (p: number) => ((p - CURRENT) / CURRENT) * 100
  const fmt = (p: number) => `$${p.toFixed(2)}`
  const CARD_W = 140

  const reduced = useReducedMotion()
  const svgRef = useRef<SVGSVGElement>(null)
  const [scrub, setScrub] = useState<number | null>(null)
  const [hotT, setHotT] = useState<number | null>(null)

  const geo = useMemo(() => {
    const histW = (W - PAD.l - PAD.r) * 0.56
    const hx = (i: number) => PAD.l + (i / (HIST.length - 1)) * histW
    const nowX = hx(HIST.length - 1)
    const nowY = y(CURRENT)
    const endX = W - PAD.r
    const line = HIST.map((v, i) => `${i === 0 ? 'M' : 'L'}${hx(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
    const proj = TARGETS.map((t) => {
      const ty = y(t.price)
      const cx = nowX + (endX - nowX) * 0.5
      const cy = nowY + (ty - nowY) * 0.15
      return { ...t, ty, d: `M${nowX},${nowY} Q${cx},${cy} ${endX},${ty}`, cx, cy }
    })
    const hi = proj[0]
    const lo = proj[2]
    const band = `M${nowX},${nowY} Q${hi.cx},${hi.cy} ${endX},${hi.ty} L${endX},${lo.ty} Q${lo.cx},${lo.cy} ${nowX},${nowY} Z`
    return { hx, nowX, nowY, endX, line, proj, band }
  }, [HIST, CURRENT, TARGETS, Y_MIN, Y_MAX])

  const onMove = (e: React.PointerEvent) => {
    const el = svgRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    if (px > geo.nowX + 6) {
      setScrub(null)
      return
    }
    const histW = geo.nowX - PAD.l
    setScrub(Math.max(0, Math.min(HIST.length - 1, Math.round(((px - PAD.l) / histW) * (HIST.length - 1)))))
  }

  const overlay = (() => {
    if (hotT !== null) {
      const p = geo.proj[hotT]
      const up = p.price >= CURRENT
      return {
        px: geo.endX,
        py: p.ty,
        value: fmt(p.price),
        context: `${p.key} · ${up ? '+' : ''}${pct(p.price).toFixed(1)}% · ${p.analysts} analysts`,
        color: p.color,
      }
    }
    if (scrub !== null) {
      const ago = HIST.length - 1 - scrub
      return { px: geo.hx(scrub), py: y(HIST[scrub]), value: fmt(HIST[scrub]), context: ago === 0 ? 'now' : `${ago}w ago`, color: undefined as string | undefined }
    }
    return null
  })()

  // Dynamic Y-axis labels
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps }, (_, i) => Y_MIN + (Y_MAX - Y_MIN) * (i / (ySteps - 1)));

  return (
    <div className={`w-full max-w-[520px] mx-auto ${className}`} style={{ fontFamily: SANS }}>
      {/* header — mean target + potential (KPI-style big number) */}
      <div className="mb-4 flex items-end justify-between px-1">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Analyst Price Target · 12mo</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-bold tabular-nums tracking-[-0.02em] text-[var(--text-main)]">{fmt(TARGETS[1].price)}</span>
            <span className="text-[13px] font-bold tabular-nums" style={{ color: TARGETS[1].price >= CURRENT ? GREEN : AMBER }}>
              {TARGETS[1].price >= CURRENT ? '+' : ''}{pct(TARGETS[1].price).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: TEXT_MUTED }}>Now {fmt(CURRENT)}</div>
      </div>

      <div className="relative mx-auto w-full max-w-[520px]">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto cursor-crosshair" onPointerMove={onMove} onPointerLeave={() => setScrub(null)}>
          {/* faint gridlines + left price axis */}
          {yLabels.map((v) => (
            <g key={v}>
              <line x1={PAD.l} y1={y(v)} x2={geo.endX} y2={y(v)} stroke="color-mix(in srgb, var(--text-muted) 15%, transparent)" strokeDasharray="2 5" />
              <text x={PAD.l - 7} y={y(v) + 3} textAnchor="end" fontSize={9} fontWeight="600" fill="var(--text-muted)" className="tabular-nums">
                {Math.round(v)}
              </text>
            </g>
          ))}

          {/* bottom date axis — history → now → 12mo target horizon */}
          {[
            { x: geo.hx(0), t: "-1Y", a: 'start' as const },
            { x: geo.hx(26), t: "-6M", a: 'middle' as const },
            { x: geo.nowX, t: 'Now', a: 'middle' as const },
            { x: geo.endX, t: "+1Y", a: 'end' as const },
          ].map((d) => (
            <text key={d.t} x={d.x} y={H - 8} textAnchor={d.a} fontSize={9} fontWeight="600" fill="var(--text-muted)">
              {d.t}
            </text>
          ))}

          {/* projection band */}
          <motion.path
            d={geo.band}
            fill={`color-mix(in srgb, ${BLUE} 10%, transparent)`}
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: hotT === null ? 1 : 0.22 }}
            transition={reduced ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: 0.9 }}
          />

          {/* now marker */}
          <line x1={geo.nowX} y1={PAD.t} x2={geo.nowX} y2={H - PAD.b} stroke="color-mix(in srgb, var(--text-main) 20%, transparent)" strokeWidth={1} strokeDasharray="3 3" />

          {/* history */}
          <motion.path
            d={geo.line}
            fill="none"
            stroke="var(--text-main)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: reduced ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={reduced ? { duration: 0 } : { duration: 0.9, ease: EASE }}
          />

          {/* projections + target labels */}
          {geo.proj.map((p, i) => {
            const on = hotT === i
            const dim = hotT !== null && !on
            return (
              <motion.g
                key={p.key}
                initial={{ opacity: reduced ? 1 : 0 }}
                animate={{ opacity: dim ? 0.26 : 1 }}
                transition={reduced ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: 0.9 + i * 0.12 }}
                onMouseEnter={() => setHotT(i)}
                onMouseLeave={() => setHotT(null)}
                style={{ cursor: 'pointer' }}
              >
                <path d={p.d} fill="none" stroke="transparent" strokeWidth={16} />
                <path d={p.d} fill="none" stroke={p.color} strokeWidth={on ? 2.5 : 1.5} strokeOpacity={on ? 1 : 0.7} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
                <circle cx={geo.endX} cy={p.ty} r={on ? 4.5 : 3.5} fill={SURFACE} stroke={p.color} strokeWidth={2} />
                <text x={geo.endX + 12} y={p.ty - 4} fontSize={9} fontWeight="700" fill="var(--text-muted)">{p.key}</text>
                <text x={geo.endX + 12} y={p.ty + 8} fontSize={11} fontWeight={700} fill={p.color} className="tabular-nums">{p.price}</text>
              </motion.g>
            )
          })}

          {/* now dot */}
          <motion.circle cx={geo.nowX} cy={geo.nowY} r={4} fill="var(--text-main)" initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0 } : { delay: 0.85 }} />

          {/* scrub crosshair */}
          {scrub !== null && (
            <g pointerEvents="none">
              <line x1={geo.hx(scrub)} y1={PAD.t} x2={geo.hx(scrub)} y2={H - PAD.b} stroke="color-mix(in srgb, var(--text-main) 30%, transparent)" strokeWidth={1} />
              <circle cx={geo.hx(scrub)} cy={y(HIST[scrub])} r={4} fill="var(--text-main)" stroke={SURFACE} strokeWidth={2} />
            </g>
          )}
        </svg>

        {/* overlay — value big, context muted (KPI-card read) */}
        {overlay && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-[var(--border-base)] px-3 py-2 shadow-2xl backdrop-blur-md"
            style={{
              width: CARD_W,
              left: overlay.px < W / 2 ? Math.min(W - CARD_W - 4, overlay.px + 14) : Math.max(4, overlay.px - CARD_W - 14),
              top: Math.max(2, Math.min(H - 44, overlay.py - 18)),
              background: 'rgba(20,20,20,0.85)',
            }}
          >
            <div className="text-[15px] font-black tabular-nums" style={{ color: overlay.color ?? TEXT }}>{overlay.value}</div>
            <div className="mt-0.5 text-[11px] font-medium" style={{ color: TEXT_MUTED }}>{overlay.context}</div>
          </div>
        )}
      </div>
    </div>
  )
}
