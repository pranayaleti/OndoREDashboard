// Painted-wall murals in the Ondo palette: the Wasatch front over a street of
// Utah homes, with the Ondo brush ring as the sun. Three compositions:
//   trail      Rewards hero. The tier ladder is a switchback trail up the peak,
//              Bronze trailhead to Platinum summit, with the tenant's flag on it.
//   neighbors  Referral hero. Two homes joined by a string of lights.
//   MuralVignette  Small scene for empty states.
// Purely decorative (aria-hidden): every number the trail shows is also in text.
import { useEffect, useId, useState } from "react"
import { cn } from "@/lib/utils"

export type Point = readonly [number, number]

/** Switchback trail in mural coordinates (1200 x 400), trailhead to summit. */
export const TRAIL: readonly Point[] = [
  [560, 332],
  [640, 300],
  [600, 262],
  [690, 236],
  [650, 200],
  [730, 170],
  [700, 138],
  [760, 96],
]

/** Tier stops sit at equal fractions of the trail: Bronze, Silver, Gold, Platinum. */
export const TRAIL_STOPS = [0, 1 / 3, 2 / 3, 1] as const

/** The point a fraction t (0..1) of the way along a polyline, by length. */
export function pointAlong(points: readonly Point[], t: number): Point {
  const target = Math.min(1, Math.max(0, t))
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]))
  const total = lengths.reduce((a, b) => a + b, 0)
  let remaining = target * total
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] === 0 ? 0 : Math.min(1, remaining / lengths[i])
      const [x0, y0] = points[i]
      const [x1, y1] = points[i + 1]
      return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]
    }
    remaining -= lengths[i]
  }
  return points[points.length - 1]
}

// Palette. Light mode is a clear winter morning; dark mode is evening, when the
// windows glow. Orange (#F97316) is the only accent, as everywhere in Ondo.
const C = {
  sky: "fill-[#DDE5E8] dark:fill-[#17191E]",
  glow: "fill-[#FED7AA] dark:fill-transparent",
  sunRing: "stroke-[#F97316]",
  backRange: "fill-[#AEB6BF] dark:fill-[#272C34]",
  massif: "fill-[#5B636E] dark:fill-[#3A414B]",
  snow: "fill-[#F8F7F4] dark:fill-[#B9C0CA]",
  // Sunlit faces: the sun sits to the right, so right-hand faces are lighter.
  sunlit: "fill-[#7D8591] dark:fill-[#474F5A]",
  hillsFar: "fill-[#8E9C7F] dark:fill-[#2E3A2C]",
  hillsNear: "fill-[#6F7F63] dark:fill-[#243022]",
  basalt: "fill-[#26211D] dark:fill-[#0C0B0A]",
  basaltStroke: "stroke-[#26211D] dark:stroke-[#0C0B0A]",
  windowLit: "fill-[#FDBA74] dark:fill-[#F97316]",
  windowDark: "fill-[#4A423B] dark:fill-[#2A2521]",
  stone: "fill-[#4A423B] dark:fill-[#2A2521]",
  orange: "fill-[#F97316]",
  orangeStroke: "stroke-[#F97316]",
  trail: "stroke-[#F8F7F4] dark:stroke-[#9AA3AE]",
} as const

const GROUND_Y = 376

interface HouseSpec {
  x: number
  w: number
  h: number
  roof: number
}

function House({ x, w, h, roof, seed }: HouseSpec & { seed: number }) {
  const top = GROUND_Y - h
  const body = `M${x} ${GROUND_Y} L${x} ${top} L${x + w / 2} ${top - roof} L${x + w} ${top} L${x + w} ${GROUND_Y} Z`
  const size = Math.max(10, Math.round(h / 5))
  const count = Math.max(1, Math.floor(w / (size * 2.5)))
  const gap = w / (count + 1)
  return (
    <g>
      <path d={body} className={C.basalt} />
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={x + gap * (i + 1) - size / 2}
          y={top + Math.round(h * 0.24)}
          width={size}
          height={size + 1}
          rx={1}
          className={(seed + i) % 3 === 0 ? C.windowDark : C.windowLit}
        />
      ))}
    </g>
  )
}

function Pine({ x, h }: { x: number; h: number }) {
  const b = GROUND_Y - 2
  return (
    <path
      className={C.basalt}
      d={`M${x - 15} ${b} L${x} ${b - h * 0.62} L${x + 15} ${b} Z M${x - 11} ${b - h * 0.38} L${x} ${b - h} L${x + 11} ${b - h * 0.38} Z`}
    />
  )
}

