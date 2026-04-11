import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import { apiGet } from "@/lib/api/http"

interface MoveOutResource {
  id: string
  title: string
  description: string
  url: string
  category: string
}

export function HandoffMoveOutResources() {
  const [resources, setResources] = useState<MoveOutResource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<{ data: MoveOutResource[] }>("/move-out-resources")
      .then((response) => setResources(response.data))
      .catch(() => setResources([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading || resources.length === 0) return null

  const grouped = resources.reduce<Record<string, MoveOutResource[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Move-Out Resources
        </CardTitle>
        <CardDescription>
          Helpful links for tenants to update their address and transfer services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {category}
            </h3>
            <div className="space-y-2">
              {items.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{resource.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {resource.description}
                    </p>
                  </div>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 ml-3 text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Visit
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
