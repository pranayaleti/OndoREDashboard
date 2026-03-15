/**
 * Type definitions for property-management/zip/[zip] page.
 * Moved from OndoREui (route removed; property-management lives on Dashboard).
 */

import type React from "react"

export interface SegmentParams {
  zip?: string
}

export interface PageProps {
  params?: Promise<SegmentParams>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export interface LayoutProps {
  children?: React.ReactNode
  params?: Promise<SegmentParams>
}
