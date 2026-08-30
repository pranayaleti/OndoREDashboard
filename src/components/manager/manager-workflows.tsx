import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { workflowsApi, type WorkflowRule } from "@/lib/api"
import { Zap } from "lucide-react"

interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: string
  triggerEvent?: string
  trigger_event?: string
}

interface AutomationStats {
  totalRules: number
  activeRules: number
  totalExecutions?: number
}

export default function ManagerWorkflows() {
  const { toast } = useToast()
  const [rules, setRules] = useState<WorkflowRule[]>([])
  const [templates, setTemplates] = useState<AutomationTemplate[]>([])
  const [stats, setStats] = useState<AutomationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const [ruleList, templateList, statsData] = await Promise.all([
        workflowsApi.listRules().catch(() => []),
        workflowsApi.listTemplates().catch(() => []),
        workflowsApi.getStats().catch(() => null),
      ])
      setRules(ruleList)
      setTemplates(templateList)
      setStats(statsData)
    } finally {
      setLoading(false)
    }
  }

  async function activate(templateId: string) {
    try {
      setActivating(templateId)
      await workflowsApi.activateTemplate(templateId)
      toast({ title: "Automation enabled", description: "The rule is active on this portfolio." })
      await load()
    } catch (err) {
      toast({
        title: "Could not enable automation",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      })
    } finally {
      setActivating(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Automations</h1>
        <p className="text-sm text-muted-foreground">
          Trigger follow-ups, tasks, and notices from rent, leases, and maintenance events.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active rules</CardDescription>
            <CardTitle>{stats?.activeRules ?? rules.filter((r) => r.isActive).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total rules</CardDescription>
            <CardTitle>{stats?.totalRules ?? rules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Executions</CardDescription>
            <CardTitle>{stats?.totalExecutions ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipes</CardTitle>
          <CardDescription>Turn on a connected workflow instead of wiring each step by hand.</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <EmptyState
              icon={<Zap className="h-8 w-8" />}
              title="No templates yet"
              description="System recipes appear here once automation templates are seeded."
            />
          ) : (
            <ul className="space-y-3">
              {templates.map((template) => (
                <li key={template.id} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <Badge variant="secondary" className="mt-2">{template.category}</Badge>
                  </div>
                  <Button
                    onClick={() => void activate(template.id)}
                    disabled={activating === template.id}
                  >
                    {activating === template.id ? "Enabling…" : "Enable"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <EmptyState
              icon={<Zap className="h-8 w-8" />}
              title="No automations running"
              description="Enable a recipe above. Rules only fire on events in your own portfolio."
            />
          ) : (
            <ul className="space-y-2">
              {rules.map((rule) => (
                <li key={rule.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-sm text-muted-foreground">{rule.triggerEvent}</p>
                  </div>
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "Active" : "Off"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
