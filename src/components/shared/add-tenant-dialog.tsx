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
import { UserPlus, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api"
import { useApi } from "@/hooks/useApi"

interface AddTenantDialogProps {
  trigger?: React.ReactNode
  buttonClassName?: string
}

export function AddTenantDialog({ trigger, buttonClassName }: AddTenantDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const { loading: isInviting, execute: sendInvitation } = useApi(authApi.invite)
  
  const [formData, setFormData] = useState({
    emails: [""],
    role: "tenant" as "super_admin" | "admin" | "manager" | "owner" | "tenant" | "maintenance"
  })

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      emails: [...prev.emails, ""]
    }))
  }

  const removeEmailField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }))
  }

  const updateEmail = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => i === index ? value : email)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filter out empty emails
    const validEmails = formData.emails.filter(email => email.trim() !== "")
    
    if (validEmails.length === 0) {
      toast({
        title: "No emails provided",
        description: "Please enter at least one email address.",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = validEmails.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      toast({
        title: "Invalid email format",
        description: `Please check the following emails: ${invalidEmails.join(", ")}`,
        variant: "destructive",
      })
      return
    }
    
    try {
      const results = await Promise.allSettled(
        validEmails.map(email => 
          sendInvitation({
            email: email.trim(),
            role: formData.role
          })
        )
      )

      const successful = results.filter(r => r.status === "fulfilled").length
      const failed = results.filter(r => r.status === "rejected").length

      if (successful > 0) {
        toast({
          title: "Invitations Sent!",
          description: `Successfully sent ${successful} invitation${successful > 1 ? "s" : ""}${failed > 0 ? `. ${failed} failed.` : ""}`,
          duration: 3000,
        })
      }

      if (failed > 0 && successful === 0) {
        toast({
          title: "Invitations Failed",
          description: "Failed to send invitations. Please try again.",
          variant: "destructive",
        })
      }
      
      // Reset form and close dialog
      setFormData({ emails: [""], role: "tenant" })
      setIsOpen(false)
    } catch (error: unknown) {
      toast({
        title: "Invitation Failed",
        description: error instanceof Error ? error.message : String(error) || "Failed to send invitations. Please try again.",
        variant: "destructive",
      })
    }
  }

  const defaultTrigger = (
    <Button className={buttonClassName || "bg-orange-600 hover:bg-orange-700 text-white"}>
      <UserPlus className="mr-2 h-4 w-4" />
      Add Tenant
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {formData.role === "tenant" ? "Add New Tenant" : 
             formData.role === "owner" ? "Add New Property Owner" :
             formData.role === "manager" ? "Add New Manager" :
             formData.role === "admin" ? "Add New Admin" :
             formData.role === "super_admin" ? "Add New Super Admin" :
             formData.role === "maintenance" ? "Add New Maintenance Staff" :
             "Add New User"}
          </DialogTitle>
          <DialogDescription>
            {formData.role === "tenant" 
              ? "Invite tenant(s) to join the platform and access their tenant portal"
              : formData.role === "owner"
              ? "Invite property owner(s) to join your management platform"
              : formData.role === "manager"
              ? "Invite manager(s) to join the platform"
              : formData.role === "admin"
              ? "Invite admin(s) to join the platform"
              : formData.role === "super_admin"
              ? "Invite super admin(s) to join the platform"
              : formData.role === "maintenance"
              ? "Invite maintenance staff to join the platform"
              : "Invite user(s) to join the platform"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Email Address{formData.emails.length > 1 ? "es" : ""} *</Label>
              {formData.emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    placeholder={
                      formData.role === "tenant" ? "tenant@email.com" : 
                      formData.role === "owner" ? "owner@email.com" :
                      formData.role === "manager" ? "manager@email.com" :
                      formData.role === "admin" ? "admin@email.com" :
                      formData.role === "super_admin" ? "superadmin@email.com" :
                      formData.role === "maintenance" ? "maintenance@email.com" :
                      "user@email.com"
                    }
                    required={index === 0}
                  />
                  {formData.emails.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeEmailField(index)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmailField}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Email
              </Button>
              <p className="text-sm text-gray-500 mt-1">
                Invitation{formData.emails.length > 1 ? "s will be sent" : " will be sent"} to the provided email{formData.emails.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: "super_admin" | "admin" | "manager" | "owner" | "tenant" | "maintenance") => setFormData(prev => ({ ...prev, role: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="owner">Property Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                All selected email addresses will be invited as this role
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Invitation email{formData.emails.length > 1 ? "s will be sent" : " will be sent"} to the provided address{formData.emails.length > 1 ? "es" : ""}</li>
                <li>• The recipient{formData.emails.length > 1 ? "s will" : " will"} receive a secure signup link</li>
                <li>• They'll complete their profile (name, phone, password)</li>
                <li>• Once registered, they'll have access to their portal</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isInviting} className="bg-orange-600 hover:bg-orange-700">
              {isInviting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

