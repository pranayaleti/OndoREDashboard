import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ActivityItem } from "../types"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Building,
  Wrench,
  Users,
  DollarSign,
  FileText,
  MessageSquare,
  Activity,
} from "lucide-react"

interface ActivityFeedProps {
  activities: ActivityItem[]
  title?: string
  description?: string
  maxItems?: number
  emptyMessage?: string
  className?: string
}

const getDefaultIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "property":
      return <Building className="h-4 w-4 text-blue-500" />
    case "maintenance":
      return <Wrench className="h-4 w-4 text-orange-500" />
    case "user":
      return <Users className="h-4 w-4 text-purple-500" />
    case "payment":
      return <DollarSign className="h-4 w-4 text-green-500" />
    case "document":
      return <FileText className="h-4 w-4 text-gray-500" />
    case "message":
      return <MessageSquare className="h-4 w-4 text-blue-500" />
    default:
      return <Activity className="h-4 w-4 text-gray-500" />
  }
}

const getStatusVariant = (status?: ActivityItem["status"]) => {
  switch (status) {
    case "success":
      return "default"
    case "error":
      return "destructive"
    case "warning":
      return "secondary"
    default:
      return "outline"
  }
}

export function ActivityFeed({
  activities,
  title = "Recent Activity",
  description = "Latest system activities",
  maxItems = 10,
  emptyMessage = "No recent activity",
  className,
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems)

  if (displayedActivities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedActivities.map((activity) => {
          const content = (
            <div
              className={cn(
                "flex items-start justify-between p-3 border rounded-lg",
                activity.href && "hover:bg-muted dark:hover:bg-card cursor-pointer transition-colors"
              )}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">
                  {activity.icon || getDefaultIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.message}</p>
                  <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
              {activity.status && (
                <Badge variant={getStatusVariant(activity.status)}>
                  {activity.status}
                </Badge>
              )}
            </div>
          )

          if (activity.href) {
            return (
              <Link key={activity.id} to={activity.href}>
                {content}
              </Link>
            )
          }

          return <div key={activity.id}>{content}</div>
        })}
      </CardContent>
    </Card>
  )
}

