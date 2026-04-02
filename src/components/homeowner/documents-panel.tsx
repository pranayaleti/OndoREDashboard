import { useState, useEffect, useCallback, useRef } from "react"
import { HomeownerPropertyShell } from "./homeowner-property-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  homeownerApi,
  type PropertyDocument,
  type PropertyDocumentType,
} from "@/lib/api"
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileUp,
} from "lucide-react"

const DOC_TYPE_OPTIONS: { value: PropertyDocumentType; label: string }[] = [
  { value: "insurance", label: "Insurance" },
  { value: "lease", label: "Lease" },
  { value: "mortgage", label: "Mortgage" },
  { value: "tax", label: "Tax" },
  { value: "warranty", label: "Warranty" },
  { value: "inspection", label: "Inspection" },
  { value: "receipt", label: "Receipt" },
  { value: "other", label: "Other" },
]

const STATUS_CONFIG = {
  indexed: { icon: CheckCircle2, label: "Indexed", className: "text-green-600" },
  pending: { icon: Clock, label: "Processing", className: "text-amber-600" },
  failed: { icon: AlertCircle, label: "Failed", className: "text-destructive" },
} as const

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsPanel() {
  return (
    <HomeownerPropertyShell>
      {({ propertyId }) => <DocumentsPanelInner propertyId={propertyId} />}
    </HomeownerPropertyShell>
  )
}

function DocumentsPanelInner({ propertyId }: { propertyId: string }) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [docType, setDocType] = useState<PropertyDocumentType>("other")
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = useCallback(async () => {
    try {
      const data = await homeownerApi.listDocuments(propertyId)
      setDocuments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleUpload = async (files: FileList | File[]) => {
    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        await homeownerApi.uploadDocument(propertyId, file, docType)
      }
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      await homeownerApi.deleteDocument(propertyId, docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
          Documents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload insurance, lease, mortgage, and other property documents. Ask questions about them using the search bar.
        </p>
      </header>

      {/* Upload area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-5 w-5" />
            Upload document
          </CardTitle>
          <CardDescription>
            PDF, TXT, CSV, JPEG, PNG, or WebP (max 10 MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Document type
              </label>
              <Select
                value={docType}
                onValueChange={(v) => setDocType(v as PropertyDocumentType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Choose files"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.txt,.csv,.jpg,.jpeg,.png,.webp"
              multiple
              onChange={(e) => {
                if (e.target.files?.length) handleUpload(e.target.files)
                e.target.value = ""
              }}
            />
          </div>

          {/* Drop zone */}
          <div
            className={`flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              dragOver
                ? "border-orange-400 bg-orange-50/50"
                : "border-border/60 bg-muted/20"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <p className="text-sm text-muted-foreground">
              {dragOver
                ? "Drop files here..."
                : "Or drag and drop files here"}
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Document list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Your documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">No documents uploaded yet.</p>
              <p className="text-xs">
                Upload your insurance, lease, or other property documents to ask questions about them.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {documents.map((doc) => {
                const statusCfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending
                const StatusIcon = statusCfg.icon
                return (
                  <li
                    key={doc.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <FileText className="h-8 w-8 shrink-0 text-muted-foreground/60" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {doc.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 font-medium capitalize">
                          {doc.documentType}
                        </span>
                        <span>{formatBytes(doc.fileSizeBytes)}</span>
                        {doc.pageCount != null && (
                          <span>{doc.pageCount} page{doc.pageCount !== 1 ? "s" : ""}</span>
                        )}
                        <span className={`inline-flex items-center gap-1 ${statusCfg.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
                      aria-label={`Delete ${doc.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
