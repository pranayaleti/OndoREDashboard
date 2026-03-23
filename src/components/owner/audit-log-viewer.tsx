import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Shield, ChevronLeft, ChevronRight } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface AuditEntry {
  id: string
  userId: string | null
  action: string
  resourceType: string
  resourceId: string | null
  details: Record<string, unknown>
  ipAddress: string | null
  createdAt: string
}

export function AuditLogViewer() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [offset, setOffset] = useState(0)
  const [resourceFilter, setResourceFilter] = useState("")
  const limit = 25

  useEffect(() => { load() }, [offset, resourceFilter])

  const load = async () => {
    try {
      setLoading(true)
      const filters: Record<string, string | number> = { limit, offset }
      if (resourceFilter) filters.resourceType = resourceFilter
      const data = await featureApi.auditLog.list(filters)
      setEntries(data as AuditEntry[])
    } catch {
      toast({ title: "Failed to load audit log", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-blue-500" /> Activity Audit Log
          </CardTitle>
          <Input
            className="w-48"
            placeholder="Filter by resource..."
            value={resourceFilter}
            onChange={(e) => { setResourceFilter(e.target.value); setOffset(0) }}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : entries.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No audit entries found</p>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{e.action}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {e.resourceType}
                        {e.resourceId && <span className="text-xs ml-1">({e.resourceId.slice(0, 8)})</span>}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{e.ipAddress || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-xs text-slate-500">Showing {offset + 1}–{offset + entries.length}</span>
              <Button variant="outline" size="sm" disabled={entries.length < limit} onClick={() => setOffset(offset + limit)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
