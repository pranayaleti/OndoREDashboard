import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Loader2, AlertCircle } from "lucide-react"
import { notificationsApi, type Notification } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { getDemoNotifications } from "@/lib/seed-data"
import { EmptyState } from "@/components/ui/empty-state"

interface NotificationsListPageProps {
  title?: string
  subtitle?: string
}

export function NotificationsListPage({
  title = "Notifications",
  subtitle = "Stay updated with important updates",
}: NotificationsListPageProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const { toast } = useToast()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { notifications: data } = await notificationsApi.getNotifications(false, 1, 50)
      const fallbackNotifications = getDemoNotifications(user)
      setNotifications(data.length === 0 && fallbackNotifications.length > 0 ? fallbackNotifications : data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications")
      setNotifications(getDemoNotifications(user))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (id: string) => {
    try {
      if (getDemoNotifications(user).length === 0) {
        await notificationsApi.markAsRead(id)
      }
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      toast({ title: "Marked as read" })
    } catch {
      toast({ title: "Failed to update", variant: "destructive" })
    }
  }

  const markAllAsRead = async () => {
    try {
      if (getDemoNotifications(user).length === 0) {
        await notificationsApi.markAllAsRead()
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast({ title: "All marked as read" })
    } catch {
      toast({ title: "Failed to update", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-10 w-10 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Could not load notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchNotifications}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-orange-500 dark:text-orange-400" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
          <Badge variant="secondary" className="ml-2">
            {notifications.length}
          </Badge>
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          Unread
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <EmptyState
                icon={<Bell className="h-12 w-12" />}
                title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
                description={filter === "unread" ? "You’re all caught up for now." : "We’ll show rent, maintenance, and lease updates here."}
                ctaLabel="Open dashboard"
                ctaHref={user?.role ? `/${user.role === "manager" ? "dashboard" : user.role}` : "/"}
              />
            </CardContent>
          </Card>
        ) : (
          filtered.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-80" : ""}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ""}
                    </p>
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
