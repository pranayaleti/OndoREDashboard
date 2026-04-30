"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Calendar,
  Building,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { AddDocumentDialog } from "@/components/owner/add-document-dialog"
import { CreateFolderDialog } from "@/components/owner/create-folder-dialog"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"

// Mock folders data
const FOLDERS = [
  {
    id: "folder1",
    name: "Leases",
    description: "Lease agreements for all properties",
    documentCount: 5,
    lastUpdated: "2023-05-15T10:30:00",
  },
  {
    id: "folder2",
    name: "Insurance",
    description: "Property insurance policies and claims",
    documentCount: 3,
    lastUpdated: "2023-04-20T14:45:00",
  },
  {
    id: "folder3",
    name: "Tax Documents",
    description: "Property tax statements and receipts",
    documentCount: 4,
    lastUpdated: "2023-03-10T09:15:00",
  },
  {
    id: "folder4",
    name: "Maintenance Records",
    description: "Maintenance receipts and service records",
    documentCount: 7,
    lastUpdated: "2023-05-05T16:20:00",
  },
  {
    id: "folder5",
    name: "Property Inspections",
    description: "Inspection reports and certificates",
    documentCount: 2,
    lastUpdated: "2023-02-12T11:10:00",
  },
  {
    id: "folder6",
    name: "Financial Records",
    description: "Financial statements and reports",
    documentCount: 6,
    lastUpdated: "2023-05-01T13:40:00",
  },
]

// Mock documents data
const DOCUMENTS = [
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
  },
]

