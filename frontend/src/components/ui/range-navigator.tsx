import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/** Range Navigator — focus + context time navigation. A detail chart sits over a
 *  compressed mini-map of the whole history: drag the window to pan, pull an edge
 *  to zoom, and the detail chart re-windows live. Hovering the detail chart drops
 *  a dashed crosshair with a card tooltip reading the price and its date. */

const BLUE = '#6366f1'
const CARD = '#0a0a0f'
const BORDER = 'rgba(255,255,255,0.1)'
const TEXT = '#ffffff'
const TEXT_MUTED = 'rgba(255,255,255,0.4)'
const BG = 'rgba(0,0,0,0.5)'

const W = 560
const MAIN_H = 168
const NAV_H = 46
const PAD = { l: 8, r: 54, t: 12, b: 8 }
const plotW = W - PAD.l - PAD.r
const MIN_W = 12
const AXIS_TICKS = [0, 0.25, 0.5, 0.75, 1]
const DAY_MS = 86_400_000

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function demoSeries(len: number) {
  let s = 5
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  const out: number[] = []
  let v = 120
  for (let i = 0; i < len; i++) {
    v += (rnd() - 0.48) * 3 + Math.sin(i / 22) * 0.6
    out.push(v)
  }
  return out
}

const DEMO_SERIES = demoSeries(240)

function money(n: number, precision = 2) {
  const body = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(Math.abs(n))
  return (n < 0 ? '−' : '') + body
}

