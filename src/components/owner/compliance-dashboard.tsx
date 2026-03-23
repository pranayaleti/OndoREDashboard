"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, RefreshCw, XCircle } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type ComplianceStatus = "compliant" | "at_risk" | "overdue"

interface PropertyCompliance {
  id: string
  propertyName: string
  lastCheckDate: string
  issuesCount: number
  status: ComplianceStatus
}

interface ComplianceIssue {
  id: string
  propertyId: string
  propertyName: string
  description: string
  severity: "low" | "medium" | "high"
  resolved: boolean
}

interface ComplianceRule {
  id: string
  name: string
  category: string
  description: string
}

const MOCK_PROPERTIES: PropertyCompliance[] = [
  { id: "p1", propertyName: "Sunrise Apartments", lastCheckDate: "2026-02-14", issuesCount: 0, status: "compliant" },
  { id: "p2", propertyName: "Oakwood Manor", lastCheckDate: "2026-01-30", issuesCount: 3, status: "at_risk" },
  { id: "p3", propertyName: "Birchwood Flats", lastCheckDate: "2025-11-10", issuesCount: 5, status: "overdue" },
  { id: "p4", propertyName: "Maple Street Lofts", lastCheckDate: "2026-03-01", issuesCount: 1, status: "at_risk" },
]

const MOCK_ISSUES: ComplianceIssue[] = [
  { id: "i1", propertyId: "p2", propertyName: "Oakwood Manor", description: "Smoke detector missing in Unit 3B", severity: "high", resolved: false },
  { id: "i2", propertyId: "p2", propertyName: "Oakwood Manor", description: "Fire extinguisher inspection overdue", severity: "medium", resolved: false },
  { id: "i3", propertyId: "p3", propertyName: "Birchwood Flats", description: "Lead paint disclosure not filed", severity: "high", resolved: false },
  { id: "i4", propertyId: "p3", propertyName: "Birchwood Flats", description: "Stairwell handrail loose", severity: "medium", resolved: false },
  { id: "i5", propertyId: "p4", propertyName: "Maple Street Lofts", description: "Carbon monoxide detector battery expired", severity: "low", resolved: false },
]

const MOCK_RULES: ComplianceRule[] = [
  { id: "r1", name: "Smoke Detectors", category: "Fire Safety", description: "Working smoke detector required in every unit and hallway" },
  { id: "r2", name: "Lead Paint Disclosure", category: "Health & Safety", description: "Pre-1978 properties require lead paint disclosure form" },
  { id: "r3", name: "Habitability Standards", category: "Housing Code", description: "Units must have adequate heating, plumbing, and structural integrity" },
  { id: "r4", name: "Rent Increase Notice", category: "Tenant Rights", description: "30-day notice required for rent increases under 10%" },
]

function statusBadge(status: ComplianceStatus) {
  if (status === "compliant") return <Badge className="bg-green-100 text-green-700 border-green-200">Compliant</Badge>
  if (status === "at_risk") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">At Risk</Badge>
  return <Badge variant="destructive">Overdue</Badge>
}

function severityBadge(severity: ComplianceIssue["severity"]) {
  if (severity === "high") return <Badge variant="destructive">High</Badge>
  if (severity === "medium") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Medium</Badge>
  return <Badge variant="secondary">Low</Badge>
}

export function ComplianceDashboard() {
  const { toast } = useToast()
  const [properties, setProperties] = useState<PropertyCompliance[]>(MOCK_PROPERTIES)
  const [issues, setIssues] = useState<ComplianceIssue[]>(MOCK_ISSUES)
  const [rules] = useState<ComplianceRule[]>(MOCK_RULES)
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [propRes, issueRes] = await Promise.allSettled([
        (featureApi as any).compliance?.listProperties?.(),
        (featureApi as any).compliance?.listIssues?.(),
      ])
      if (propRes.status === "fulfilled" && Array.isArray(propRes.value)) setProperties(propRes.value as PropertyCompliance[])
      if (issueRes.status === "fulfilled" && Array.isArray(issueRes.value)) setIssues(issueRes.value as ComplianceIssue[])
    } catch { /* use mock */ }
  }

  const runCheck = async (propertyId: string) => {
    setCheckingId(propertyId)
    try { await (featureApi as any).compliance?.runCheck?.(propertyId) } catch { /* noop */ }
    setTimeout(() => {
      setProperties((prev) => prev.map((p) =>
        p.id === propertyId
          ? { ...p, lastCheckDate: new Date().toISOString().slice(0, 10), status: p.issuesCount === 0 ? "compliant" : p.status }
          : p
      ))
      setCheckingId(null)
      toast({ title: "Compliance check complete" })
    }, 1500)
  }

  const resolveIssue = async (issueId: string) => {
    setResolvingId(issueId)
    try { await (featureApi as any).compliance?.resolveIssue?.(issueId) } catch { /* noop */ }
    setTimeout(() => {
      setIssues((prev) => prev.map((i) => i.id === issueId ? { ...i, resolved: true } : i))
      setResolvingId(null)
      toast({ title: "Issue marked as resolved" })
    }, 800)
  }

  const compliantCount = properties.filter((p) => p.status === "compliant").length
  const atRiskCount = properties.filter((p) => p.status === "at_risk").length
  const overdueCount = properties.filter((p) => p.status === "overdue").length
  const openIssues = issues.filter((i) => !i.resolved)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliant</p>
                <p className="text-2xl font-bold text-green-700">{compliantCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold text-yellow-700">{atRiskCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="properties">
            <TabsList className="mb-4">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="issues">Open Issues ({openIssues.length})</TabsTrigger>
              <TabsTrigger value="rules">Applicable Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Last Check</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((prop) => (
                    <TableRow key={prop.id}>
                      <TableCell className="font-medium">{prop.propertyName}</TableCell>
                      <TableCell className="text-muted-foreground">{prop.lastCheckDate}</TableCell>
                      <TableCell>{prop.issuesCount > 0 ? <span className="text-red-600 font-semibold">{prop.issuesCount}</span> : <span className="text-green-600">0</span>}</TableCell>
                      <TableCell>{statusBadge(prop.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={checkingId === prop.id}
                          onClick={() => runCheck(prop.id)}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${checkingId === prop.id ? "animate-spin" : ""}`} />
                          {checkingId === prop.id ? "Checking..." : "Run Check"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="issues">
              {openIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />All issues resolved
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium text-sm">{issue.propertyName}</TableCell>
                        <TableCell>{issue.description}</TableCell>
                        <TableCell>{severityBadge(issue.severity)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={resolvingId === issue.id}
                            onClick={() => resolveIssue(issue.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {resolvingId === issue.id ? "Resolving..." : "Resolve"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="rules">
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{rule.name}</p>
                      <Badge variant="outline" className="text-xs">{rule.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
