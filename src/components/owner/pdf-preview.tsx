import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, FileText } from "lucide-react"
import { generateOccupancyReportPDF, OccupancyReportData, generateOccupancyReportHTML } from "@/utils/pdf-generator"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState, useRef } from "react"
import { EmptyState } from "@/components/ui/empty-state"

export default function PDFPreview() {
  const location = useLocation()
  const _navigate = useNavigate()
  void _navigate
  const { toast } = useToast()
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [reportData, setReportData] = useState<OccupancyReportData | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    let data: OccupancyReportData | null = null

    if (location.state) {
      data = location.state as OccupancyReportData
    } else if (typeof window !== "undefined") {
      const storedData = sessionStorage.getItem("pdfPreviewData")
      if (storedData) {
        try {
          data = JSON.parse(storedData) as OccupancyReportData
          sessionStorage.removeItem("pdfPreviewData")
        } catch (e) {
          console.error("Failed to parse stored PDF data:", e)
        }
      }
    }

    if (!data) {
      setReportData(null)
      setHtmlContent("")
      return
    }

    setReportData(data)
    setHtmlContent(generateOccupancyReportHTML(data))
  }, [location])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (iframeRef.current?.src && iframeRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(iframeRef.current.src)
      }
    }
  }, [])

  const handleDownload = async () => {
    if (!reportData) return

    try {
      toast({
        title: "Generating PDF",
        description: "Preparing your PDF for download...",
      })

      // Use current window since we're already in a new tab
      await generateOccupancyReportPDF(reportData, 'occupancy-report', false, true)

      toast({
        title: "PDF Ready",
        description: "Use your browser's print dialog to save as PDF.",
      })
    } catch (_error) {
      toast({
        title: "Download Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!reportData || !htmlContent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No report to preview"
          description="Open a report from the Reports page once live occupancy data is available."
          ctaLabel="Back to reports"
          ctaHref="/owner/reports"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header with actions */}
      <div className="bg-card dark:bg-card border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => window.close()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Close
              </Button>
              <h1 className="text-xl font-semibold">Occupancy Report - PDF Preview</h1>
            </div>
            <Button
              onClick={handleDownload}
              className="bg-ondo-orange hover:bg-ondo-red text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Preview Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          {htmlContent && (
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              title="PDF Preview"
              className="w-full border-0"
              style={{
                minHeight: "1000px",
                width: "100%",
              }}
              sandbox="allow-same-origin allow-scripts"
            />
          )}
        </div>
      </div>
    </div>
  )
}

