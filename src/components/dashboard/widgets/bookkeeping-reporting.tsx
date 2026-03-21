import { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  FileSpreadsheet,
  Layers3,
  Receipt,
  ReceiptText,
  ShieldCheck,
} from "lucide-react"

interface FeatureItem {
  label: string
  description?: string
  icon?: ReactNode
  /** In-app path (e.g. `/dashboard/finances`) or external URL */
  href?: string
}

interface TransactionRow {
  label: string
  value: string
  hint?: string
  positive?: boolean
}

interface CashFlowSummary {
  netCashFlow: string
  cashInflow: string
  cashOutflow: string
  months?: string[]
}

interface TaxSummary {
  timePeriod: string
  properties: string
  categorized: number
  uncategorized: number
  attachments: number
  ctaLabel?: string
  ctaHref?: string
}

interface BookkeepingReportingProps {
  className?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
  features?: FeatureItem[]
  transactions?: TransactionRow[]
  cashFlow?: CashFlowSummary
  taxSummary?: TaxSummary
  /** When set, the Transactions preview panel navigates here */
  transactionsHref?: string
  /** When set, the Net cash flow panel navigates here */
  cashFlowHref?: string
  /** When set, the entire tax package card (including CTA) is one link */
  taxPackageCardHref?: string
}

