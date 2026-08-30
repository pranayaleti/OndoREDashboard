"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Monitor, Smartphone, Tablet, Shield } from "lucide-react"
import { Label } from "@/components/ui/label"
import { formatDistanceToNow } from "date-fns"
import { formatDateTime } from "@/lib/locale-format"
import { useAuth } from "@/lib/auth-context"

function deviceIcon(device: string | null | undefined) {
  const value = (device ?? "").toLowerCase()
  if (value === "tablet") return <Tablet className="h-4 w-4" />
  if (value === "mobile") return <Smartphone className="h-4 w-4" />
  return <Monitor className="h-4 w-4" />
}

export function LoginHistory() {
  const { user } = useAuth()
  const lastLoginAt = user?.lastLoginAt ?? null
  const lastLoginIp = user?.lastLoginIp ?? null
  const lastLoginDevice = user?.lastLoginDevice ?? null
  const lastLoginBrowser = user?.lastLoginBrowser ?? null

  const lastLoginDate = lastLoginAt
    ? (() => {
        const date = new Date(lastLoginAt)
        if (Number.isNaN(date.getTime())) return null
        return {
          relative: formatDistanceToNow(date, { addSuffix: true }),
          absolute: formatDateTime(date, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        }
      })()
    : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Login Activity
          </CardTitle>
          <CardDescription>Your most recent successful sign-in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Last Login</Label>
              {lastLoginDate ? (
                <Badge variant="outline" className="text-xs">
                  Current Session
                </Badge>
              ) : null}
            </div>
            {lastLoginDate ? (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{lastLoginDate.relative}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">{lastLoginDate.absolute}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    {deviceIcon(lastLoginDevice)}
                    <span>{lastLoginDevice ?? "Unknown"}</span>
                  </div>
                  {lastLoginBrowser ? (
                    <>
                      <span>•</span>
                      <span>{lastLoginBrowser}</span>
                    </>
                  ) : null}
                  {lastLoginIp ? (
                    <>
                      <span>•</span>
                      <span>IP: {lastLoginIp}</span>
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                No login recorded yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
