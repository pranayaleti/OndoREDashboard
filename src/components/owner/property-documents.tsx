"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Upload,
  Download,
  Search,
  Plus,
  File,
  FileImage,
  FileIcon as FilePdf,
  FileSpreadsheet,
  MoreHorizontal,
  Trash2,
  Share2,
  Eye,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

// Mock documents data
const DOCUMENTS = [
  {
    id: "doc1",
    name: "Lease Agreement - Unit 1",
    type: "pdf",
    category: "lease",
    size: "1.2 MB",
    uploadedAt: "2023-01-15T10:30:00",
    uploadedBy: "Sarah Johnson",
  },
  {
    id: "doc2",
    name: "Property Insurance Policy",
    type: "pdf",
    category: "insurance",
    size: "3.5 MB",
    uploadedAt: "2023-02-10T14:45:00",
    uploadedBy: "Sarah Johnson",
  },
  {
    id: "doc3",
    name: "Property Tax Statement 2023",
    type: "pdf",
    category: "tax",
    size: "850 KB",
    uploadedAt: "2023-03-20T09:15:00",
    uploadedBy: "Sarah Johnson",
  },
  {
    id: "doc4",
    name: "Maintenance Receipt - Plumbing",
    type: "image",
    category: "maintenance",
    size: "2.1 MB",
    uploadedAt: "2023-04-05T16:20:00",
    uploadedBy: "Sarah Johnson",
  },
  {
    id: "doc5",
    name: "Property Inspection Report",
    type: "pdf",
    category: "inspection",
    size: "4.3 MB",
    uploadedAt: "2023-05-12T11:10:00",
    uploadedBy: "Sarah Johnson",
  },
  {
    id: "doc6",
    name: "Rental Income Spreadsheet",
    type: "spreadsheet",
    category: "financial",
    size: "1.8 MB",
    uploadedAt: "2023-06-01T13:40:00",
    uploadedBy: "Sarah Johnson",
  },
]

export function PropertyDocuments() {
  const [documents, setDocuments] = useState(DOCUMENTS)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const { toast } = useToast()

  // Filter documents based on search term and category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddDocument = (data: any) => {
    // In a real app, this would call an API to upload the document
    const newDocument = {
      id: `doc${documents.length + 1}`,
      name: data.name,
      type: getFileType(data.name),
      category: data.category,
      size: "1.5 MB", // Mock size
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Sarah Johnson", // Current user
    }

    setDocuments([newDocument, ...documents])

    toast({
      title: "Document uploaded",
      description: "The document has been successfully uploaded.",
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Property Documents</h3>
          <p className="text-sm text-muted-foreground">Store and manage important property documents</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by category" />
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
          <AddDocumentDialog onAddDocument={handleAddDocument} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground text-center mb-6">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload your first document to get started"}
              </p>
              <AddDocumentDialog onAddDocument={handleAddDocument} />
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((document) => (
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
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 capitalize">
                      {document.category}
                    </span>
                    <span className="text-xs text-muted-foreground">Uploaded by {document.uploadedBy}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AddDocumentDialog({ onAddDocument }: { onAddDocument: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddDocument(formData)
    setOpen(false)
    setFormData({
      name: "",
      category: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a new document for this property.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Drag and drop your file here</p>
                <p className="text-xs text-muted-foreground mb-4">PDF, JPG, PNG, or Excel files up to 10MB</p>
                <Button type="button" variant="secondary" size="sm">
                  Browse Files
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Document Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Lease Agreement 2023"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lease">Lease</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Upload</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
