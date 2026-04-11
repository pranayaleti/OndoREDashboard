import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { StatCardConfig } from "../types"
import { Link } from "react-router-dom"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useDashboardTheme } from "../hooks/useDashboardTheme"

interface StatCardProps {
  config: StatCardConfig
  className?: string
}

export function StatCard({ config, className }: StatCardProps) {
  const { primaryColor } = useDashboardTheme()
  
  const cardContent = (
    <Card className={cn("hover:shadow-md transition-shadow", config.onClick || config.href ? "cursor-pointer" : "", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
        <div className="h-4 w-4" style={{ color: primaryColor }}>
          {config.icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{config.value}</div>
        {config.subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{config.subtitle}</p>
        )}
        {config.trend && (
          <div className={cn(
            "flex items-center text-xs mt-1",
            config.trend.isPositive !== false ? "text-emerald-500" : "text-red-500"
          )}>
            {config.trend.isPositive !== false ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {config.trend.value > 0 && "+"}
            {config.trend.value}% {config.trend.label}
          </div>
        )}
        {config.footer ? <div className="mt-4">{config.footer}</div> : null}
      </CardContent>
    </Card>
  )

  if (config.href) {
    return (
      <Link to={config.href} className="block">
        {cardContent}
      </Link>
    )
  }

  if (config.onClick) {
    return (
      <div onClick={config.onClick}>
        {cardContent}
      </div>
    )
  }

  return cardContent
}
