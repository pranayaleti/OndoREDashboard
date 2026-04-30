"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUp, AlertTriangle, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddDocumentDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddDocument?: (data: any) => void
}

export function AddDocumentDialog({ onAddDocument }: AddDocumentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    property: "",
    folder: "",
  })
  const { toast } = useToast()

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false)
      setIsOpen(false)

      if (onAddDocument) {
        onAddDocument(formData)
      }

      toast({
        title: "Document uploaded",
        description: "The document has been successfully uploaded.",
      })

      // Reset form
      setFormData({
        name: "",
        category: "",
        property: "",
        folder: "",
      })
    }, 1500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Upload a document to your property management system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="document-name">Document Name</Label>
              <Input 
                id="document-name" 
                placeholder="Enter document name" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document-type">Document Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger id="document-type">
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
            <div className="grid gap-2">
              <Label htmlFor="document-property">Property</Label>
              <Select value={formData.property} onValueChange={(value) => setFormData(prev => ({ ...prev, property: value }))}>
                <SelectTrigger id="document-property">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="123 Main Street">123 Main Street</SelectItem>
                  <SelectItem value="456 Oak Avenue">456 Oak Avenue</SelectItem>
                  <SelectItem value="All Properties">All Properties</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document-folder">Folder</Label>
              <Select value={formData.folder} onValueChange={(value) => setFormData(prev => ({ ...prev, folder: value }))}>
                <SelectTrigger id="document-folder">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Leases">Leases</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Tax Documents">Tax Documents</SelectItem>
                  <SelectItem value="Maintenance Records">Maintenance Records</SelectItem>
                  <SelectItem value="Property Inspections">Property Inspections</SelectItem>
                  <SelectItem value="Financial Records">Financial Records</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document-file">Upload File</Label>
              <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Drag and drop your file here or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX up to 10MB</p>
                <div className="mt-4 w-full">
                  <Input id="document-file" type="file" className="cursor-pointer" />
                </div>
              </div>
            </div>
            <div className="bg-amber-50 p-3 rounded-md flex items-start gap-2 border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Feature in Development</p>
                <p className="text-xs text-amber-700">
                  Document upload functionality is currently being developed. This form is for demonstration purposes
                  only.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