export default function RangeNavigator({
  title = '',
  values,
  endDate = new Date(),
  initialWindow = 72,
  color = BLUE,
  className = '',
}: {
  title?: string
  values?: number[]
  endDate?: Date
  initialWindow?: number
  color?: string
  className?: string
}) {
  const reduced = useReducedMotion()
  const series = values?.length ? values : DEMO_SERIES
  const LEN = series.length
  const [win, setWin] = useState({ start: Math.max(0, LEN - 1 - initialWindow), end: LEN - 1 })
  const [hover, setHover] = useState<number | null>(null)
  const navRef = useRef<SVGSVGElement>(null)
  const mainRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ mode: 'move' | 'left' | 'right'; startIdx: number; s: number; e: number } | null>(null)

  const last = endDate.getTime()
  const dayAt = (i: number) => new Date(last - (LEN - 1 - i) * DAY_MS)
  const fmtDay = (i: number, withYear = false) =>
    dayAt(i).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: withYear ? '2-digit' : undefined,
    })

  const pxToIdx = (clientX: number) => {
    const r = navRef.current?.getBoundingClientRect()
    if (!r) return 0
    return ((clientX - r.left) / r.width) * (LEN - 1)
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      const delta = Math.round(pxToIdx(e.clientX) - d.startIdx)
      if (d.mode === 'move') {
        const width = d.e - d.s
        const start = clamp(d.s + delta, 0, LEN - 1 - width)
        setWin({ start, end: start + width })
      } else if (d.mode === 'left') {
        setWin({ start: clamp(d.s + delta, 0, d.e - MIN_W), end: d.e })
      } else {
        setWin({ start: d.s, end: clamp(d.e + delta, d.s + MIN_W, LEN - 1) })
      }
    }
    const onUp = () => (drag.current = null)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [LEN])

  const startDrag = (mode: 'move' | 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault()
    drag.current = { mode, startIdx: pxToIdx(e.clientX), s: win.start, e: win.end }
  }

  const detail = useMemo(() => {
    const slice = series.slice(win.start, win.end + 1)
    const lo = Math.min(...slice)
    const hi = Math.max(...slice)
    const pad = (hi - lo) * 0.1 || 1
    const min = lo - pad
    const max = hi + pad
    const n = slice.length
    const x = (i: number) => PAD.l + (i / (n - 1)) * plotW
    const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (MAIN_H - PAD.t - PAD.b)
    const line = slice.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
    const area = `${line} L${x(n - 1).toFixed(1)},${MAIN_H - PAD.b} L${x(0).toFixed(1)},${MAIN_H - PAD.b} Z`
    const axisPrecision = max - min >= 6 ? 0 : 2
    return { line, area, min, max, slice, n, x, y, axisPrecision }
  }, [win, series])

  const onMainMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = mainRef.current?.getBoundingClientRect()
    if (!r) return
    const px = ((e.clientX - r.left) / r.width) * W
    setHover(clamp(Math.round(((px - PAD.l) / plotW) * (detail.n - 1)), 0, detail.n - 1))
  }
  const hv =
    hover != null && hover < detail.n
      ? { i: hover, v: detail.slice[hover], x: detail.x(hover), y: detail.y(detail.slice[hover]) }
      : null

  const nav = useMemo(() => {
    const lo = Math.min(...series)
    const hi = Math.max(...series)
    const nx = (i: number) => PAD.l + (i / (LEN - 1)) * plotW
    const ny = (v: number) => 4 + (1 - (v - lo) / (hi - lo)) * (NAV_H - 8)
    const line = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${nx(i).toFixed(1)},${ny(v).toFixed(1)}`).join(' ')
    return { line, nx }
  }, [series, LEN])

  const wx0 = nav.nx(win.start)
  const wx1 = nav.nx(win.end)
  const crossesYear = dayAt(win.start).getFullYear() !== dayAt(win.end).getFullYear()

  return (
    <div className={`w-full max-w-[560px] ${className}`}>
      {title && (
        <div className="mb-1 flex items-baseline px-1">
          <span className="text-[13px] font-medium" style={{ color: TEXT }}>
            {title}
          </span>
        </div>
      )}

      <svg
        ref={mainRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${MAIN_H}`}
        className="block"
        onPointerMove={onMainMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="rn-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {AXIS_TICKS.map((f) => {
          const ty = PAD.t + f * (MAIN_H - PAD.t - PAD.b)
          return (
            <g key={f}>
              {f > 0 && f < 1 && (
                <line
                  x1={PAD.l}
                  y1={ty}
                  x2={W - PAD.r}
                  y2={ty}
                  stroke="rgba(255,255,255,0.04)"
                  strokeDasharray="2 5"
                />
              )}
              <text
                x={W - PAD.r + 8}
                y={ty + (f === 0 ? 4 : f === 1 ? 0 : 3)}
                fontSize={8.5}
                fill="rgba(255,255,255,0.28)"
                className="tabular-nums"
              >
                {money(detail.max - f * (detail.max - detail.min), detail.axisPrecision)}
              </text>
            </g>
          )
        })}
        <motion.path
          key={`${win.start}-${win.end}`}
          d={detail.area}
          fill="url(#rn-g)"
          initial={{ opacity: reduced ? 1 : 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        />
        <path d={detail.line} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        {hv && (
          <g pointerEvents="none">
            <line
              x1={hv.x}
              y1={PAD.t}
              x2={hv.x}
              y2={MAIN_H - PAD.b}
              stroke="rgba(255,255,255,0.22)"
              strokeDasharray="3 3"
            />
            <circle cx={hv.x} cy={hv.y} r={3.5} fill={color} stroke={CARD} strokeWidth={1.5} />
            {(() => {
              const label = `${money(hv.v)} · ${fmtDay(win.start + hv.i, crossesYear)}`
              const bw = label.length * 5.6 + 14
              const bx = clamp(hv.x - bw / 2, PAD.l, W - PAD.r - bw)
              return (
                <g>
                  <rect x={bx} y={PAD.t - 10} width={bw} height={17} rx={4} fill={CARD} stroke={BORDER} />
                  <text
                    x={bx + bw / 2}
                    y={PAD.t + 2}
                    textAnchor="middle"
                    fontSize={9.5}
                    fill={TEXT}
                    className="tabular-nums"
                  >
                    {label}
                  </text>
                </g>
              )
            })()}
          </g>
        )}
      </svg>

      <svg
        ref={navRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${NAV_H}`}
        className="mt-1 block touch-none select-none"
      >
        <path
          d={nav.line}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <rect
          x={PAD.l}
          y={0}
          width={Math.max(0, wx0 - PAD.l)}
          height={NAV_H}
          fill={BG}
        />
        <rect
          x={wx1}
          y={0}
          width={Math.max(0, W - PAD.r - wx1)}
          height={NAV_H}
          fill={BG}
        />
        <rect
          x={wx0}
          y={1}
          width={wx1 - wx0}
          height={NAV_H - 2}
          rx={3}
          fill="rgba(99,102,241,0.08)"
          stroke="rgba(99,102,241,0.55)"
          onPointerDown={startDrag('move')}
          style={{ cursor: 'grab' }}
        />
        {[
          { x: wx0, mode: 'left' as const },
          { x: wx1, mode: 'right' as const },
        ].map(({ x, mode }) => (
          <g key={mode} onPointerDown={startDrag(mode)} style={{ cursor: 'ew-resize' }}>
            <rect x={x - 5} y={0} width={10} height={NAV_H} fill="transparent" />
            <rect x={x - 1.5} y={NAV_H / 2 - 8} width={3} height={16} rx={1.5} fill={color} />
          </g>
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[9px] tabular-nums" style={{ color: TEXT_MUTED }}>
        <span>{fmtDay(win.start, crossesYear)}</span>
        <span>{fmtDay(win.end, crossesYear)}</span>
      </div>
    </div>
  )
}