export function DocumentsView() {
  const [activeTab, setActiveTab] = useState("all")
  const [documents, setDocuments] = useState(DOCUMENTS)
  const [folders, setFolders] = useState(FOLDERS)
  const [searchTerm, setSearchTerm] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [folderFilter, setFolderFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { toast } = useToast()

  // Filter documents based on search term, property, category, and folder
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProperty = propertyFilter === "all" || doc.property === propertyFilter
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter
    const matchesFolder = folderFilter === "all" || doc.folder === folderFilter

    if (activeTab === "all") return matchesSearch && matchesProperty && matchesCategory && matchesFolder
    if (activeTab === "recent") {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      return (
        matchesSearch && matchesProperty && matchesCategory && matchesFolder && new Date(doc.uploadedAt) >= oneMonthAgo
      )
    }
    if (activeTab === "shared") {
      // Mock shared documents (in a real app, this would be determined by a 'shared' property)
      return (
        matchesSearch &&
        matchesProperty &&
        matchesCategory &&
        matchesFolder &&
        ["doc1", "doc4", "doc10"].includes(doc.id)
      )
    }

    return matchesSearch && matchesProperty && matchesCategory && matchesFolder
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _handleAddDocument = (data: any) => {
    // In a real app, this would call an API to upload the document
    const newDocument = {
      id: `doc${documents.length + 1}`,
      name: data.name,
      type: getFileType(data.name),
      category: data.category,
      property: data.property,
      size: "1.5 MB", // Mock size
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Sarah Johnson", // Current user
      folder: data.folder,
    }

    setDocuments([newDocument, ...documents])

    toast({
      title: "Document uploaded",
      description: "The document has been successfully uploaded.",
    })
  }
  void _handleAddDocument

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateFolder = (data: any) => {
    // In a real app, this would call an API to create the folder
    const newFolder = {
      id: `folder${folders.length + 1}`,
      name: data.name,
      description: data.description,
      documentCount: 0,
      lastUpdated: new Date().toISOString(),
    }

    setFolders([...folders, newFolder])

    toast({
      title: "Folder created",
      description: "The folder has been successfully created.",
    })
  }

  const handleDeleteDocument = (id: string) => {
    // In a real app, this would call an API to delete the document
    setDocuments(documents.filter((doc) => doc.id !== id))

    toast({
      title: "Document deleted",
      description: "The document has been successfully deleted.",
    })
  }

  const handleDeleteFolder = (id: string) => {
    // In a real app, this would call an API to delete the folder
    setFolders(folders.filter((folder) => folder.id !== id))

    // Remove folder association from documents
    const folderName = folders.find((folder) => folder.id === id)?.name
    if (folderName) {
      setDocuments(
        documents.map((doc) => {
          if (doc.folder === folderName) {
            return { ...doc, folder: "" }
          }
          return doc
        }),
      )
    }

    toast({
      title: "Folder deleted",
      description: "The folder has been successfully deleted.",
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

  const getFileType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (extension === "pdf") return "pdf"
    if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) return "image"
    if (["xls", "xlsx", "csv"].includes(extension || "")) return "spreadsheet"
    return "other"
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
            <TabsTrigger value="folders">Folders</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="123 Main Street">123 Main Street</SelectItem>
                <SelectItem value="456 Oak Avenue">456 Oak Avenue</SelectItem>
                <SelectItem value="789 Pine Street">789 Pine Street</SelectItem>
                <SelectItem value="All Properties">Shared Properties</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="lease">Lease</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="tax">Tax</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
              </SelectContent>
            </Select>
            {activeTab !== "folders" && (
              <Select value={folderFilter} onValueChange={setFolderFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.name}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <div>
            {activeTab !== "folders" && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <div className="grid grid-cols-2 gap-0.5 h-4 w-4 mr-2">
                    <div className="bg-current rounded-sm" />
                    <div className="bg-current rounded-sm" />
                    <div className="bg-current rounded-sm" />
                    <div className="bg-current rounded-sm" />
                  </div>
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <div className="flex flex-col gap-0.5 h-4 w-4 mr-2">
                    <div className="h-0.5 w-full bg-current rounded-sm" />
                    <div className="h-0.5 w-full bg-current rounded-sm" />
                    <div className="h-0.5 w-full bg-current rounded-sm" />
                  </div>
                  List
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {activeTab === "folders" ? (
              <CreateFolderDialog onCreateFolder={handleCreateFolder} />
            ) : (
              <AddDocumentDialog />
            )}
            <ExportPDFButton 
              fileName="documents-list"
              size="sm"
              variant="outline"
              content={{
                title: "Documents List",
                subtitle: `Total documents: ${filteredDocuments.length}`,
                summary: [
                  { label: "Total Documents", value: filteredDocuments.length },
                  { label: "Total Folders", value: folders.length },
                  { label: "Filter Applied", value: activeTab === "all" ? "All Documents" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }
                ],
                tables: [
                  {
                    title: "Documents",
                    headers: ["Name", "Type", "Category", "Property", "Size", "Folder", "Uploaded"],
                    rows: filteredDocuments.map(doc => [
                      doc.name,
                      doc.type.toUpperCase(),
                      doc.category.charAt(0).toUpperCase() + doc.category.slice(1),
                      doc.property,
                      doc.size,
                      doc.folder,
                      new Date(doc.uploadedAt).toLocaleDateString()
                    ])
                  }
                ]
              }}
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-6">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {searchTerm || propertyFilter !== "all" || categoryFilter !== "all" || folderFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Upload your first document to get started"}
                </p>
                <AddDocumentDialog />
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4 border-b">
                      {getFileIcon(document.type)}
                      <div className="ml-3 flex-1 overflow-hidden">
                        <h4 className="font-medium truncate">{document.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {document.size} • {new Date(document.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteDocument(document.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="p-4 bg-muted/30">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 capitalize">
                            {document.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {document.folder ? (
                              <span className="flex items-center">
                                <FolderOpen className="h-3 w-3 mr-1" />
                                {document.folder}
                              </span>
                            ) : (
                              "No folder"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Building className="h-3 w-3 mr-1" />
                          {document.property}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Folder</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {getFileIcon(document.type)}
                            <span className="ml-2 font-medium">{document.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                            {document.property}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 capitalize">
                            {document.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          {document.folder ? (
                            <span className="flex items-center">
                              <FolderOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                              {document.folder}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {new Date(document.uploadedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{document.size}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteDocument(document.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          {/* Similar content as "all" tab but filtered for recent documents */}
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No recent documents found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {searchTerm || propertyFilter !== "all" || categoryFilter !== "all" || folderFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Upload a document to get started"}
                </p>
                <AddDocumentDialog />
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : ""}>
              {/* Same document cards or table as in "all" tab */}
              {/* This is a duplicate of the content in the "all" tab, filtered for recent documents */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          {/* Similar content as "all" tab but filtered for shared documents */}
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No shared documents found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {searchTerm || propertyFilter !== "all" || categoryFilter !== "all" || folderFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Share a document to get started"}
                </p>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share a Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : ""}>
              {/* Same document cards or table as in "all" tab */}
              {/* This is a duplicate of the content in the "all" tab, filtered for shared documents */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="folders" className="mt-6">
          {folders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No folders found</h3>
                <p className="text-muted-foreground text-center mb-6">Create a folder to organize your documents</p>
                <CreateFolderDialog onCreateFolder={handleCreateFolder} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map((folder) => (
                <Card key={folder.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4 border-b">
                      <FolderOpen className="h-6 w-6 text-amber-500" />
                      <div className="ml-3 flex-1">
                        <h4 className="font-medium">{folder.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {folder.documentCount} {folder.documentCount === 1 ? "document" : "documents"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => { setActiveTab("all"); setFolderFilter(folder.name); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Contents
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Folder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Folder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="p-4 bg-muted/30">
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-muted-foreground">{folder.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(folder.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
