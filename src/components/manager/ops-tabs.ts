export const OPS_TABS = ["applications", "leases", "inspections", "floor-plans"] as const
export const DEFAULT_OPS_TAB = "inspections" as const
export type OpsTab = (typeof OPS_TABS)[number]

export function isOpsTab(value: string): value is OpsTab {
  return (OPS_TABS as readonly string[]).includes(value)
}

export function tabFromSearch(searchParams: URLSearchParams): OpsTab {
  const tabParam = searchParams.get("tab")
  return tabParam && isOpsTab(tabParam) ? tabParam : DEFAULT_OPS_TAB
}

/** When `tab` is present but invalid, return params with tab=inspections. Otherwise null. */
export function rewriteInvalidOpsTabSearch(searchParams: URLSearchParams): URLSearchParams | null {
  const tabParam = searchParams.get("tab")
  if (tabParam === null || isOpsTab(tabParam)) return null
  const next = new URLSearchParams(searchParams)
  next.set("tab", DEFAULT_OPS_TAB)
  return next
}
