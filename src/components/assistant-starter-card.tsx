import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AssistantStarterCardProps {
  title: string
  description: string
  promptLabel: string
  prompts: string[]
  assistantHref: string
  ctaLabel: string
  dataTourTarget?: string
}

export function AssistantStarterCard({
  title,
  description,
  promptLabel,
  prompts,
  assistantHref,
  ctaLabel,
  dataTourTarget,
}: AssistantStarterCardProps) {
  const navigate = useNavigate()

  const openAssistant = (prompt?: string) => {
    navigate(assistantHref, {
      state: prompt ? { initialMessage: prompt } : undefined,
    })
  }

  return (
    <Card
      className="overflow-hidden border-orange-200/70 bg-gradient-to-br from-card via-orange-50/60 to-amber-50/80 dark:border-orange-500/20 dark:from-background dark:via-background dark:to-card"
      data-tour-target={dataTourTarget}
    >
      <CardHeader className="border-b border-orange-100/80 pb-5 dark:border-orange-500/10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-800 dark:bg-orange-500/10 dark:text-orange-300">
              <Sparkles className="h-3.5 w-3.5" />
              Assistant
            </div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="max-w-2xl">{description}</CardDescription>
          </div>
          <Button asChild variant="outline" className="border-orange-200 bg-card/80 text-orange-800 hover:bg-orange-50 dark:border-orange-500/20 dark:bg-background/70 dark:text-orange-200">
            <Link to={assistantHref}>
              {ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {promptLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-orange-200 bg-card/80 text-orange-800 hover:bg-orange-50 dark:border-orange-500/20 dark:bg-background/60 dark:text-orange-200"
              onClick={() => openAssistant(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
