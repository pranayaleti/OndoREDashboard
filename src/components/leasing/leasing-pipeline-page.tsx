import { useState } from "react"
import { Link } from "react-router-dom"
import { GitBranch } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { useLeasingPipeline } from "@/hooks/useLeasingPipeline"
import { hrefForPipelineCard } from "@/components/leasing/leasing-pipeline-href"
import type { PipelineCard } from "@/lib/api/clients/operations"
import { cn } from "@/lib/utils"

function statusLabel(status: string): string {
  return status.replace(/_/g, " ")
}

function PipelineCardLink({ card }: { card: PipelineCard }) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <Link
      to={hrefForPipelineCard(card, user.role)}
      className="block rounded-md border border-border bg-background px-3 py-2 hover:border-orange-500/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className="truncate font-medium text-foreground">{card.title}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{card.subtitle}</p>
      <Badge variant="secondary" className="mt-2 capitalize">
        {statusLabel(card.status)}
      </Badge>
    </Link>
  )
}

export default function LeasingPipelinePage() {
  const { data, error, loading } = useLeasingPipeline()
  const [showParked, setShowParked] = useState(false)

  if (loading) {
    return (
      <div className="container mx-auto space-y-4 px-4 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold tracking-tight">Leasing track</h2>
        <p className="mt-4 text-sm text-muted-foreground">{error ?? "The leasing track could not be loaded."}</p>
      </div>
    )
  }

  const openCount = data.stages.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Leasing track</h2>
        <p className="text-muted-foreground">
          One sequence from inquiry to occupied — existing leads, applications, screening, and leases.
          Cards open the screen that already owns that work.
        </p>
      </div>

      <ol className="flex h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        {data.stages.map((stage) => (
          <li
            key={stage.id}
            className={cn("h-full flex-1", stage.count > 0 ? "bg-gradient-to-r from-orange-500 to-red-800" : "bg-muted")}
          />
        ))}
      </ol>

      {openCount === 0 && data.parked.count === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-8 w-8" />}
          title="Nothing on the track"
          description="New inquiries, applications, and unsigned leases will land here in order."
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {data.stages.map((stage, index) => (
            <section
              key={stage.id}
              className="flex w-[220px] shrink-0 flex-col rounded-lg border border-border bg-muted/20"
              aria-labelledby={`stage-${stage.id}`}
            >
              <header className="border-b border-orange-500/30 px-3 py-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-orange-600">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <h3 id={`stage-${stage.id}`} className="font-semibold text-foreground">
                    {stage.label}
                  </h3>
                  <Badge variant={stage.count > 0 ? "default" : "secondary"}>{stage.count}</Badge>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-2 p-2">
                {stage.cards.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nothing in this stage</p>
                ) : (
                  stage.cards.map((card) => <PipelineCardLink key={`${card.kind}-${card.id}`} card={card} />)
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {data.parked.count > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">Parked</p>
                <p className="text-sm text-muted-foreground">
                  Closed leads, withdrawn or rejected applications — {data.parked.count} off the live track.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setShowParked((open) => !open)}>
                {showParked ? "Hide" : "Show"} parked
              </Button>
            </div>
            {showParked && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.parked.cards.map((card) => (
                  <li key={`${card.kind}-${card.id}`}>
                    <PipelineCardLink card={card} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
