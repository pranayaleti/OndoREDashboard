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
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NewMessageDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreateConversation: (data: any) => void
}

export function NewMessageDialog({ onCreateConversation }: NewMessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    recipient: "",
    recipientType: "tenant",
    property: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onCreateConversation(formData)
      setOpen(false)

      toast({
        title: "Message sent",
        description: `Your message has been sent to ${formData.recipient}.`,
      })

      // Reset form
      setFormData({
        recipient: "",
        recipientType: "tenant",
        property: "",
        message: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Start a new conversation with a tenant or vendor.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipientType">Recipient Type</Label>
              <Select
                value={formData.recipientType}
                onValueChange={(value) => handleSelectChange("recipientType", value)}
              >
                <SelectTrigger id="recipientType">
                  <SelectValue placeholder="Select recipient type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="vendor">Vendor/Service Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="recipient">Recipient Name</Label>
              <Input
                id="recipient"
                name="recipient"
                placeholder={`Enter ${formData.recipientType} name`}
                value={formData.recipient}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="property">Property</Label>
              <Select
                value={formData.property}
                onValueChange={(value) => handleSelectChange("property", value)}
                required
              >
                <SelectTrigger id="property">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="123 Main Street, Unit 1">123 Main Street, Unit 1</SelectItem>
                  <SelectItem value="123 Main Street, Unit 2">123 Main Street, Unit 2</SelectItem>
                  <SelectItem value="456 Oak Avenue">456 Oak Avenue</SelectItem>
                  <SelectItem value="789 Pine Street">789 Pine Street</SelectItem>
                  <SelectItem value="Multiple Properties">Multiple Properties</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Type your message..."
                value={formData.message}
                onChange={handleChange}
                required
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
