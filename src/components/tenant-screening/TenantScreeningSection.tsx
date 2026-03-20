import { Link } from "react-router-dom"
import { ShieldCheck, BadgeCheck, FileCheck2, Grid, Fingerprint, IdCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

type FeatureBadge = {
  label: string
  icon: React.ReactNode
}

type VisualCard = {
  title: string
  subtitle?: string
  body: React.ReactNode
}

export interface TenantScreeningSectionProps {
  eyebrow?: string
  title?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  className?: string
  highlightBadges?: FeatureBadge[]
  cards?: VisualCard[]
}

const defaultHighlightBadges: FeatureBadge[] = [
  { label: "The only 360° screening", icon: <ShieldCheck className="h-4 w-4" /> },
  { label: "No more fraud", icon: <Fingerprint className="h-4 w-4" /> },
  { label: "Reports you can rely on", icon: <FileCheck2 className="h-4 w-4" /> },
  { label: "Total control, one platform", icon: <Grid className="h-4 w-4" /> },
]

const defaultCards: VisualCard[] = [
  {
    title: "Criminal & Credit",
    subtitle: "Full background stack",
    body: (
      <ul className="space-y-1 text-sm text-muted-foreground">
        <li>• Criminal Report</li>
        <li>• Credit Check</li>
        <li>• ID Verification</li>
        <li>• Income & Employment</li>
        <li>• Eviction Report</li>
      </ul>
    ),
  },
  {
    title: "ID Verified",
    subtitle: "Biometric confidence",
    body: (
      <div className="flex items-center gap-4">
        <div className="rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 p-3">
          <IdCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-base font-semibold">Identification card</p>
          <p className="text-xs text-muted-foreground">Cross-matched against global fraud signals</p>
        </div>
      </div>
    ),
  },
  {
    title: "Score 770",
    subtitle: "Excellent",
    body: (
      <div>
        <div className="h-3 w-full rounded-full bg-muted">
          <div className="h-3 w-4/5 rounded-full bg-gradient-to-r from-amber-400 via-green-400 to-emerald-500" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">No criminal records • 1 eviction flag resolved</p>
      </div>
    ),
  },
  {
    title: "Lease Agreement",
    subtitle: "Rent collection terms",
    body: (
      <div className="space-y-1 text-sm">
        <p>• Jan 1 · Oct 31</p>
        <p>• $1,200 / mo</p>
        <p className="text-muted-foreground">Generate ready-to-sign packets instantly.</p>
      </div>
    ),
  },
]

export function TenantScreeningSection({
  eyebrow = "Tenant Screening",
  title = "Tenant screening that actually works",
  description = "Prevent fraud, stay compliant, and approve the right renters with an AI-assisted screening workflow built for property teams.",
  ctaLabel = "Learn more",
  ctaHref = "/contact",
  className,
  highlightBadges = defaultHighlightBadges,
  cards = defaultCards,
}: TenantScreeningSectionProps) {
  return (
    <section className={cn("relative overflow-hidden rounded-3xl bg-slate-900 text-white", className)}>
      <div className="absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">{eyebrow}</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">{title}</h2>
            <p className="mt-6 text-lg text-slate-200">{description}</p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-200/90">
              {highlightBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2"
                >
                  {badge.icon}
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                {isExternalHref(ctaHref) ? (
                  <a href={ctaHref} target="_blank" rel="noopener noreferrer">
                    {ctaLabel}
                  </a>
                ) : (
                  <Link to={ctaHref}>{ctaLabel}</Link>
                )}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <Card
                key={card.title}
                className="border-white/10 bg-white/5 text-white backdrop-blur"
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    <div>
                      <p className="text-sm font-medium text-white/90">{card.title}</p>
                      {card.subtitle && <p className="text-xs text-white/60">{card.subtitle}</p>}
                    </div>
                  </div>
                  <div>{card.body}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </section>
  )
}


