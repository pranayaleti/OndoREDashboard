import { useEffect, useState } from "react"
import { Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { stepsFor, type DemoRole } from "./demo-scenes"

interface DemoTourProps {
  role: DemoRole
  stepMs?: number
}

export function DemoTour({ role, stepMs = 3500 }: DemoTourProps) {
  const steps = stepsFor(role)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setIndex(0)
  }, [role])

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      setIndex(index >= steps.length - 1 ? 0 : index + 1)
    }, stepMs)
    return () => window.clearTimeout(timer)
  }, [playing, index, steps.length, stepMs])

  const step = steps[index]

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/60 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-xs text-white/60">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3">Ondo {role === "owner" ? "Owner" : "Tenant"} portal · sample data</span>
      </div>
      <div className="grid md:grid-cols-[14rem_1fr]">
        <ol className="flex gap-1 overflow-x-auto border-b border-white/10 p-2 md:block md:space-y-1 md:border-b-0 md:border-r">
          {steps.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPlaying(false)
                  setIndex(i)
                }}
                aria-current={i === index ? "step" : undefined}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  i === index ? "bg-orange-500/20 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
                )}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="min-h-[18rem] space-y-4 p-5" aria-live="polite">
          <div>
            <h3 className="text-xl font-semibold text-white">{step.title}</h3>
            <p className="mt-1 text-sm text-white/70">{step.blurb}</p>
          </div>
          <div key={step.id} className="animate-in fade-in duration-500">
            {step.scene}
          </div>
        </div>
      </div>
      {(
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-white/60">
          <span>
            Step {index + 1} of {steps.length}
          </span>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/10 hover:text-white"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pause" : "Auto-play"}
          </button>
        </div>
      )}
    </div>
  )
}
