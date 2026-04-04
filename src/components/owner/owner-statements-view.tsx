import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText, Loader2, ChevronRight, Mail,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiGet, apiPost } from "@/lib/api/http"

interface Statement {
  id: string
  period: string
  startDate: string
  endDate: string
  totalIncome: number
  totalExpenses: number
  netIncome: number
  status: string
  createdAt: string
}

interface LineItem {
  id: string
  description: string
  category: string
  amount: number
  date: string
}

interface StatementDetail {
  statement: Statement
  lineItems: LineItem[]
}

function fmt(cents: number): string {
  const dollars = cents / 100
  return dollars < 0
    ? `-$${Math.abs(dollars).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function OwnerStatementsView() {
  const { toast } = useToast()
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<StatementDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" })
  const [emailing, setEmailing] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await apiGet<{ statements: Statement[] }>("/owner/statements")
      setStatements(data.statements ?? [])
    } catch {
      toast({ title: "Failed to load statements", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const viewDetail = async (id: string) => {
    setSelectedId(id)
    setDetailLoading(true)
    try {
      const data = await apiGet<StatementDetail>(`/owner/statements/${id}`)
      setDetail(data)
    } catch {
      setDetail(null)
      toast({ title: "Failed to load statement", variant: "destructive" })
    } finally {
      setDetailLoading(false)
    }
  }

  const generate = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return
    setGenerating(true)
    try {
      await apiPost("/owner/statements/generate", dateRange)
      toast({ title: "Statement generated" })
      setShowGenerate(false)
      setDateRange({ startDate: "", endDate: "" })
      load()
    } catch {
      toast({ title: "Failed to generate statement", variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  const emailStatement = async (id: string) => {
    setEmailing(true)
    try {
      await apiPost(`/owner-statements/${id}/email`, {})
      toast({ title: "Statement emailed successfully" })
    } catch {
      toast({ title: "Failed to email statement", variant: "destructive" })
    } finally {
      setEmailing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Financial Statements</h2>
        <Button onClick={() => setShowGenerate(true)}>
          <FileText className="mr-2 h-4 w-4" /> Generate Statement
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Statement list */}
        <div className="space-y-2 lg:col-span-2">
          {statements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No statements yet.</p>
          ) : (
            statements.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => viewDetail(s.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                  selectedId === s.id ? "border-primary bg-accent" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.period}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.startDate).toLocaleDateString()} — {new Date(s.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${s.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {fmt(s.netIncome)}
                    </p>
                    <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selectedId && detail ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{detail.statement.period}</CardTitle>
                <Button size="sm" onClick={() => emailStatement(selectedId!)} disabled={emailing}>
                  {emailing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Mail className="mr-1 h-3 w-3" />}
                  Email
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {detailLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Income</p>
                        <p className="text-lg font-bold text-green-600">{fmt(detail.statement.totalIncome)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                        <p className="text-lg font-bold text-red-600">{fmt(detail.statement.totalExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net</p>
                        <p className={`text-lg font-bold ${detail.statement.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {fmt(detail.statement.netIncome)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border">
                      <div className="grid grid-cols-4 gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                        <span>Date</span><span>Description</span><span>Category</span><span className="text-right">Amount</span>
                      </div>
                      {detail.lineItems.length === 0 ? (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">No line items</p>
                      ) : (
                        detail.lineItems.map((item) => (
                          <div key={item.id} className="grid grid-cols-4 gap-2 border-b px-3 py-2 text-sm last:border-b-0">
                            <span className="text-muted-foreground">{new Date(item.date).toLocaleDateString()}</span>
                            <span>{item.description}</span>
                            <Badge variant="outline" className="w-fit text-[10px]">{item.category}</Badge>
                            <span className={`text-right font-medium ${item.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {fmt(item.amount)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
              <ChevronRight className="mb-2 h-8 w-8" />
              <p className="text-sm">Select a statement to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Generate dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Statement</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={dateRange.startDate} onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={dateRange.endDate} onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
            <Button onClick={generate} disabled={generating || !dateRange.startDate || !dateRange.endDate}>
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
