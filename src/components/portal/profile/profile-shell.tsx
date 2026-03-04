import { ReactNode, useMemo, memo } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ImageUploader } from "@/components/ui/image-uploader"
import { ProfilePictureViewer } from "@/components/ui/profile-picture-viewer"
import { Upload, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/auth-utils"

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Property Manager",
  owner: "Property Owner",
  tenant: "Tenant",
  maintenance: "Maintenance",
}

export interface ProfileShellProps {
  title: string
  description?: string
  summary: ReactNode
  children: ReactNode
}

export function ProfileShell({ title, description, summary, children }: ProfileShellProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-2">{description}</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">{summary}</div>
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  )
}

export interface SummaryMetric {
  id?: string
  label: string
  value: ReactNode
  icon?: ReactNode
  href?: string
  helperText?: string
  loading?: boolean
}

interface ProfileSummaryCardProps {
  roleLabel?: string
  subtitle?: string
  metrics?: SummaryMetric[]
  extraContent?: ReactNode
  onAvatarChange?: (url: string) => Promise<void> | void
  isAvatarUpdating?: boolean
}

export const ProfileSummaryCard = memo(function ProfileSummaryCard({
  roleLabel,
  subtitle,
  metrics = [],
  extraContent,
  onAvatarChange,
  isAvatarUpdating,
}: ProfileSummaryCardProps) {
  const { user } = useAuth()

  // Memoize user-dependent values to prevent unnecessary re-renders
  const userDisplayName = useMemo(() => {
    if (!user) return ""
    return `${user.firstName || ""} ${user.lastName || ""}`.trim()
  }, [user?.firstName, user?.lastName])

  const userInitials = useMemo(() => {
    if (!user) return ""
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`
  }, [user?.firstName, user?.lastName])

  const displayRole = useMemo(() => {
    if (!user) return ""
    return roleLabel || ROLE_LABELS[user.role as UserRole] || user.role
  }, [user?.role, roleLabel])

  const userEmail = useMemo(() => {
    return user?.email || ""
  }, [user?.email])

  const userProfilePicture = useMemo(() => {
    return user?.profilePicture
  }, [user?.profilePicture])

  if (!user) {
    return null
  }

  const renderAvatar = () => {
    if (userProfilePicture) {
      return (
        <ProfilePictureViewer
          imageSrc={userProfilePicture}
          userName={userDisplayName}
        />
      )
    }

    return (
      <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
        <AvatarImage src={userProfilePicture} />
        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
          {userInitials}
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Card className="h-fit">
      <CardContent className="pt-8 pb-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            {renderAvatar()}
            {onAvatarChange && (
              <ImageUploader
                onCropComplete={onAvatarChange}
                trigger={
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isAvatarUpdating}
                    className="absolute bottom-0 right-0 rounded-full h-9 w-9 p-0 shadow-md hover:shadow-lg transition-shadow border-2 border-background"
                  >
                    {isAvatarUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                }
              />
            )}
          </div>
          <h3 className="font-semibold text-xl mt-2 mb-1">
            {userDisplayName}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
            <span>{displayRole}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {subtitle || userEmail}
          </div>
        </div>

        {metrics.length > 0 && (
          <div className="w-full space-y-4 pt-6 border-t mt-6">
            {metrics.map((metric, index) => {
              const content = (
                <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {metric.icon}
                    <span>{metric.label}</span>
                  </div>
                  <span className="font-semibold text-base">
                    {metric.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      metric.value
                    )}
                  </span>
                </div>
              )

              return metric.href ? (
                <Link to={metric.href} key={metric.id || index} className="block">
                  {content}
                </Link>
              ) : (
                <div key={metric.id || index}>{content}</div>
              )
            })}
          </div>
        )}

        {extraContent && (
          <div className="pt-6 mt-6 border-t">
            {extraContent}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

