/**
 * Type definitions for property-management page.
 * Moved from OndoREui (page removed; login/property-management live on Dashboard).
 */

import type React from "react"

export interface PageProps {
  params?: Promise<Record<string, string | string[] | undefined>>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export interface LayoutProps {
  children?: React.ReactNode
  params?: Promise<Record<string, string | string[] | undefined>>
}
