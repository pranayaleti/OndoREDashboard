import type React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  onCtaClick?: () => void
  action?: React.ReactNode
  className?: string
}

/**
 * Reusable empty-state placeholder for lists, tables, and views.
 * Keeps visual language consistent across the entire dashboard.
 */
export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  action,
  className,
}: EmptyStateProps) {
  const resolvedAction =
    action ??
    (ctaLabel
      ? ctaHref
        ? (
            <Button asChild>
              <Link to={ctaHref}>{ctaLabel}</Link>
            </Button>
          )
        : (
            <Button type="button" onClick={onCtaClick}>
              {ctaLabel}
            </Button>
          )
      : null)

  return (
    <div className={cn("flex flex-col items-center justify-center py-14 text-center", className)}>
      <div className="mb-4 text-muted-foreground/60">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      {resolvedAction ? <div>{resolvedAction}</div> : null}
    </div>
  )
}
