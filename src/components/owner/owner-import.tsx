import { useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react"
import { csvImportApi, type ImportPreview, type ImportResult } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const SOURCE_LABEL: Record<string, string> = {
  turbotenant: "TurboTenant",
  buildium: "Buildium",
  generic: "Generic CSV",
}

export default function OwnerImport() {
  const [csv, setCsv] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  function reset() {
    setCsv("")
    setFileName("")
    setPreview(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setPreview(null)
    const text = await file.text()
    setCsv(text)
    setFileName(file.name)
    setLoading(true)
    try {
      const p = await csvImportApi.preview(text)
      setPreview(p)
    } catch (err) {
      console.error("Preview failed:", err)
      toast({
        title: "Could not read that file",
        description: err instanceof Error ? err.message : "Please check the CSV and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function onImport() {
    if (!csv) return
    setImporting(true)
    try {
      const r = await csvImportApi.commit(csv)
      setResult(r)
      toast({
        title: `Imported ${r.created} propert${r.created === 1 ? "y" : "ies"}`,
        description: r.failed > 0 ? `${r.failed} row(s) could not be imported.` : undefined,
      })
    } catch (err) {
      console.error("Import failed:", err)
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <FileSpreadsheet className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Import properties</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Switching from TurboTenant, Buildium, or another tool? Export your properties to CSV and
        upload it here. We&apos;ll map the columns and create your properties. (Tenants, leases, and
        balances aren&apos;t imported yet.)
      </p>

      {/* Step 1 — upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">1. Upload your CSV export</CardTitle>
          <CardDescription>Accepts TurboTenant, Buildium, or a generic property CSV.</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="hidden"
            id="csv-file"
          />
          <div className="flex items-center gap-3">
            <Button onClick={() => fileRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Choose CSV file
            </Button>
            {fileName ? <span className="text-sm text-muted-foreground">{fileName}</span> : null}
            {(preview || result) && (
              <Button variant="ghost" size="sm" onClick={reset} className="ml-auto">
                Start over
              </Button>
            )}
          </div>
          {loading ? <p className="text-sm text-muted-foreground mt-3">Reading file…</p> : null}
        </CardContent>
      </Card>

      {/* Step 2 — preview */}
      {preview && !result ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">2. Review</CardTitle>
              <Badge>{SOURCE_LABEL[preview.source] ?? preview.source}</Badge>
            </div>
            <CardDescription>
              {preview.validCount} of {preview.totalRows} rows are ready to import
              {preview.invalidCount > 0 ? `, ${preview.invalidCount} need attention` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {preview.mapped.length > 0 ? (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">Title</th>
                      <th className="py-2 pr-4">Address</th>
                      <th className="py-2 pr-4">City</th>
                      <th className="py-2 pr-4">Beds/Baths</th>
                      <th className="py-2">Rent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.mapped.slice(0, 8).map((p, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4">{p.title}</td>
                        <td className="py-2 pr-4">
                          {p.addressLine1}
                          {p.unitNumber ? ` #${p.unitNumber}` : ""}
                        </td>
                        <td className="py-2 pr-4">{[p.city, p.state].filter(Boolean).join(", ")}</td>
                        <td className="py-2 pr-4">
                          {p.bedrooms ?? "—"}/{p.bathrooms ?? "—"}
                        </td>
                        <td className="py-2">{p.price != null ? `$${p.price.toLocaleString()}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.mapped.length > 8 ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    …and {preview.mapped.length - 8} more.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                No valid rows found. Check that the file has address and city columns.
              </p>
            )}

            {preview.invalid.length > 0 ? (
              <div className="rounded-md border border-border bg-muted/50 p-3 mb-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  {preview.invalid.length} row(s) will be skipped
                </div>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {preview.invalid.slice(0, 5).map((e) => (
                    <li key={e.row}>
                      Row {e.row}: {e.errors.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Button onClick={onImport} disabled={importing || preview.validCount === 0}>
              {importing ? "Importing…" : `Import ${preview.validCount} propert${preview.validCount === 1 ? "y" : "ies"}`}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Step 3 — result */}
      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Import complete
            </CardTitle>
            <CardDescription>
              Created {result.created} propert{result.created === 1 ? "y" : "ies"}
              {result.failed > 0 ? `, ${result.failed} failed` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.errors.length > 0 ? (
              <ul className="text-xs text-muted-foreground list-disc list-inside mb-4">
                {result.errors.slice(0, 5).map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.errors.join(", ")}
                  </li>
                ))}
              </ul>
            ) : null}
            <Button variant="outline" onClick={reset}>
              Import another file
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
