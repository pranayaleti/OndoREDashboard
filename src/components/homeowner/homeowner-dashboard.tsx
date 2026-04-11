import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { HomeownerPropertyShell } from "./homeowner-property-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { HomeCareRemindersCard } from "@/components/HomeCareRemindersCard"
import { homeownerApi, dashboardApi, type HomeownerSummary } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { getDashboardPath } from "@/lib/auth-utils"
import { Search, Sparkles, FileText } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/locale-format"

function fmtMoney(cents: number) {
  return formatCurrency(cents / 100, "USD", {
    maximumFractionDigits: 0,
  })
}

const SUGGESTIONS = [
  "Spring checklist",
  "Equipment tips",
  "Recommended projects",
  "Review insurance coverage",
  "Property tax due dates",
]

export function HomeownerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const base = user ? getDashboardPath(user.role) : "/owner"
  const [query, setQuery] = useState("")

  const onSearch = (q: string) => {
    const text = q.trim()
    if (text) {
      navigate(`${base}/search?q=${encodeURIComponent(text)}`)
    } else {
      navigate(`${base}/search`)
    }
  }

  return (
    <HomeownerPropertyShell>
      {({ propertyId }) => (
        <HomeownerDashboardInner
          propertyId={propertyId}
          basePath={base}
          assistantPath={`${base}/assistant`}
          query={query}
          setQuery={setQuery}
          onSearch={onSearch}
        />
      )}
    </HomeownerPropertyShell>
  )
}

function HomeownerDashboardInner({
  propertyId,
  basePath,
  assistantPath,
  query,
  setQuery,
  onSearch,
}: {
  propertyId: string
  basePath: string
  assistantPath: string
  query: string
  setQuery: (s: string) => void
  onSearch: (q: string) => void
}) {
  const { user } = useAuth()
  const { t } = useTranslation("owner")
  const navigate = useNavigate()
  const [summary, setSummary] = useState<HomeownerSummary | null>(null)
  const [payments, setPayments] = useState<
    Awaited<ReturnType<typeof dashboardApi.getDashboardPayments>>["data"]
  >([])
  const [loading, setLoading] = useState(true)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [sum, pay] = await Promise.all([
          homeownerApi.getSummary(propertyId),
          dashboardApi.getDashboardPayments(1, 8),
        ])
        if (!cancelled) {
          setSummary(sum)
          setPayments(
            pay.data.filter(
              (p) => !p.propertyId || p.propertyId === propertyId
            )
          )
        }
      } catch {
        if (!cancelled) setSummary(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [propertyId])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % SUGGESTIONS.length)
    }, 2400)

    return () => window.clearInterval(interval)
  }, [])

  const first = user?.firstName?.trim() || "there"
  const today = new Date()
  const welcomeDate = formatDate(today, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const financialCents = [
    summary?.monthlyExpensesCents ?? 0,
    summary?.utilitiesThisMonthCents ?? 0,
    summary?.subscriptionsThisMonthCents ?? 0,
    summary?.householdThisMonthCents ?? 0,
  ]
  const hasFinancialData = financialCents.some((value) => value > 0)

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Welcome back, {first}. It&apos;s {welcomeDate}. How can we help?
        </h1>
        <p className="text-sm text-muted-foreground">
          Ask anything about your property — search uses your data to give personalized answers.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1" data-tour-target="owner-assistant-search">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="py-6 pl-10 pr-4 text-base"
            placeholder={`Try: "${SUGGESTIONS[placeholderIndex]}"`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch(query)
            }}
            aria-label="Ask your assistant"
          />
        </div>
        <Button
          type="button"
          className="shrink-0 bg-gradient-to-r from-orange-500 to-red-800"
          onClick={() => onSearch(query)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((label) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-orange-200 dark:border-orange-500/30 bg-orange-500/10 dark:bg-orange-500/15 text-orange-800 dark:text-orange-300 hover:bg-orange-500/20"
            onClick={() => {
              setQuery(label)
              onSearch(label)
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      <section>
        <h2 className="mb-4 font-serif text-xl font-semibold">Home details</h2>
        {loading || hasFinancialData ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Monthly expenses"
              subtitle="This month (from recorded expenses)"
              value={fmtMoney(summary?.monthlyExpensesCents ?? 0)}
              loading={loading}
            />
            <SummaryCard
              title="Utilities"
              subtitle="This month"
              value={fmtMoney(summary?.utilitiesThisMonthCents ?? 0)}
              loading={loading}
            />
            <SummaryCard
              title="Subscriptions & fees"
              subtitle="Mgmt / HOA / recurring (approx.)"
              value={fmtMoney(summary?.subscriptionsThisMonthCents ?? 0)}
              loading={loading}
            />
            <SummaryCard
              title="Household"
              subtitle="Repairs, maintenance & other"
              value={fmtMoney(summary?.householdThisMonthCents ?? 0)}
              loading={loading}
            />
          </div>
        ) : (
          <Card className="border-orange-200/80 bg-gradient-to-br from-card via-orange-50/50 to-amber-50/70 shadow-sm dark:border-orange-500/20 dark:from-background dark:via-background dark:to-card">
            <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-600 dark:text-orange-300">
                  {t("home.setupEyebrow")}
                </p>
                <div>
                  <h3 className="text-xl font-semibold">{t("home.emptyTitle")}</h3>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    {t("home.emptyDescription")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-gradient-to-r from-orange-500 to-red-700 text-white hover:from-orange-600 hover:to-red-800">
                  <Link to="/owner/finances">{t("home.connectBank")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/owner/properties">{t("home.addPropertyValue")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest rent and payment events</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {payments.length === 0 ? (
                <li className="text-muted-foreground">No recent payments.</li>
              ) : (
                payments.slice(0, 6).map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between gap-2 border-b border-border/60 pb-2 last:border-0"
                  >
                    <span className="min-w-0 truncate">
                      {p.description || p.paymentType || "Payment"}
                      {p.propertyTitle ? (
                        <span className="block text-xs text-muted-foreground">
                          {p.propertyTitle}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-medium">
                      {fmtMoney(p.amountCents)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>

        <HomeCareRemindersCard />
      </div>

      <Card
        className="cursor-pointer border-border/80 shadow-sm transition-shadow hover:shadow-md"
        onClick={() => navigate(`${basePath}/my-documents`)}
        role="link"
        tabIndex={0}
        data-tour-target="owner-documents-card"
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate(`${basePath}/my-documents`)
        }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <FileText className="h-5 w-5 text-orange-600" />
            {t("home.myUploadsTitle")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("home.myUploadsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-orange-200 dark:border-orange-500/30 text-orange-800 dark:text-orange-300 hover:bg-orange-500/10"
          >
            <Link to={`${basePath}/my-documents`}>{t("home.manageUploads")}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 hover:bg-orange-500/10">
            <Link to={`${basePath}/documents`}>{t("home.viewSharedDocs")}</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Open the full assistant at{" "}
        <Link to={assistantPath} className="text-ondo-orange underline">
          Assistant
        </Link>{" "}
        for more tools and follow-up questions.
      </p>
    </div>
  )
}

function SummaryCard({
  title,
  subtitle,
  value,
  loading: isLoading,
}: {
  title: string
  subtitle: string
  value: string
  loading?: boolean
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="font-serif text-2xl font-semibold tabular-nums">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}
