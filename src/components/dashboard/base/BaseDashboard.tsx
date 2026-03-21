import { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BaseDashboardProps } from "./types"
import { useBaseDashboard } from "./BaseDashboardContext"
import { StatCard } from "./widgets/StatCard"
import { ActivityFeed } from "./widgets/ActivityFeed"
import { QuickActions } from "./widgets/QuickActions"
import { useAuth } from "@/lib/auth-context"
import { getDashboardPath } from "@/lib/auth-utils"
import { companyInfo } from "@/constants/companyInfo"
import { useDashboardTheme } from "./hooks/useDashboardTheme"

/**
 * BaseDashboard Component
 * 
 * Provides a consistent layout structure for all portal dashboards.
 * Portals can customize through configuration and render props.
 * 
 * USAGE:
 * ```tsx
 * <BaseDashboardProvider config={portalConfig}>
 *   <BaseDashboard config={portalConfig} />
 * </BaseDashboardProvider>
 * ```
 * 
 * FEATURES:
 * - Automatic loading states
 * - Configurable header, tabs, stats, quick actions
 * - Activity feed support
 * - Custom widgets via configuration
 * - Responsive grid layouts
 */
export function BaseDashboard({ config, children, className }: BaseDashboardProps) {
  const { data, loading } = useBaseDashboard()
  const { user } = useAuth()
  const _basePath = user ? getDashboardPath(user.role) : "/"
  void _basePath
  const { getThemeStyle, primaryColor } = useDashboardTheme()

  if (loading && config.dataFetchers && Object.keys(config.dataFetchers).length > 0) {
    return (
      <div className={cn("min-h-screen bg-transparent", className)} style={getThemeStyle()}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
            <div className="text-lg text-muted-foreground">Loading dashboard...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-transparent", className)} style={getThemeStyle()}>
      {/* Header Section */}
      {config.showHeader !== false && (
        <div className="bg-white dark:bg-gray-800 border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: primaryColor }}>
                {companyInfo.name}
              </h1>
              {config.title && config.title !== "Dashboard" && (
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mt-1">
                  {config.title}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {renderDashboardContent(config, data)}
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Renders common dashboard sections based on configuration
 */
function renderDashboardContent(config: BaseDashboardProps["config"], data: any): ReactNode {
  return (
    <>
      {/* Quick Actions */}
      {config.showQuickActions && config.quickActions && config.quickActions.length > 0 && (
        <QuickActions actions={config.quickActions} />
      )}

      {/* Stats Cards */}
      {config.showStats !== false && config.statCards && config.statCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {config.statCards.map((stat) => (
            <StatCard key={stat.id} config={stat} />
          ))}
        </div>
      )}

      {/* Custom Widgets */}
      {config.widgets && config.widgets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {config.widgets
            .sort((a, b) => (a.priority || 0) - (b.priority || 0))
            .map((widget) => (
              <div
                key={widget.id}
                className={cn(
                  widget.gridCols === 1 && "lg:col-span-1",
                  widget.gridCols === 2 && "lg:col-span-2",
                  widget.gridCols === 3 && "lg:col-span-3",
                  widget.gridCols === 4 && "lg:col-span-4"
                )}
              >
                {widget.component}
              </div>
            ))}
        </div>
      )}

      {/* Activity Feed */}
      {config.showActivityFeed && data.activities && (
        <ActivityFeed activities={data.activities} />
      )}

      {/* Custom Sections */}
      {config.customSections && config.customSections.map((section, index) => (
        <div key={index}>{section}</div>
      ))}
    </>
  )
}

