import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, ChevronDown, Sparkles, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ChecklistItem {
  id: string
  title: string
  description: string
  href: string
}

const STORAGE_PREFIX = "ondo_manager_onboarding"

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "first-property",
    title: "Add your first property",
    description: "Start moving beyond the demo portfolio with a real address and unit details.",
    href: "/dashboard/properties",
  },
  {
    id: "invite-owner",
    title: "Invite an owner",
    description: "Bring an owner into the portal so they can review documents, finances, and maintenance.",
    href: "/dashboard/owners/new",
  },
  {
    id: "invite-tenant",
    title: "Invite a tenant",
    description: "Send the secure onboarding flow for screening, messaging, and payments.",
    href: "/dashboard/tenants/new",
  },
  {
    id: "payment-settings",
    title: "Configure payment settings",
    description: "Review rent collection and payment exports before you go live.",
    href: "/dashboard/finances?tab=payments",
  },
  {
    id: "maintenance-categories",
    title: "Set up maintenance categories",
    description: "Define the request workflow you want the team to triage and close.",
    href: "/dashboard/maintenance",
  },
]

function readBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback
  const stored = window.localStorage.getItem(key)
  return stored === null ? fallback : stored === "true"
}

export function ManagerOnboardingChecklist() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setIsExpanded(readBoolean(`${STORAGE_PREFIX}:expanded`, true))
    setIsDismissed(readBoolean(`${STORAGE_PREFIX}:dismissed`, false))

    const nextCompleted = CHECKLIST_ITEMS.reduce<Record<string, boolean>>((accumulator, item) => {
      accumulator[item.id] = readBoolean(`${STORAGE_PREFIX}:item:${item.id}`, false)
      return accumulator
    }, {})

    setCompletedItems(nextCompleted)
  }, [])

  const remainingItems = useMemo(
    () => CHECKLIST_ITEMS.filter((item) => !completedItems[item.id]),
    [completedItems],
  )

  const completionPercent = Math.round(((CHECKLIST_ITEMS.length - remainingItems.length) / CHECKLIST_ITEMS.length) * 100)

  const handleToggleExpanded = () => {
    setIsExpanded((previous) => {
      const next = !previous
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`${STORAGE_PREFIX}:expanded`, String(next))
      }
      return next
    })
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${STORAGE_PREFIX}:dismissed`, "true")
    }
  }

  const handleComplete = (itemId: string) => {
    setCompletedItems((previous) => {
      const next = { ...previous, [itemId]: true }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`${STORAGE_PREFIX}:item:${itemId}`, "true")
      }
      return next
    })
  }

  if (isDismissed || remainingItems.length === 0) {
    return null
  }

  return (
    <Card className="border-orange-200/70 bg-orange-50/70 shadow-sm dark:border-orange-500/20 dark:bg-orange-500/5">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button
            type="button"
            onClick={handleToggleExpanded}
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
            aria-expanded={isExpanded}
            aria-label="Toggle getting started checklist"
          >
            <div className="rounded-full bg-orange-500/15 p-2 text-orange-600 dark:text-orange-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Finish a few setup steps to replace the demo data with your live portfolio.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  <span>{remainingItems.length} steps remaining</span>
                  <span>{completionPercent}% complete</span>
                </div>
                <Progress value={completionPercent} className="h-2" />
              </div>
            </div>
            <ChevronDown className={cn("mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform", isExpanded ? "rotate-180" : "")} />
          </button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label="Dismiss getting started checklist"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="space-y-3">
          {remainingItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={item.href}>Open</Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleComplete(item.id)}
                  className="bg-orange-500 text-black hover:bg-orange-400"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark done
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  )
}
