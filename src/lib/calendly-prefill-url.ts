import { format } from "date-fns"
import { companyInfo } from "@/constants/companyInfo"

/** Calendly scheduling page — overridable for staging (`VITE_CALENDLY_URL`). */
export function getDashboardCalendlyBaseUrl(): string {
  const v = import.meta.env.VITE_CALENDLY_URL
  if (typeof v === "string" && v.trim()) return v.trim()
  return companyInfo.calendlyUrl
}

/**
 * Builds a shareable Calendly URL with prefill params Calendly documents publicly:
 * name, month (YYYY-MM), and optional custom answer `a1` (only if your event type has a matching custom question).
 *
 * Completing a booking on Calendly creates the hold on your Calendly / connected-calendar availability.
 * There is no unauthenticated API to “block” time without that booking flow or a connected calendar event.
 */
export function buildCalendlyPrefillBookingUrl(params: {
  title: string
  date: Date
  timeSummary: string
  extraNote?: string
} ): string {
  let u: URL
  try {
    u = new URL(getDashboardCalendlyBaseUrl())
  } catch {
    return getDashboardCalendlyBaseUrl()
  }

  const name = params.title.slice(0, 200)
  if (name) u.searchParams.set("name", name)

  u.searchParams.set("month", format(params.date, "yyyy-MM"))

  const noteParts = [format(params.date, "PPP"), params.timeSummary, params.extraNote].filter(Boolean)
  const note = noteParts.join(" · ")
  if (note) u.searchParams.set("a1", note.slice(0, 500))

  return u.toString()
}
