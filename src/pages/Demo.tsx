import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DemoTour } from "@/components/demo/demo-tour"
import type { DemoRole } from "@/components/demo/demo-scenes"

const copy: Record<DemoRole, { headline: string; why: string[]; cta: { label: string; to: string }; ctaNote: string }> = {
  owner: {
    headline: "See how Ondo runs your rentals",
    why: [
      "Screening, leases, rent and maintenance in one portal",
      "Tenants pay and report problems themselves",
      "An assistant that answers questions from your own data",
    ],
    cta: { label: "Create an owner account", to: "/register" },
    ctaNote: "Takes a couple of minutes. We review every owner request.",
  },
  tenant: {
    headline: "See what renting looks like with Ondo",
    why: [
      "Pay rent and download receipts online",
      "Send maintenance requests with photos and track them",
      "One message thread with your landlord",
    ],
    cta: { label: "Sign in", to: "/login" },
    ctaNote: "Tenant accounts are created when your landlord invites you. Use your invite link to sign up.",
  },
}

export default function Demo() {
  const [params, setParams] = useSearchParams()
  const role: DemoRole = params.get("role") === "tenant" ? "tenant" : "owner"
  const [hasVideo, setHasVideo] = useState(true)
  const c = copy[role]

  return (
    <main className="bg-background px-4 py-14 text-white">
      <div className="container mx-auto max-w-5xl space-y-10">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-orange-300">Demo</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">{c.headline}</h1>
          <div role="tablist" aria-label="Choose a portal" className="mx-auto inline-flex rounded-full border border-white/10 p-1">
            {(["owner", "tenant"] as const).map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={role === r}
                onClick={() => setParams({ role: r })}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                  role === r ? "bg-orange-500 text-black" : "text-white/70 hover:text-white",
                )}
              >
                {r === "owner" ? "I'm an owner" : "I'm a tenant"}
              </button>
            ))}
          </div>
        </header>

        <section aria-label="Walkthrough video" className="space-y-3">
          {hasVideo ? (
            <video
              key={role}
              className="w-full rounded-2xl border border-white/10 bg-black"
              controls
              playsInline
              preload="metadata"
              poster={`/demo/${role}-poster.png`}
              onError={() => setHasVideo(false)}
              aria-label={`Short walkthrough of the ${role} portal`}
            >
              <source src={`/demo/${role}-tour.webm`} type="video/webm" />
            </video>
          ) : (
            <p className="rounded-xl border border-white/10 p-4 text-sm text-white/60">The video is not available yet. Use the interactive tour below.</p>
          )}
          <p className="text-xs text-white/50">Recorded from the Ondo portal using sample data, not real accounts.</p>
        </section>

        <section className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Why sign up</h2>
            <ul className="space-y-2 text-white/80">
              {c.why.map((w) => (
                <li key={w}>✔️ {w}</li>
              ))}
            </ul>
            <Button asChild className="bg-orange-500 text-black hover:bg-orange-400">
              <Link to={c.cta.to}>{c.cta.label}</Link>
            </Button>
            <p className="text-sm text-white/60">{c.ctaNote}</p>
          </div>
          <DemoTour role={role} />
        </section>
      </div>
    </main>
  )
}
