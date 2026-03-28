import { Link, useLocation, useParams } from "react-router-dom"
import { Mail, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import type { Tenant } from "@/lib/api"

type LocationState = { tenant?: Tenant }

export default function OwnerTenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const location = useLocation()
  const state = location.state as LocationState | undefined
  const tenant = state?.tenant

  const displayName = tenant?.name || tenant?.email || "Tenant"
  const email = tenant?.email
  const phone = tenant?.phone

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Tenants", href: "/owner/tenants" },
            { label: displayName, icon: User },
          ]}
        />
      </div>

      <div className="mb-6">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link to="/owner/tenants">
            ← Back to tenants
          </Link>
        </Button>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{displayName}</CardTitle>
          <CardDescription>
            Tenant profile
            {tenantId ? (
              <span className="block text-xs font-mono mt-1 text-muted-foreground">ID: {tenantId}</span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email ? (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a href={`mailto:${email}`} className="text-primary font-medium hover:underline">
                  {email}
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No email on file.</p>
          )}
          {phone ? (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <a href={`tel:${phone}`} className="text-primary font-medium hover:underline">
                  {phone}
                </a>
              </div>
            </div>
          ) : null}

          {!tenant && (
            <p className="text-sm text-muted-foreground border-t pt-4">
              Open this page from <strong>Tenants</strong> via &quot;View details&quot; to see full info here, or return
              to the list.
            </p>
          )}

          <div className="pt-2">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-800 hover:opacity-95 text-white" asChild>
              <Link to={tenantId ? `/owner/messages?tenant=${encodeURIComponent(tenantId)}` : "/owner/messages"}>
                Message tenant
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