/** Sky, sun, ranges and foothills shared by both large compositions. */
function Backdrop({ paint }: { paint: string }) {
  return (
    <>
      <rect width="1200" height="400" className={C.sky} />
      <circle cx="1010" cy="124" r="46" className={C.glow} />
      <circle
        cx="1010"
        cy="124"
        r="58"
        fill="none"
        strokeWidth="15"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="86 14"
        transform="rotate(-110 1010 124)"
        className={C.sunRing}
        filter={`url(#${paint})`}
      />
      <g filter={`url(#${paint})`}>
        <path
          className={C.backRange}
          d="M0 292 L90 268 L200 252 L290 262 L380 224 L470 234 L600 150 L660 175 L720 160 L820 150 L900 140 L960 128 L1030 150 L1100 150 L1160 170 L1200 162 L1200 400 L0 400 Z"
        />
        <path
          className={C.massif}
          d="M0 314 L120 284 L210 294 L330 238 L420 248 L520 170 L600 190 L690 128 L760 92 L820 118 L880 110 L960 160 L1040 150 L1120 195 L1200 180 L1200 400 L0 400 Z"
        />
        <path className={C.sunlit} d="M760 92 L820 118 L792 170 L766 150 Z" />
        <path className={C.sunlit} d="M880 110 L960 160 L930 190 L890 150 Z" />
        <path className={C.sunlit} d="M520 170 L600 190 L575 220 L530 200 Z" />
        <path className={C.sunlit} d="M330 238 L420 248 L398 268 L348 262 Z" />
        <path
          className={C.snow}
          d="M686 131 L760 92 L824 120 L806 127 L790 121 L774 133 L756 124 L738 136 L716 128 L700 138 Z"
        />
        <path className={C.snow} d="M862 116 L880 110 L912 130 L898 133 L886 126 L874 134 Z" />
        <path className={C.snow} d="M502 180 L520 170 L548 182 L534 187 L522 181 L510 190 Z" />
        <path
          className={C.hillsFar}
          d="M0 318 C150 292 300 312 430 300 C560 288 700 306 830 296 C960 286 1080 306 1200 294 L1200 400 L0 400 Z"
        />
        <path
          className={C.hillsNear}
          d="M0 346 C200 326 380 344 560 336 C760 326 980 346 1200 330 L1200 400 L0 400 Z"
        />
      </g>
    </>
  )
}

function Ground() {
  return <path className={C.basalt} d="M0 368 C300 358 900 380 1200 364 L1200 400 L0 400 Z" />
}

/** Hand-painted edges and a little wall grain. */
function MuralFilters({ paint, grain }: { paint: string; grain: string }) {
  return (
    <defs>
      <filter id={paint} x="-3%" y="-3%" width="106%" height="106%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id={grain}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
  )
}

function useMuralIds() {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  return { paint: `mural-paint-${raw}`, grain: `mural-grain-${raw}` }
}

const TRAIL_STREET: HouseSpec[] = [
  { x: 24, w: 70, h: 46, roof: 26 },
  { x: 112, w: 56, h: 38, roof: 22 },
  { x: 178, w: 84, h: 54, roof: 30 },
  { x: 280, w: 60, h: 40, roof: 24 },
  { x: 352, w: 76, h: 50, roof: 28 },
  { x: 866, w: 72, h: 48, roof: 26 },
  { x: 950, w: 58, h: 40, roof: 22 },
  { x: 1018, w: 88, h: 56, roof: 30 },
  { x: 1118, w: 66, h: 44, roof: 24 },
]
const TRAIL_PINES = [104, 272, 344, 440, 470, 852, 942, 1110, 1190]

interface OndoMuralProps {
  scene: "trail" | "neighbors"
  /** Trail scene only: 0 at the Bronze trailhead, 1 at the Platinum summit. */
  progress?: number
  className?: string
}

export function OndoMural({ scene, progress = 0, className }: OndoMuralProps) {
  const { paint, grain } = useMuralIds()
  return (
    <svg
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-full w-full", className)}
      data-testid={`mural-${scene}`}
    >
      <MuralFilters paint={paint} grain={grain} />
      <Backdrop paint={paint} />
      {scene === "trail" ? <TrailScene paint={paint} progress={progress} /> : <NeighborsScene paint={paint} />}
      <rect width="1200" height="400" filter={`url(#${grain})`} opacity="0.06" style={{ mixBlendMode: "multiply" }} />
    </svg>
  )
}

function TrailScene({ paint, progress }: { paint: string; progress: number }) {
  const target = Math.min(1, Math.max(0, progress))
  // One page-load moment: the climbed stretch draws itself in. Reduced motion skips it.
  const [drawn, setDrawn] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(target))
    return () => cancelAnimationFrame(id)
  }, [target])

  const points = TRAIL.map((p) => p.join(",")).join(" ")
  const [fx, fy] = pointAlong(TRAIL, target)
  return (
    <>
      <polyline
        points={points}
        fill="none"
        strokeWidth={3}
        strokeDasharray="2 9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={C.trail}
      />
      <polyline
        points={points}
        fill="none"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className={cn(C.orangeStroke, "transition-[stroke-dasharray] duration-1000 ease-out motion-reduce:transition-none")}
        style={{ strokeDasharray: `${drawn} 1` }}
        data-testid="mural-trail-climbed"
      />
      {TRAIL_STOPS.map((t) => {
        const [x, y] = pointAlong(TRAIL, t)
        const reached = target >= t - 1e-9
        return (
          <circle
            key={t}
            cx={x}
            cy={y}
            r={7}
            strokeWidth={3}
            className={cn(C.basaltStroke, reached ? C.orange : C.snow)}
          />
        )
      })}
      <g data-testid="mural-flag">
        <circle cx={fx} cy={fy} r={15} className={C.orange} opacity={0.25} />
        <line x1={fx} y1={fy} x2={fx} y2={fy - 36} strokeWidth={3} strokeLinecap="round" className={C.basaltStroke} />
        <path
          d={`M${fx} ${fy - 36} L${fx + 24} ${fy - 29} L${fx} ${fy - 21} Z`}
          strokeWidth={1.5}
          strokeLinejoin="round"
          className={cn(C.orange, C.basaltStroke)}
        />
      </g>
      <g filter={`url(#${paint})`}>
        {TRAIL_PINES.map((x, i) => (
          <Pine key={x} x={x} h={i % 2 ? 44 : 56} />
        ))}
        {TRAIL_STREET.map((h, i) => (
          <House key={h.x} {...h} seed={i} />
        ))}
        <Ground />
      </g>
    </>
  )
}

