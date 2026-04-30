"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  FileText,
  Download,
  Search,
  File,
  FileImage,
  FileIcon as FilePdf,
  FileSpreadsheet,
  MoreHorizontal,
  Trash2,
  Share2,
  Eye,
  FolderOpen,
  Building,
  Grid3x3,
  List,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { AddDocumentDialog } from "@/components/owner/add-document-dialog"
import { formatDate as formatLocaleDate } from "@/lib/locale-format"
import { CreateFolderDialog } from "@/components/owner/create-folder-dialog"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/auth-utils"
import { documentsApi, type DocumentListRecord } from "@/lib/api"
import { getDemoDocuments } from "@/lib/seed-data"
import { CardGridSkeleton } from "@/components/ui/list-skeletons"
import { EmptyState } from "@/components/ui/empty-state"

export interface Document {
  id: string
  name: string
  type: "pdf" | "image" | "spreadsheet" | "document"
  category: string
  property?: string
  size: string
  uploadedAt: string
  uploadedBy: string
  folder?: string
  tag?: string
  shared?: boolean
}

export interface DocumentFolder {
  id: string
  name: string
  description?: string
  documentCount: number
  lastUpdated: string
}

interface DocumentsPageProps {
  role: UserRole
  documents?: Document[]
  folders?: DocumentFolder[]
  properties?: string[]
  showPropertyFilter?: boolean
  showUpload?: boolean
  showDownload?: boolean
  showDelete?: boolean
  showShare?: boolean
  showFolders?: boolean
  customCategories?: string[]
  /** When true, fetch list from API and use real download; ignores passed documents. */
  fetchFromApi?: boolean
}

// Default mock data
const DEFAULT_DOCUMENTS: Document[] = [
  {
    id: "doc1",
    name: "Lease Agreement - 123 Main St Unit 1",
    type: "pdf",
    category: "lease",
    property: "123 Main Street",
    size: "1.2 MB",
    uploadedAt: "2023-05-15T10:30:00",
    uploadedBy: "Sarah Johnson",
    folder: "Leases",
    tag: "Lease",
  },
  {
    id: "doc2",
    name: "Lease Agreement - 123 Main St Unit 2",
    type: "pdf",
    category: "lease",
    property: "123 Main Street",
    size: "1.2 MB",
    uploadedAt: "2023-05-15T10:35:00",
    uploadedBy: "Sarah Johnson",
    folder: "Leases",
    tag: "Lease",
  },
  {
    id: "doc3",
    name: "Lease Agreement - 456 Oak Ave",
    type: "pdf",
    category: "lease",
    property: "456 Oak Avenue",
    size: "1.1 MB",
    uploadedAt: "2023-04-10T14:45:00",
    uploadedBy: "Sarah Johnson",
    folder: "Leases",
    tag: "Lease",
  },
  {
    id: "doc4",
    name: "Property Insurance Policy - 123 Main St",
    type: "pdf",
    category: "insurance",
    property: "123 Main Street",
    size: "3.5 MB",
    uploadedAt: "2023-04-20T14:45:00",
    uploadedBy: "Sarah Johnson",
    folder: "Insurance",
    tag: "Insurance",
  },
  {
    id: "doc5",
    name: "Property Insurance Policy - 456 Oak Ave",
    type: "pdf",
    category: "insurance",
    property: "456 Oak Avenue",
    size: "3.2 MB",
    uploadedAt: "2023-04-20T14:50:00",
    uploadedBy: "Sarah Johnson",
    folder: "Insurance",
    tag: "Insurance",
  },
  {
    id: "doc6",
    name: "Property Tax Statement 2023 - 123 Main St",
    type: "pdf",
    category: "tax",
    property: "123 Main Street",
    size: "850 KB",
    uploadedAt: "2023-03-20T09:15:00",
    uploadedBy: "Sarah Johnson",
    folder: "Tax Documents",
    tag: "Tax",
  },
  {
    id: "doc7",
    name: "Property Tax Statement 2023 - 456 Oak Ave",
    type: "pdf",
    category: "tax",
    property: "456 Oak Avenue",
    size: "820 KB",
    uploadedAt: "2023-03-20T09:20:00",
    uploadedBy: "Sarah Johnson",
    folder: "Tax Documents",
    tag: "Tax",
  },
  {
    id: "doc8",
    name: "Maintenance Receipt - Plumbing Repair",
    type: "image",
    category: "maintenance",
    property: "123 Main Street",
    size: "2.1 MB",
    uploadedAt: "2023-05-05T16:20:00",
    uploadedBy: "Sarah Johnson",
    folder: "Maintenance Records",
    tag: "Maintenance",
  },
  {
    id: "doc9",
    name: "Maintenance Receipt - HVAC Service",
    type: "image",
    category: "maintenance",
    property: "456 Oak Avenue",
    size: "1.8 MB",
    uploadedAt: "2023-05-02T13:10:00",
    uploadedBy: "Sarah Johnson",
    folder: "Maintenance Records",
    tag: "Maintenance",
  },
  {
    id: "doc10",
    name: "Property Inspection Report - 123 Main St",
    type: "pdf",
    category: "inspection",
    property: "123 Main Street",
    size: "4.3 MB",
    uploadedAt: "2023-02-12T11:10:00",
    uploadedBy: "Sarah Johnson",
    folder: "Property Inspections",
    tag: "Inspection",
  },
  {
    id: "doc11",
    name: "Rental Income Spreadsheet - Q1 2023",
    type: "spreadsheet",
    category: "financial",
    property: "All Properties",
    size: "1.8 MB",
    uploadedAt: "2023-04-01T13:40:00",
    uploadedBy: "Sarah Johnson",
    folder: "Financial Records",
    tag: "Financial",
  },
  {
    id: "doc12",
    name: "Expense Report - Q1 2023",
    type: "spreadsheet",
    category: "financial",
    property: "All Properties",
    size: "1.5 MB",
    uploadedAt: "2023-04-01T13:45:00",
    uploadedBy: "Sarah Johnson",
    folder: "Financial Records",
    tag: "Financial",
  },
]

