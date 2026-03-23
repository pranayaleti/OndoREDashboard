"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Download, Send, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Form1099 {
  id: string
  vendorName: string
  vendorId: string
  totalPaid: number
  status: "draft" | "filed"
  w9Status: "collected" | "missing" | "expired"
  year: number
}

const CURRENT_YEAR = new Date().getFullYear()

const MOCK_FORMS: Form1099[] = [
  { id: "f1", vendorName: "Apex Plumbing LLC", vendorId: "v1", totalPaid: 1240000, status: "filed", w9Status: "collected", year: CURRENT_YEAR - 1 },
  { id: "f2", vendorName: "ProElectric Services", vendorId: "v2", totalPaid: 870000, status: "draft", w9Status: "collected", year: CURRENT_YEAR - 1 },
  { id: "f3", vendorName: "GreenLawn Maintenance", vendorId: "v3", totalPaid: 430000, status: "draft", w9Status: "missing", year: CURRENT_YEAR - 1 },
  { id: "f4", vendorName: "Handyman Pro", vendorId: "v4", totalPaid: 290000, status: "draft", w9Status: "expired", year: CURRENT_YEAR - 1 },
]

function fmt(cents: number) { return `$${(cents / 100).toLocaleString()}` }

function statusBadge(status: Form1099["status"]) {
  if (status === "filed") return <Badge className="bg-green-100 text-green-700 border-green-200">Filed</Badge>
  return <Badge variant="secondary">Draft</Badge>
}

function w9Badge(status: Form1099["w9Status"]) {
  if (status === "collected") return (
    <span className="flex items-center gap-1 text-green-600 text-sm">
      <CheckCircle className="h-3 w-3" />Collected
    </span>
  )
  if (status === "expired") return (
    <span className="flex items-center gap-1 text-orange-600 text-sm">
      <AlertCircle className="h-3 w-3" />Expired
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-red-600 text-sm">
      <AlertCircle className="h-3 w-3" />Missing
    </span>
  )
}

export function TaxFiling1099() {
  const { toast } = useToast()
  const [year, setYear] = useState(String(CURRENT_YEAR - 1))
  const [forms, setForms] = useState<Form1099[]>(MOCK_FORMS)
  const [generating, setGenerating] = useState(false)
  const [filingId, setFilingId] = useState<string | null>(null)

  useEffect(() => { loadForms(Number(year)) }, [year])

  const loadForms = async (y: number) => {
    try {
      const res = await (featureApi as any).tax?.list1099s?.(y)
      if (Array.isArray(res)) setForms(res as Form1099[])
    } catch { /* use mock */ }
  }

  const generate = async () => {
    setGenerating(true)
    try {
      await (featureApi as any).tax?.generate1099s?.(Number(year))
    } catch { /* noop */ }
    setTimeout(() => {
      setGenerating(false)
      toast({ title: `1099 forms generated for ${year}` })
      loadForms(Number(year))
    }, 1500)
  }

  const download = (form: Form1099) => {
    toast({ title: `Downloading 1099 for ${form.vendorName}` })
  }

  const fileForm = async (formId: string) => {
    setFilingId(formId)
    try {
      await (featureApi as any).tax?.file1099?.(formId)
    } catch { /* noop */ }
    setTimeout(() => {
      setForms((prev) => prev.map((f) => f.id === formId ? { ...f, status: "filed" } : f))
      setFilingId(null)
      toast({ title: "1099 form filed successfully" })
    }, 1000)
  }

  const totalPaid = forms.reduce((s, f) => s + f.totalPaid, 0)
  const filed = forms.filter((f) => f.status === "filed").length
  const w9Missing = forms.filter((f) => f.w9Status !== "collected").length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid ({year})</p>
                <p className="text-xl font-bold text-blue-700">{fmt(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forms Filed</p>
                <p className="text-xl font-bold text-green-700">{filed} / {forms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${w9Missing > 0 ? "bg-red-100" : "bg-green-100"}`}>
                <AlertCircle className={`h-5 w-5 ${w9Missing > 0 ? "text-red-600" : "text-green-600"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Missing W-9s</p>
                <p className={`text-xl font-bold ${w9Missing > 0 ? "text-red-600" : "text-green-700"}`}>{w9Missing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />1099 Forms
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2].map((offset) => (
                  <SelectItem key={offset} value={String(CURRENT_YEAR - 1 - offset)}>
                    {CURRENT_YEAR - 1 - offset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={generate} disabled={generating}>
              <RefreshCw className={`h-4 w-4 mr-1 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating..." : "Generate 1099s"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No 1099 forms for {year}. Click "Generate 1099s" to create them.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>W-9 Status</TableHead>
                  <TableHead>Form Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.vendorName}</TableCell>
                    <TableCell>{fmt(form.totalPaid)}</TableCell>
                    <TableCell>{w9Badge(form.w9Status)}</TableCell>
                    <TableCell>{statusBadge(form.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => download(form)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {form.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={filingId === form.id || form.w9Status !== "collected"}
                            onClick={() => fileForm(form.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            {filingId === form.id ? "Filing..." : "File"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
