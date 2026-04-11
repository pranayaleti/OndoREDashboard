import { ReactNode } from "react"
import { UserRole } from "@/lib/auth-utils"

/**
 * Base Dashboard Configuration Types
 * 
 * ARCHITECTURE OVERVIEW:
 * - BaseDashboard: Main component providing common layout (header, tabs, content)
 * - BaseDashboardProvider: Context provider managing data fetching and shared state
 * - PortalConfig: Configuration object defining portal-specific content and behavior
 * - Widgets: Reusable components (StatCard, ActivityFeed, QuickActions)
 * 
 * CREATING A NEW PORTAL:
 * 1. Create portal config function (e.g., createOwnerConfig) that returns PortalConfig
 * 2. Create portal component wrapping BaseDashboardProvider and BaseDashboard
 * 3. Define statCards, quickActions, tabs, and dataFetchers in config
 * 4. Use useBaseDashboard hook to access fetched data
 * 
 * MIGRATION PATTERN:
 * - Extract common UI patterns to base components
 * - Move stat calculations to config generation
 * - Replace manual data fetching with dataFetchers in config
 * - Use BaseDashboard instead of custom layout code
 */

export interface DashboardWidget {
  id: string
  title: string
  component: ReactNode
  gridCols?: 1 | 2 | 3 | 4 // Grid column span
  priority?: number // For ordering
}

export interface StatCardConfig {
  id: string
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  footer?: ReactNode
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  onClick?: () => void
  href?: string
}

export interface ActivityItem {
  id: string
  type: "property" | "maintenance" | "user" | "payment" | "document" | "message" | "system"
  message: string
  time: string
  status?: "success" | "error" | "warning" | "info"
  icon?: ReactNode
  href?: string
}

export interface QuickAction {
  id: string
  title: string
  description?: string
  icon: ReactNode
  href?: string
  onClick?: () => void
  variant?: "default" | "primary" | "secondary"
}

export interface DashboardTab {
  id: string
  label: string
  value: string
  content: ReactNode
  icon?: ReactNode
}

export interface PortalConfig {
  // Portal identification
  portalId: string
  role: UserRole
  title: string
  description?: string
  
  // Layout configuration
  showHeader?: boolean
  showTabs?: boolean
  showQuickActions?: boolean
  showStats?: boolean
  showActivityFeed?: boolean
  
  // Content configuration
  tabs?: DashboardTab[]
  statCards?: StatCardConfig[]
  quickActions?: QuickAction[]
  widgets?: DashboardWidget[]
  
  // Customization
  headerIcon?: ReactNode
  headerActions?: ReactNode
  customSections?: ReactNode[]
  
  // Data fetching
  dataFetchers?: {
    [key: string]: () => Promise<any>
  }
  
  // Permissions
  permissions?: string[]
  
  // Theme/styling
  theme?: {
    primaryColor?: string
    accentColor?: string
  }
}

export interface BaseDashboardProps {
  config: PortalConfig
  children?: ReactNode
  className?: string
}

export interface DashboardData {
  loading: boolean
  error: Error | null
  stats?: Record<string, any>
  activities?: ActivityItem[]
  [key: string]: any
}
