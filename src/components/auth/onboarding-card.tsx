import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface OnboardingCardProps {
  eyebrow?: string
  title: string
  description?: string
  icon?: ReactNode
  children?: ReactNode
}

export function OnboardingCard({ eyebrow, title, description, icon, children }: OnboardingCardProps) {
  return (
    <Card className="border-white/10 bg-card/60 text-white">
      <CardHeader className="flex flex-row items-start gap-4">
        {icon && <div className="rounded-2xl bg-card/75 p-3 text-orange-300">{icon}</div>}
        <div>
          {eyebrow && <p className="text-xs uppercase tracking-[0.4em] text-white/60">{eyebrow}</p>}
          <CardTitle className="text-xl text-white">{title}</CardTitle>
          {description && <CardDescription className="text-white/70">{description}</CardDescription>}
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  )
}