/** Points on a quadratic curve, for the string of lights. */
function quadPoints(p0: Point, p1: Point, p2: Point, n: number): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / (n + 1)
    const a = (1 - t) * (1 - t)
    const b = 2 * (1 - t) * t
    const c = t * t
    return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]] as const
  })
}

const NEIGHBOR_STREET: HouseSpec[] = [
  { x: 20, w: 64, h: 44, roof: 24 },
  { x: 120, w: 80, h: 52, roof: 28 },
  { x: 214, w: 58, h: 40, roof: 22 },
  { x: 930, w: 70, h: 46, roof: 26 },
  { x: 1016, w: 86, h: 54, roof: 30 },
  { x: 1120, w: 62, h: 42, roof: 24 },
]

function NeighborsScene({ paint }: { paint: string }) {
  // Two porches: the referrer's home on the left, the friend's on the right.
  const a = { x: 330, w: 150, h: 104, roof: 54 }
  const b = { x: 700, w: 170, h: 118, roof: 60 }
  const start: Point = [a.x + a.w, GROUND_Y - a.h]
  const end: Point = [b.x, GROUND_Y - b.h]
  const bulbs = quadPoints(start, [590, 340], end, 9)
  const doorX = b.x + 30
  const doorTop = GROUND_Y - 44
  return (
    <>
      <g filter={`url(#${paint})`}>
        {[90, 300, 520, 610, 900, 1190].map((x, i) => (
          <Pine key={x} x={x} h={i % 2 ? 46 : 60} />
        ))}
        {NEIGHBOR_STREET.map((h, i) => (
          <House key={h.x} {...h} seed={i} />
        ))}
        <House {...a} seed={1} />
        <House {...b} seed={2} />
        <Ground />
        {/* Open door with light spilling onto the path. */}
        <path
          d={`M${doorX} ${GROUND_Y} L${doorX + 26} ${GROUND_Y} L${doorX + 60} 398 L${doorX - 30} 398 Z`}
          className={C.orange}
          opacity={0.28}
        />
        <rect x={doorX} y={doorTop} width={26} height={44} rx={2} className={C.windowLit} />
        {[430, 480, 530, 580, 630, 680].map((x) => (
          <ellipse key={x} cx={x} cy={389} rx={13} ry={4} className={C.stone} />
        ))}
      </g>
      <path
        d={`M${start[0]} ${start[1]} Q590 340 ${end[0]} ${end[1]}`}
        fill="none"
        strokeWidth={2}
        className={C.basaltStroke}
      />
      {bulbs.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y + 6} r={11} className={C.orange} opacity={0.22} />
          <circle cx={x} cy={y + 6} r={5} className={C.orange} />
        </g>
      ))}
    </>
  )
}

/** A small scene for empty states: one home, one lit window. */
export function MuralVignette({ className }: { className?: string }) {
  const { paint, grain: clip } = useMuralIds()
  return (
    <svg
      viewBox="0 0 320 140"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-auto w-full max-w-[280px]", className)}
      data-testid="mural-vignette"
    >
      <defs>
        <filter id={paint} x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <clipPath id={clip}>
          <rect width="320" height="140" rx="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
      <rect width="320" height="140" className={C.sky} />
      <circle cx="252" cy="40" r="14" className={C.glow} />
      <circle
        cx="252"
        cy="40"
        r="18"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="86 14"
        transform="rotate(-110 252 40)"
        className={C.sunRing}
      />
      <g filter={`url(#${paint})`}>
        <path className={C.massif} d="M0 110 L60 80 L110 92 L170 48 L230 86 L280 72 L320 90 L320 140 L0 140 Z" />
        <path className={C.snow} d="M156 58 L170 48 L186 60 L178 62 L170 57 L162 63 Z" />
        <path className={C.hillsNear} d="M0 118 C80 108 200 122 320 112 L320 140 L0 140 Z" />
        <path className={C.basalt} d="M118 132 L118 100 L148 80 L178 100 L178 132 Z" />
        <rect x="142" y="108" width="12" height="12" rx="1" className={C.windowLit} />
        <path className={C.basalt} d="M0 128 C100 124 220 134 320 126 L320 140 L0 140 Z" />
      </g>
      </g>
    </svg>
  )
}
