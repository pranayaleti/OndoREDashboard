import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"

type PortalTourRole = "owner" | "tenant"

interface TourStep {
  id: string
  title: string
  description: string
  selectors: string[]
}

interface PortalOnboardingTourProps {
  role: PortalTourRole
  basePath: string
}

const TOUR_VERSION = "v1"

function getStorageKey(role: PortalTourRole) {
  return `ondo.portal-tour.${role}.${TOUR_VERSION}`
}

export function PortalOnboardingTour({ role, basePath }: PortalOnboardingTourProps) {
  const { t } = useTranslation(["common", "owner", "tenant"])
  const [isOpen, setIsOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)

  const steps = useMemo<TourStep[]>(() => {
    if (role === "owner") {
      return [
        {
          id: "assistant",
          title: t("owner:tour.assistantTitle"),
          description: t("owner:tour.assistantDescription"),
          selectors: [
            '[data-tour-target="owner-assistant-search"]',
            '[data-tour-target="owner-assistant-nav"]',
          ],
        },
        {
          id: "action-items",
          title: t("owner:tour.actionItemsTitle"),
          description: t("owner:tour.actionItemsDescription"),
          selectors: ['[data-tour-target="owner-action-items-nav"]'],
        },
        {
          id: "documents",
          title: t("owner:tour.documentsTitle"),
          description: t("owner:tour.documentsDescription"),
          selectors: [
            '[data-tour-target="owner-documents-nav"]',
            '[data-tour-target="owner-documents-card"]',
          ],
        },
      ]
    }

    return [
      {
        id: "assistant",
        title: t("tenant:tour.assistantTitle"),
        description: t("tenant:tour.assistantDescription"),
        selectors: [
          '[data-tour-target="tenant-assistant-starter"]',
          '[data-tour-target="tenant-assistant-nav"]',
        ],
      },
      {
        id: "payments",
        title: t("tenant:tour.paymentsTitle"),
        description: t("tenant:tour.paymentsDescription"),
        selectors: [
          '[data-tour-target="tenant-quick-pay"]',
          '[data-tour-target="tenant-payments-nav"]',
        ],
      },
      {
        id: "maintenance",
        title: t("tenant:tour.maintenanceTitle"),
        description: t("tenant:tour.maintenanceDescription"),
        selectors: [
          '[data-tour-target="tenant-maintenance-timeline"]',
          '[data-tour-target="tenant-maintenance-nav"]',
        ],
      },
    ]
  }, [role, t])

  useEffect(() => {
    const isEligiblePath = window.location.pathname === basePath
    const hasCompletedTour = window.localStorage.getItem(getStorageKey(role)) === "true"

    if (isEligiblePath && !hasCompletedTour) {
      setIsOpen(true)
    }
  }, [basePath, role])

  useEffect(() => {
    if (!isOpen) return

    const resolveTarget = () => {
      const currentStep = steps[stepIndex]
      if (!currentStep) return null

      for (const selector of currentStep.selectors) {
        const element = document.querySelector<HTMLElement>(selector)
        if (element) return element
      }

      return null
    }

    const updateHighlight = (shouldScroll = false) => {
      const target = resolveTarget()
      if (!target) {
        setHighlightRect(null)
        return
      }

      if (shouldScroll) {
        target.scrollIntoView({ block: "center", behavior: "smooth" })
      }
      setHighlightRect(target.getBoundingClientRect())
    }

    updateHighlight(true)
    const intervalId = window.setInterval(() => updateHighlight(false), 500)
    const handleWindowUpdate = () => updateHighlight(false)
    window.addEventListener("resize", handleWindowUpdate)
    window.addEventListener("scroll", handleWindowUpdate, true)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("resize", handleWindowUpdate)
      window.removeEventListener("scroll", handleWindowUpdate, true)
    }
  }, [isOpen, stepIndex, steps])

  if (!isOpen || steps.length === 0) {
    return null
  }

  const currentStep = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1

  const completeTour = () => {
    window.localStorage.setItem(getStorageKey(role), "true")
    setIsOpen(false)
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]" />

      {highlightRect ? (
        <div
          className="absolute rounded-2xl border-2 border-orange-400 bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] transition-all duration-300"
          style={{
            left: highlightRect.left - 8,
            top: highlightRect.top - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
          }}
        />
      ) : null}

      <div className="pointer-events-auto absolute bottom-6 right-6 w-[min(92vw,28rem)]">
        <Card className="border-orange-200 bg-white/95 shadow-2xl backdrop-blur dark:border-orange-500/20 dark:bg-slate-950/95">
          <CardHeader className="space-y-3 pb-3">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600 dark:text-orange-300">
              {t("common:tour.step", { current: stepIndex + 1, total: steps.length })}
            </div>
            <CardTitle>{currentStep.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">{currentStep.description}</p>
            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={completeTour}>
                {t("common:tour.skip")}
              </Button>
              <div className="flex items-center gap-2">
                {stepIndex > 0 ? (
                  <Button variant="outline" onClick={() => setStepIndex((index) => Math.max(0, index - 1))}>
                    {t("common:tour.back")}
                  </Button>
                ) : null}
                <Button
                  className="bg-gradient-to-r from-orange-500 to-red-700 text-white hover:from-orange-600 hover:to-red-800"
                  onClick={() => {
                    if (isLastStep) {
                      completeTour()
                      return
                    }

                    setStepIndex((index) => Math.min(steps.length - 1, index + 1))
                  }}
                >
                  {isLastStep ? t("common:tour.done") : t("common:tour.next")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
