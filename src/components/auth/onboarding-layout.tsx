import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface OnboardingLayoutProps {
  title: string
  subtitle?: string
  hero?: ReactNode
  sidebar?: ReactNode
  children: ReactNode
  className?: string
  compact?: boolean
}

export function OnboardingLayout({ title, subtitle, hero, sidebar, children, className, compact = false }: OnboardingLayoutProps) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-white", className)}>
      <div className="pointer-events-none absolute inset-0 bg-slate-950" />
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.03] to-transparent" />
      {compact ? (
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
          <div className="w-full space-y-6 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
              {subtitle ? <p className="text-sm text-white/70 sm:text-base">{subtitle}</p> : null}
            </div>
            {hero}
            {sidebar}
            {children}
          </div>
        </div>
      ) : (
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
            {subtitle && <p className="text-lg text-white/70">{subtitle}</p>}
            {hero}
            {sidebar}
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
