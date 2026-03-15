/**
 * Type definitions for login page.
 * Moved from OndoREui (login page removed; login lives on Dashboard).
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

