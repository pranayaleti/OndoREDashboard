import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Building, Home, Hotel, Store, Users } from "lucide-react"
import { AddressForm, type AddressFormValues } from "@/components/forms/address-form"
import { formatAddressFields } from "@/utils/address"

export function LeadForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    propertyType: "",
    propertyValue: "",
    source: "",
    comments: "",
  })
  const [addressValue, setAddressValue] = useState<AddressFormValues>({
    addressType: "home",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    formatAddressFields({
      line1: addressValue.addressLine1,
      line2: addressValue.addressLine2,
      city: addressValue.city,
      state: addressValue.state,
      postalCode: addressValue.postalCode,
    })
    // Here you would typically send the data to your API
    alert("Lead added successfully!")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Property Address</Label>
            <AddressForm
              value={addressValue}
              onChange={setAddressValue}
              idPrefix="lead"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="propertyType">Property Type</Label>
            <Select
              onValueChange={(value) => handleSelectChange("propertyType", value)}
              defaultValue={formData.propertyType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-family">
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    <span>Single-Family</span>
                  </div>
                </SelectItem>
                <SelectItem value="multi-family">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Multi-Family</span>
                  </div>
                </SelectItem>
                <SelectItem value="commercial">
                  <div className="flex items-center">
                    <Store className="h-4 w-4 mr-2" />
                    <span>Commercial</span>
                  </div>
                </SelectItem>
                <SelectItem value="vacation">
                  <div className="flex items-center">
                    <Hotel className="h-4 w-4 mr-2" />
                    <span>Vacation</span>
                  </div>
                </SelectItem>
                <SelectItem value="association">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    <span>Association</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="propertyValue">Property Value</Label>
            <Select
              onValueChange={(value) => handleSelectChange("propertyValue", value)}
              defaultValue={formData.propertyValue}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property value" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-300k">Under $300,000</SelectItem>
                <SelectItem value="300k-500k">$300,000 - $500,000</SelectItem>
                <SelectItem value="500k-750k">$500,000 - $750,000</SelectItem>
                <SelectItem value="750k-1m">$750,000 - $1,000,000</SelectItem>
                <SelectItem value="over-1m">Over $1,000,000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="source">Lead Source</Label>
            <Select onValueChange={(value) => handleSelectChange("source", value)} defaultValue={formData.source}>
              <SelectTrigger>
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social-media">Social Media</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="comments">Additional Comments</Label>
            <Textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              className="min-h-[120px]"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Add Lead</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
