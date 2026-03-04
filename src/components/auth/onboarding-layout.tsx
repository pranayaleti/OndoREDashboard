import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface OnboardingLayoutProps {
  title: string
  subtitle?: string
  hero?: ReactNode
  sidebar?: ReactNode
  children: ReactNode
  className?: string
}

export function OnboardingLayout({ title, subtitle, hero, sidebar, children, className }: OnboardingLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-slate-950 text-white px-4 py-10", className)}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-orange-300">Ondo onboarding</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
          {subtitle && <p className="text-lg text-white/70">{subtitle}</p>}
          {hero}
          {sidebar}
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}
