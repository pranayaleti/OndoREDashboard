import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiGet, getAuthHeaders } from "@/lib/api/http"
import { ShieldAlert, RefreshCcw } from "lucide-react"

interface AuditEntry {
  id: string
  user_id?: string | null
  userId?: string | null
  action: string
  resource_type?: string | null
  resourceType?: string | null
  resource_id?: string | null
  resourceId?: string | null
  details?: Record<string, unknown> | null
  ip_address?: string | null
  ipAddress?: string | null
  created_at?: string
  createdAt?: string
}

const PAGE = 50

export default function ManagerAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resourceFilter, setResourceFilter] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [offset, setOffset] = useState(0)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ limit: String(PAGE), offset: String(offset) })
      if (resourceFilter) qs.set("resourceType", resourceFilter)
      const res = (await apiGet(`/audit-log?${qs.toString()}`, getAuthHeaders())) as
        | { data: AuditEntry[] }
        | AuditEntry[]
      const list = Array.isArray(res) ? res : res.data ?? []
      setEntries(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [offset, resourceFilter])

  const filteredEntries = useMemo(() => {
    if (!actionFilter) return entries
    return entries.filter((e) => e.action.toLowerCase().includes(actionFilter.toLowerCase()))
  }, [entries, actionFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" /> Audit log
        </h2>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Input
          placeholder="Filter by resource type (e.g. lease, payment)"
          value={resourceFilter}
          onChange={(e) => {
            setOffset(0)
            setResourceFilter(e.target.value)
          }}
        />
        <Input
          placeholder="Filter by action (substring)"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
            Previous
          </Button>
          <Button variant="outline" disabled={loading || entries.length < PAGE} onClick={() => setOffset(offset + PAGE)}>
            Next
          </Button>
          <span className="text-xs text-muted-foreground">offset {offset}</span>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive border border-destructive/50 bg-destructive/10 rounded p-3">
          {error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No audit entries.</div>
          ) : (
            <ul className="divide-y divide-border/40">
              {filteredEntries.map((e) => {
                const created = e.createdAt ?? e.created_at
                const resourceType = e.resourceType ?? e.resource_type
                const resourceId = e.resourceId ?? e.resource_id
                const userId = e.userId ?? e.user_id
                return (
                  <li key={e.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{e.action}</div>
                      <span className="text-xs text-muted-foreground">{created ? new Date(created).toLocaleString() : ""}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                      {resourceType && <Badge variant="secondary">{resourceType}</Badge>}
                      {resourceId && <span>id: <code className="text-[11px]">{resourceId}</code></span>}
                      {userId && <span>user: <code className="text-[11px]">{userId}</code></span>}
                      {e.ip_address && <span>ip: {e.ip_address}</span>}
                    </div>
                    {e.details && (
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted/50 p-2 text-[11px] leading-tight">
                        {JSON.stringify(e.details, null, 2)}
                      </pre>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