const DEFAULT_FOLDERS: DocumentFolder[] = [
  {
    id: "folder1",
    name: "Leases",
    description: "Lease agreements for all properties",
    documentCount: 3,
    lastUpdated: "2023-05-15T10:30:00",
  },
  {
    id: "folder2",
    name: "Insurance",
    description: "Property insurance policies and claims",
    documentCount: 2,
    lastUpdated: "2023-04-20T14:45:00",
  },
  {
    id: "folder3",
    name: "Tax Documents",
    description: "Property tax statements and receipts",
    documentCount: 2,
    lastUpdated: "2023-03-20T09:15:00",
  },
  {
    id: "folder4",
    name: "Maintenance Records",
    description: "Maintenance receipts and service records",
    documentCount: 2,
    lastUpdated: "2023-05-05T16:20:00",
  },
  {
    id: "folder5",
    name: "Property Inspections",
    description: "Inspection reports and certificates",
    documentCount: 1,
    lastUpdated: "2023-02-12T11:10:00",
  },
  {
    id: "folder6",
    name: "Financial Records",
    description: "Financial statements and reports",
    documentCount: 2,
    lastUpdated: "2023-04-01T13:40:00",
  },
]

const DEFAULT_CATEGORIES = ["lease", "insurance", "tax", "maintenance", "inspection", "financial"]

function mapRecordToDocument(r: DocumentListRecord): Document {
  const typeFromMime = (mime?: string): "pdf" | "image" | "spreadsheet" | "document" => {
    if (!mime) return "document"
    if (mime === "application/pdf") return "pdf"
    if (mime.startsWith("image/")) return "image"
    if (["application/vnd.ms-excel", "text/csv"].some((x) => mime.includes(x))) return "spreadsheet"
    return "document"
  }
  const formatBytes = (b?: number) => {
    if (b == null) return "—"
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }
  const cat = r.docType ?? "other"
  return {
    id: r.id,
    name: r.name,
    type: typeFromMime(r.mimeType),
    category: cat,
    size: formatBytes(r.sizeBytes),
    uploadedAt: r.createdAt ?? "",
    uploadedBy: "—",
    tag: cat.charAt(0).toUpperCase() + cat.slice(1),
  }
}

