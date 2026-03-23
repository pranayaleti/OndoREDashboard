import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ScoreBreakdown {
  [key: string]: { earned: number; max: number }
}

interface ScoreBreakdownTooltipProps {
  score: number | null
  breakdown: ScoreBreakdown | null
  children: React.ReactNode
}

const checkLabels: Record<string, string> = {
  credit: "Credit",
  criminal: "Criminal",
  eviction: "Eviction",
  income: "Income",
  identity: "Identity",
  references: "References",
  custom_questions: "Questions",
}

export function ScoreBreakdownTooltip({ score, breakdown, children }: ScoreBreakdownTooltipProps) {
  if (score === null || !breakdown || Object.keys(breakdown).length === 0) {
    return <>{children}</>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="w-56 p-3" side="bottom">
          <p className="font-semibold text-sm mb-2">Score Breakdown</p>
          <div className="space-y-1.5">
            {Object.entries(breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{checkLabels[key] ?? key}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        val.earned === val.max
                          ? "bg-emerald-500"
                          : val.earned > 0
                            ? "bg-amber-500"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${val.max > 0 ? (val.earned / val.max) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono">
                    {val.earned}/{val.max}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t mt-2 pt-2 flex justify-between text-xs font-semibold">
            <span>Total</span>
            <span>{score}/100</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
