"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, MapPin, Monitor, Smartphone, Tablet, Shield, ChevronRight } from "lucide-react"
import { Label } from "@/components/ui/label"
import { formatDistanceToNow } from "date-fns"
import { formatDateTime } from "@/lib/locale-format"

export interface LoginSession {
  id: string
  timestamp: string
  location: string
  ipAddress: string
  device: string
  browser: string
  isCurrent: boolean
}

interface LoginHistoryProps {
  lastLogin?: LoginSession
  loginHistory?: LoginSession[]
  onViewHistory?: () => void
}

// Mock function to get device type from user agent
const getDeviceType = (userAgent: string): { type: string; icon: React.ReactNode } => {
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    if (/tablet|ipad/i.test(userAgent)) {
      return { type: "Tablet", icon: <Tablet className="h-4 w-4" /> }
    }
    return { type: "Mobile", icon: <Smartphone className="h-4 w-4" /> }
  }
  return { type: "Desktop", icon: <Monitor className="h-4 w-4" /> }
}

// Mock function to get location from IP (in real app, this would come from API)
const getLocationFromIP = (ip: string): string => {
  // Mock location data - in production, this would come from an IP geolocation service
  const mockLocations: Record<string, string> = {
    "192.168.1.1": "Salt Lake City, UT, US",
    "10.0.0.1": "Denver, CO, US",
    "172.16.0.1": "San Francisco, CA, US",
  }
  return mockLocations[ip] || "Unknown Location"
}

export function LoginHistory({ lastLogin, loginHistory, onViewHistory }: LoginHistoryProps) {
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<string>("")
  const [currentIP, setCurrentIP] = useState<string>("")

  useEffect(() => {
    // Get current location and IP (mock for now)
    // In production, this would come from the API
    setCurrentIP("192.168.1.1")
    setCurrentLocation(getLocationFromIP("192.168.1.1"))
  }, [])

  // Default mock data if not provided
  const defaultLastLogin: LoginSession = {
    id: "1",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    location: currentLocation || "Salt Lake City, UT, US",
    ipAddress: currentIP || "192.168.1.1",
    device: "Desktop",
    browser: "Chrome",
    isCurrent: true,
  }

  const defaultHistory: LoginSession[] = [
    defaultLastLogin,
    {
      id: "2",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      location: "Denver, CO, US",
      ipAddress: "10.0.0.1",
      device: "Mobile",
      browser: "Safari",
      isCurrent: false,
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      location: "San Francisco, CA, US",
      ipAddress: "172.16.0.1",
      device: "Desktop",
      browser: "Firefox",
      isCurrent: false,
    },
    {
      id: "4",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      location: "Salt Lake City, UT, US",
      ipAddress: "192.168.1.1",
      device: "Tablet",
      browser: "Chrome",
      isCurrent: false,
    },
  ]

  const lastLoginData = lastLogin || defaultLastLogin
  const historyData = loginHistory || defaultHistory

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
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
  }

  const lastLoginDate = formatDate(lastLoginData.timestamp)
  const deviceInfo = typeof navigator !== 'undefined' ? getDeviceType(navigator.userAgent) : { type: "Unknown", icon: <Monitor className="h-4 w-4" /> }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Login Activity
          </CardTitle>
          <CardDescription>View your recent login sessions and activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Last Login */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Last Login</Label>
              <Badge variant="outline" className="text-xs">
                Current Session
              </Badge>
            </div>
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
              <div className="flex items-center gap-2 text-sm mt-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{lastLoginData.location}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  {deviceInfo.icon}
                  <span>{lastLoginData.device}</span>
                </div>
                <span>•</span>
                <span>{lastLoginData.browser}</span>
                <span>•</span>
                <span>IP: {lastLoginData.ipAddress}</span>
              </div>
            </div>
          </div>

          {/* View History Button */}
          <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" onClick={() => onViewHistory?.()}>
                View Login History
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Login History</DialogTitle>
                <DialogDescription>
                  View all your recent login sessions and activity
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  {historyData.map((session) => {
                    const sessionDate = formatDate(session.timestamp)
                    const sessionDevice = getDeviceType(session.device)
                    return (
                      <Card key={session.id} className={session.isCurrent ? "ring-2 ring-primary" : ""}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{sessionDate.relative}</span>
                                {session.isCurrent && (
                                  <Badge variant="outline" className="text-xs">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground ml-6">{sessionDate.absolute}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{session.location}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                {sessionDevice.icon}
                                <span>{session.device}</span>
                              </div>
                              <span>•</span>
                              <span>{session.browser}</span>
                              <span>•</span>
                              <span>IP: {session.ipAddress}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}

