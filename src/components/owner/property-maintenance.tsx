"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Search, Wrench, DollarSign, Clock, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface MaintenanceRecord {
  id: string
  date: string
  type: string
  description: string
  cost: number
  status: string
}

interface PropertyMaintenanceProps {
  property: { maintenanceHistory?: MaintenanceRecord[] }
}

export function PropertyMaintenance({ property }: PropertyMaintenanceProps) {
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>(property.maintenanceHistory || [])
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Filter maintenance history based on search term
  const filteredHistory = maintenanceHistory.filter(
    (item) =>
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddMaintenance = (data: { date: string; type: string; description: string; cost: string; status: string }) => {
    // In a real app, this would call an API to add the maintenance record
    const newRecord = {
      id: `maint${maintenanceHistory.length + 1}`,
      date: data.date,
      type: data.type,
      description: data.description,
      cost: Number.parseFloat(data.cost),
      status: data.status,
    }

    setMaintenanceHistory([newRecord, ...maintenanceHistory])

    toast({
      title: "Maintenance record added",
      description: "The maintenance record has been successfully added.",
    })
  }

  // Calculate total maintenance costs
  const totalCost = maintenanceHistory.reduce((sum: number, item: MaintenanceRecord) => sum + item.cost, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Maintenance History</h3>
          <p className="text-sm text-muted-foreground">Track repairs, upgrades, and routine maintenance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search maintenance..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <AddMaintenanceDialog onAddMaintenance={handleAddMaintenance} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Maintenance Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime maintenance expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceHistory.length > 0 ? maintenanceHistory[0].type : "No records"}
            </div>
            <p className="text-xs text-muted-foreground">
              {maintenanceHistory.length > 0
                ? `${new Date(maintenanceHistory[0].date).toLocaleDateString()} - $${maintenanceHistory[0].cost}`
                : "Add your first maintenance record"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Maintenance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">HVAC Service</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Records</CardTitle>
          <CardDescription>History of all maintenance and repairs</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No maintenance records found</h3>
              <p className="text-muted-foreground text-center mb-6">
                {searchTerm ? "Try adjusting your search" : "Add your first maintenance record to start tracking"}
              </p>
              <AddMaintenanceDialog onAddMaintenance={handleAddMaintenance} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((record: MaintenanceRecord) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>
                      {record.status === "completed" ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : record.status === "scheduled" ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Calendar className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">${record.cost.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AddMaintenanceDialog({ onAddMaintenance }: { onAddMaintenance: (data: { date: string; type: string; description: string; cost: string; status: string }) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "",
    description: "",
    cost: "",
    status: "completed",
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
    onAddMaintenance(formData)
    setOpen(false)
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "",
      description: "",
      cost: "",
      status: "completed",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Maintenance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Maintenance Record</DialogTitle>
            <DialogDescription>Add a new maintenance or repair record for this property.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Maintenance Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Appliance">Appliance</SelectItem>
                    <SelectItem value="Structural">Structural</SelectItem>
                    <SelectItem value="Landscaping">Landscaping</SelectItem>
                    <SelectItem value="Cleaning">Cleaning</SelectItem>
                    <SelectItem value="Pest Control">Pest Control</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the maintenance or repair work"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  placeholder="e.g. 150"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