function SmartLink({
  href,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  href: string
  className?: string
  children: ReactNode
  "aria-label"?: string
}) {
  const internal = href.startsWith("/") && !href.startsWith("//")
  if (internal) {
    return (
      <Link to={href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  )
}

/**
 * Bookkeeping & Reporting widget showcased on every portal dashboard.
 * Defaults intentionally mirror the marketing mock so the widget feels
 * consistent even before real data is wired up.
 */
export function BookkeepingReportingWidget({
  className,
  eyebrow = "Bookkeeping & Reporting",
  title = "Excel at real estate. Not spreadsheets.",
  subtitle = "Automate categorization, track income in real-time, and export tax-ready reports without wrestling CSVs.",
  ctaLabel = "Learn more",
  ctaHref = "#",
  features = [
    { label: "Auto-categorize transactions", icon: <BadgeCheck className="h-4 w-4" /> },
    { label: "Monitor income & expenses", icon: <BarChart3 className="h-4 w-4" /> },
    { label: "Auto-generate reports", icon: <FileSpreadsheet className="h-4 w-4" /> },
    { label: "Make tax time simple", icon: <Receipt className="h-4 w-4" /> },
  ],
  transactions = [
    { label: "Mortgage Principal", value: "$1,200.00", hint: "San Bernardino Duplex" },
    { label: "Baselane Rent", value: "$2,050.00", hint: "Culver City Cul de Sac", positive: true },
    { label: "Property Insurance", value: "$156.00", hint: "918 Lakeland Terrace" },
  ],
  cashFlow = {
    netCashFlow: "$26,445",
    cashInflow: "$95,475",
    cashOutflow: "$69,030",
    months: ["Apr", "May", "Jun", "Jul"],
  },
  taxSummary = {
    timePeriod: "Last Year",
    properties: "All Properties",
    categorized: 123,
    uncategorized: 2,
    attachments: 7,
    ctaLabel: "Download",
    ctaHref: "#",
  },
  transactionsHref,
  cashFlowHref,
  taxPackageCardHref,
}: BookkeepingReportingProps) {
  const transactionsPanelClass = cn(
    "rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur",
    transactionsHref && "transition-colors hover:bg-white/10 hover:border-white/20 focus-within:ring-2 focus-within:ring-emerald-300/50"
  )

  const cashFlowPanelClass = cn(
    "rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur",
    cashFlowHref && "transition-colors hover:bg-white/10 hover:border-white/20 focus-within:ring-2 focus-within:ring-emerald-300/50"
  )

  const taxCardClass =
    "sm:col-span-2 rounded-2xl border border-white/10 bg-white text-slate-900 p-6 shadow-xl"

  const taxCardBody = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Tax Package</p>
          <p className="text-lg font-semibold">Ready for filing</p>
        </div>
        <ReceiptText className="h-5 w-5 text-slate-400" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Time Period</p>
          <p className="font-medium">{taxSummary.timePeriod}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Properties</p>
          <p className="font-medium">{taxSummary.properties}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 rounded-2xl bg-slate-100 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span>Categorized Transactions</span>
          <strong>{taxSummary.categorized}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span>Uncategorized Transactions</span>
          <strong>{taxSummary.uncategorized}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span>Attachments</span>
          <strong>{taxSummary.attachments}</strong>
        </div>
      </div>
      <span className="mt-4 flex h-10 w-full items-center justify-center rounded-md bg-slate-900 text-sm font-medium text-white">
        {taxSummary.ctaLabel || "Download"}
      </span>
    </>
  )

  return (
    <Card
      className={cn(
        "overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-2xl",
        className
      )}
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr] items-center p-8">
        <div className="space-y-6">
          <Badge className="bg-emerald-300/20 text-emerald-200 border-emerald-200/30">{eyebrow}</Badge>
          <div>
            <h3 className="text-3xl font-semibold leading-tight">{title}</h3>
            <p className="mt-3 text-base text-slate-200/90">{subtitle}</p>
          </div>
          <Button asChild variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
            <SmartLink href={ctaHref} className="inline-flex items-center gap-2">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </SmartLink>
          </Button>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => {
              const inner = (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-200">
                    {feature.icon || <ShieldCheck className="h-4 w-4" />}
                  </div>
                  <div className="text-sm leading-tight">
                    <p className="font-medium text-white">{feature.label}</p>
                    {feature.description && <p className="text-slate-300/80">{feature.description}</p>}
                  </div>
                </>
              )

              if (feature.href) {
                return (
                  <SmartLink
                    key={feature.label}
                    href={feature.href}
                    className="flex items-start gap-3 rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
                    aria-label={`${feature.label} — open`}
                  >
                    {inner}
                  </SmartLink>
                )
              }

              return (
                <div key={feature.label} className="flex items-start gap-3 rounded-xl bg-white/5 p-4">
                  {inner}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {transactionsHref ? (
            <SmartLink
              href={transactionsHref}
              className={transactionsPanelClass}
              aria-label="View transactions"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-slate-300">Transactions</span>
                <Layers3 className="h-4 w-4 text-slate-400" />
              </div>
              <div className="space-y-4">
                {transactions.map((row) => (
                  <div key={row.label} className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{row.label}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-base font-semibold", row.positive && "text-emerald-300")}>
                        {row.value}
                      </span>
                      {row.hint && <span className="text-xs text-slate-400 text-right">{row.hint}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </SmartLink>
          ) : (
            <div className={transactionsPanelClass}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-slate-300">Transactions</span>
                <Layers3 className="h-4 w-4 text-slate-400" />
              </div>
              <div className="space-y-4">
                {transactions.map((row) => (
                  <div key={row.label} className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{row.label}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-base font-semibold", row.positive && "text-emerald-300")}>
                        {row.value}
                      </span>
                      {row.hint && <span className="text-xs text-slate-400 text-right">{row.hint}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cashFlowHref ? (
            <SmartLink href={cashFlowHref} className={cashFlowPanelClass} aria-label="View net cash flow">
              <span className="text-xs uppercase tracking-wide text-slate-400">Net Cash Flow</span>
              <p className="mt-2 text-3xl font-semibold">{cashFlow.netCashFlow}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Cash Inflow</p>
                  <p className="font-semibold text-white">{cashFlow.cashInflow}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Cash Outflow</p>
                  <p className="font-semibold text-white">{cashFlow.cashOutflow}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                {(cashFlow.months || []).map((month, idx) => {
                  const heights = [72, 88, 64, 92, 80]
                  const barHeight = heights[idx % heights.length]
                  return (
                    <div key={month} className="flex-1">
                      <div className="flex h-24 items-end rounded-full bg-white/10">
                        <div
                          className="w-full rounded-full bg-emerald-300/80"
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <p className="mt-2 text-center text-xs text-slate-400">{month}</p>
                    </div>
                  )
                })}
              </div>
            </SmartLink>
          ) : (
            <div className={cashFlowPanelClass}>
              <span className="text-xs uppercase tracking-wide text-slate-400">Net Cash Flow</span>
              <p className="mt-2 text-3xl font-semibold">{cashFlow.netCashFlow}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Cash Inflow</p>
                  <p className="font-semibold text-white">{cashFlow.cashInflow}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Cash Outflow</p>
                  <p className="font-semibold text-white">{cashFlow.cashOutflow}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                {(cashFlow.months || []).map((month, idx) => {
                  const heights = [72, 88, 64, 92, 80]
                  const barHeight = heights[idx % heights.length]
                  return (
                    <div key={month} className="flex-1">
                      <div className="flex h-24 items-end rounded-full bg-white/10">
                        <div
                          className="w-full rounded-full bg-emerald-300/80"
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <p className="mt-2 text-center text-xs text-slate-400">{month}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {taxPackageCardHref ? (
            <SmartLink
              href={taxPackageCardHref}
              className={cn(taxCardClass, "block text-left transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900")}
              aria-label="Tax package — open"
            >
              {taxCardBody}
            </SmartLink>
          ) : (
            <div className={taxCardClass}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Tax Package</p>
                  <p className="text-lg font-semibold">Ready for filing</p>
                </div>
                <ReceiptText className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Time Period</p>
                  <p className="font-medium">{taxSummary.timePeriod}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Properties</p>
                  <p className="font-medium">{taxSummary.properties}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 rounded-2xl bg-slate-100 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Categorized Transactions</span>
                  <strong>{taxSummary.categorized}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Uncategorized Transactions</span>
                  <strong>{taxSummary.uncategorized}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Attachments</span>
                  <strong>{taxSummary.attachments}</strong>
                </div>
              </div>
              <Button
                asChild
                variant="secondary"
                className="mt-4 w-full bg-slate-900 text-white hover:bg-slate-800"
              >
                <SmartLink href={taxSummary.ctaHref || "#"}>{taxSummary.ctaLabel || "Download"}</SmartLink>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
