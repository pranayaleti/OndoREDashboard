import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { getDashboardPath } from "@/lib/auth-utils"
import {
  User,
  FileText,
  Shield,
  Bell,
  ChevronRight,
} from "lucide-react"

export function HomeownerSettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const base = user ? getDashboardPath(user.role) : "/owner"

  const links = [
    {
      icon: User,
      title: "Profile",
      description: "Update your name, email, phone, and profile picture",
      href: `${base}/profile`,
    },
    {
      icon: FileText,
      title: "Documents",
      description: "Manage uploaded property documents for AI-powered search",
      href: `${base}/my-documents`,
    },
    {
      icon: Shield,
      title: "Security",
      description: "Change password, two-factor authentication, and login history",
      href: `${base}/profile`,
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure email alerts, maintenance reminders, and digest preferences",
      href: `${base}/profile`,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, documents, and notification preferences.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Card
            key={link.title}
            className="cursor-pointer border-border/80 transition-shadow hover:shadow-md"
            onClick={() => navigate(link.href)}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(link.href)
            }}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <link.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{link.title}</CardTitle>
                <CardDescription className="text-xs">{link.description}</CardDescription>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription className="text-xs">
            Signed in as {user?.email ?? "—"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${base}/profile`)}
          >
            View full profile
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
