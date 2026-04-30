import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Download, Search, Loader2, AlertCircle } from "lucide-react"
import { documentsApi, type DocumentListRecord } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatDate as formatLocaleDate } from "@/lib/locale-format"

function formatSize(bytes?: number): string {
  if (bytes == null) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso?: string): string {
  if (!iso) return "—"
  return formatLocaleDate(iso, { month: "short", day: "numeric", year: "numeric" })
}

export default function TenantDocuments() {
  const [documents, setDocuments] = useState<DocumentListRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await documentsApi.list()
      setDocuments(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load documents"
      setError(message)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDownload = async (doc: DocumentListRecord) => {
    setDownloadingId(doc.id)
    try {
      const url = await documentsApi.getDownloadUrl(doc.id)
      if (url) window.open(url, "_blank", "noopener,noreferrer")
      else toast({ title: "Download failed", description: "No URL returned.", variant: "destructive" })
    } catch {
      toast({ title: "Download failed", description: "Could not get download link.", variant: "destructive" })
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.docType ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-10 w-10 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Could not load documents</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchDocuments}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Access your lease and other documents
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No documents found
              </h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search" : "No documents available yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2 bg-muted rounded-lg shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg truncate">{doc.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        {doc.docType && (
                          <span className="capitalize">{doc.docType}</span>
                        )}
                        <span>{formatSize(doc.sizeBytes)}</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                  >
                    {downloadingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
