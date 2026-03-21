import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft } from "lucide-react"
import { generateOccupancyReportPDF, OccupancyReportData, generateOccupancyReportHTML } from "@/utils/pdf-generator"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState, useRef } from "react"
import { mockOccupancyData } from "./occupancy-report"

// Generate default report data from mock data
const getDefaultReportData = (): OccupancyReportData => ({
  propertyName: "Oak Street Apartments",
  period: mockOccupancyData.period,
  summary: {
    totalUnits: mockOccupancyData.summary.totalUnits,
    occupiedUnits: mockOccupancyData.summary.occupiedUnits,
    vacantUnits: mockOccupancyData.summary.vacantUnits,
    occupancyRate: mockOccupancyData.summary.occupancyRate,
    averageRent: mockOccupancyData.summary.averageRent,
    totalMonthlyRevenue: mockOccupancyData.summary.totalMonthlyRevenue,
    averageTenancy: mockOccupancyData.trends.averageTenancy
  },
  tenants: mockOccupancyData.tenants,
  properties: mockOccupancyData.properties,
  trends: mockOccupancyData.trends
})

export default function PDFPreview() {
  const location = useLocation()
  const _navigate = useNavigate()
  void _navigate
  const { toast } = useToast()
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [reportData, setReportData] = useState<OccupancyReportData | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Get data from location state, sessionStorage, or use default mock data
    let data: OccupancyReportData | null = null
    
    // Try location state first
    if (location.state) {
      data = location.state as OccupancyReportData
    }
    // Try sessionStorage (for new tab)
    else if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('pdfPreviewData')
      if (storedData) {
        try {
          data = JSON.parse(storedData) as OccupancyReportData
          // Clear after use
          sessionStorage.removeItem('pdfPreviewData')
        } catch (e) {
          console.error('Failed to parse stored PDF data:', e)
        }
      }
    }
    
    // Fall back to default data
    if (!data) {
      data = getDefaultReportData()
    }

    setReportData(data)
    // Generate HTML content
    const html = generateOccupancyReportHTML(data)
    setHtmlContent(html)
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
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!htmlContent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading preview...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header with actions */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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