export function DocumentsPage({
  role: _role,
  documents = DEFAULT_DOCUMENTS,
  folders = DEFAULT_FOLDERS,
  properties: _properties = ["123 Main Street", "456 Oak Avenue", "All Properties"],
  showPropertyFilter = true,
  showUpload = true,
  showDownload = true,
  showDelete = true,
  showShare = true,
  showFolders = true,
  customCategories,
  fetchFromApi = false,
}: DocumentsPageProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [documentsState, setDocumentsState] = useState<Document[]>(fetchFromApi ? [] : documents)
  const [foldersState, setFoldersState] = useState<DocumentFolder[]>(fetchFromApi ? [] : folders)
  const [apiLoading, setApiLoading] = useState(fetchFromApi)
  const [apiError, setApiError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [folderFilter, setFolderFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { toast } = useToast()

  const loadFromApi = useCallback(async () => {
    if (!fetchFromApi) return
    setApiLoading(true)
    setApiError(null)
    try {
      const { data } = await documentsApi.list()
      const mapped = data.map(mapRecordToDocument)
      const fallbackDocuments = getDemoDocuments(user)
      setDocumentsState(mapped.length === 0 && fallbackDocuments.length > 0 ? fallbackDocuments : mapped)
      setFoldersState([])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load documents"
      const fallbackDocuments = getDemoDocuments(user)
      if (fallbackDocuments.length > 0) {
        setDocumentsState(fallbackDocuments)
        setApiError(null)
      } else {
        setApiError(msg)
        setDocumentsState([])
      }
    } finally {
      setApiLoading(false)
    }
  }, [fetchFromApi, user])

  useEffect(() => {
    loadFromApi()
  }, [loadFromApi])

  const categories = customCategories || DEFAULT_CATEGORIES

  // Get unique properties from documents
  const availableProperties = useMemo(() => {
    const props = new Set<string>()
    documentsState.forEach((doc) => {
      if (doc.property) props.add(doc.property)
    })
    return Array.from(props).sort()
  }, [documentsState])

  // Get unique folders from documents
  const availableFolders = useMemo(() => {
    const folderNames = new Set<string>()
    documentsState.forEach((doc) => {
      if (doc.folder) folderNames.add(doc.folder)
    })
    return Array.from(folderNames).sort()
  }, [documentsState])

  // Filter documents based on search term, property, category, and folder
  const filteredDocuments = useMemo(() => {
    return documentsState.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesProperty = propertyFilter === "all" || doc.property === propertyFilter
      const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter
      const matchesFolder = folderFilter === "all" || doc.folder === folderFilter

      if (activeTab === "all") {
        return matchesSearch && matchesProperty && matchesCategory && matchesFolder
      }
      if (activeTab === "recent") {
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        return (
          matchesSearch &&
          matchesProperty &&
          matchesCategory &&
          matchesFolder &&
          new Date(doc.uploadedAt) >= oneMonthAgo
        )
      }
      if (activeTab === "shared") {
        return (
          matchesSearch &&
          matchesProperty &&
          matchesCategory &&
          matchesFolder &&
          doc.shared === true
        )
      }

      return matchesSearch && matchesProperty && matchesCategory && matchesFolder
    })
  }, [documentsState, searchTerm, propertyFilter, categoryFilter, folderFilter, activeTab])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddDocument = (data: any) => {
    const newDocument: Document = {
      id: `doc${documentsState.length + 1}`,
      name: data.name,
      type: getFileType(data.name),
      category: data.category,
      property: data.property,
      size: "1.5 MB",
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "User",
      folder: data.folder,
      tag: data.category.charAt(0).toUpperCase() + data.category.slice(1),
    }

    setDocumentsState([newDocument, ...documentsState])

    toast({
      title: "Document uploaded",
      description: "The document has been successfully uploaded.",
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateFolder = (data: any) => {
    const newFolder: DocumentFolder = {
      id: `folder${foldersState.length + 1}`,
      name: data.name,
      description: data.description,
      documentCount: 0,
      lastUpdated: new Date().toISOString(),
    }

    setFoldersState([...foldersState, newFolder])

    toast({
      title: "Folder created",
      description: "The folder has been successfully created.",
    })
  }

  const handleDeleteDocument = (id: string) => {
    setDocumentsState(documentsState.filter((doc) => doc.id !== id))

    toast({
      title: "Document deleted",
      description: "The document has been successfully deleted.",
    })
  }

  const handleDeleteFolder = (id: string) => {
    const folderName = foldersState.find((folder) => folder.id === id)?.name
    if (folderName) {
      setDocumentsState(
        documentsState.map((doc) => {
          if (doc.folder === folderName) {
            return { ...doc, folder: "" }
          }
          return doc
        }),
      )
    }

    setFoldersState(foldersState.filter((folder) => folder.id !== id))

    toast({
      title: "Folder deleted",
      description: "The folder has been successfully deleted.",
    })
  }

  const handleDownload = async (doc: Document) => {
    if (fetchFromApi) {
      try {
        const url = await documentsApi.getDownloadUrl(doc.id)
        if (url) window.open(url, "_blank", "noopener,noreferrer")
        else toast({ title: "Download failed", variant: "destructive" })
      } catch {
        toast({ title: "Download failed", description: "Could not get download link.", variant: "destructive" })
      }
      return
    }
    toast({
      title: "Download started",
      description: `Downloading ${doc.name}...`,
    })
  }

  const handleShare = (doc: Document) => {
    toast({
      title: "Share document",
      description: `Sharing link for ${doc.name} has been copied to clipboard.`,
    })
  }

  const handleView = (doc: Document) => {
    toast({
      title: "View document",
      description: `Opening ${doc.name}...`,
    })
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FilePdf className="h-6 w-6 text-red-500" />
      case "image":
        return <FileImage className="h-6 w-6 text-blue-500" />
      case "spreadsheet":
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />
      default:
        return <File className="h-6 w-6 text-gray-500" />
    }
  }

  const getFileType = (fileName: string): "pdf" | "image" | "spreadsheet" | "document" => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    if (extension === "pdf") return "pdf"
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) return "image"
    if (["xls", "xlsx", "csv"].includes(extension || "")) return "spreadsheet"
    return "document"
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      lease: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      insurance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      tax: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      inspection: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      financial: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    }
    return colors[category] || "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
  }

  const formatDate = (dateString: string) => {
    return formatLocaleDate(dateString, { month: "numeric", day: "numeric", year: "numeric" })
  }

  if (fetchFromApi && apiLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-6">
          <CardGridSkeleton cards={3} />
        </div>
      </div>
    )
  }

  if (fetchFromApi && apiError) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-6">
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">Could not load documents</p>
              <p className="text-sm text-muted-foreground mt-1">{apiError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={loadFromApi}>
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumb items={[{ label: "Documents" }]} className="mb-4" />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-orange-600 dark:text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document Management</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Store, organize, and share important documents</p>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* First Row: View Toggle, Search, Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* View Toggle - Left */}
            <div className="flex items-center gap-1 border rounded-md p-1 bg-card dark:bg-card">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Search - Center */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card dark:bg-card"
                />
              </div>
            </div>

            {/* Filters - Right */}
            <div className="flex flex-wrap gap-2">
              {showPropertyFilter && (
                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="w-[150px] bg-card dark:bg-card">
                    <SelectValue placeholder="All Properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {availableProperties.map((prop) => (
                      <SelectItem key={prop} value={prop}>
                        {prop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px] bg-card dark:bg-card">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showFolders && (
                <Select value={folderFilter} onValueChange={setFolderFilter}>
                  <SelectTrigger className="w-[150px] bg-card dark:bg-card">
                    <SelectValue placeholder="All Folders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Folders</SelectItem>
                    {availableFolders.map((folder) => (
                      <SelectItem key={folder} value={folder}>
                        {folder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Second Row: Tabs and Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="bg-card dark:bg-card">
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                {showShare && <TabsTrigger value="shared">Shared</TabsTrigger>}
                {showFolders && <TabsTrigger value="folders">Folders</TabsTrigger>}
              </TabsList>
            </Tabs>

            <div className="flex gap-2 w-full sm:w-auto">
              {showUpload && (
                <>
                  <AddDocumentDialog onAddDocument={handleAddDocument} />
                  {showFolders && <CreateFolderDialog onCreateFolder={handleCreateFolder} />}
                </>
              )}
              {showDownload && (
                <Button variant="outline" size="sm" className="bg-card dark:bg-card">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value={activeTab} className="mt-0">
            {activeTab === "folders" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {foldersState.map((folder) => (
                  <Card key={folder.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="h-8 w-8 text-orange-500" />
                          <div>
                            <h3 className="font-semibold text-lg">{folder.name}</h3>
                            {folder.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{folder.description}</p>
                            )}
                          </div>
                        </div>
                        {showDelete && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{folder.documentCount} documents</span>
                        <span>{formatDate(folder.lastUpdated)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {filteredDocuments.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <EmptyState
                        icon={<FileText className="h-12 w-12" />}
                        title="No documents found"
                        description={searchTerm ? "Try adjusting your search terms" : "No documents available"}
                        ctaLabel={undefined}
                      />
                    </CardContent>
                  </Card>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map((doc) => (
                      <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border hover:border-primary/20 group bg-card dark:bg-card">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {getFileIcon(doc.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-primary transition-colors">{doc.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {doc.size} • {formatDate(doc.uploadedAt)}
                                </p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {showShare && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleView(doc)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleShare(doc)}>
                                      <Share2 className="h-4 w-4 mr-2" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                {showDelete && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            {doc.tag && (
                              <Badge className={cn("text-xs", getCategoryColor(doc.category))}>{doc.tag}</Badge>
                            )}
                            {doc.property && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">{doc.property}</span>
                              </div>
                            )}
                          </div>
                          {doc.folder && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FolderOpen className="h-3 w-3" />
                              <span>{doc.folder}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDocuments.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              {getFileIcon(doc.type)}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold mb-1">{doc.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                  <span>{doc.size}</span>
                                  <span>•</span>
                                  <span>{formatDate(doc.uploadedAt)}</span>
                                  {doc.property && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Building className="h-3 w-3" />
                                        {doc.property}
                                      </span>
                                    </>
                                  )}
                                  {doc.folder && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <FolderOpen className="h-3 w-3" />
                                        {doc.folder}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {doc.tag && (
                                <Badge className={cn("text-xs", getCategoryColor(doc.category))}>{doc.tag}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {showShare && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleView(doc)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleShare(doc)}>
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  {showDelete && (
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
