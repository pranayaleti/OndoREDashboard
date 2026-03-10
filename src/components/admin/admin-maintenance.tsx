import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wrench, Plus } from "lucide-react"
import { maintenanceApi, propertyApi, type Property } from "@/lib/api"
import { NewMaintenanceRequestDialog } from "@/components/maintenance/new-maintenance-request-dialog"
import { useToast } from "@/hooks/use-toast"

export default function AdminMaintenance() {
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const res = await propertyApi.getProperties()
      setProperties(res.properties)
    } catch (err: any) {
      console.error("Error fetching properties:", err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Maintenance Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage maintenance requests and tickets
          </p>
        </div>
        <Button onClick={() => setIsNewRequestDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
          <CardDescription>View and manage all maintenance requests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Maintenance request management interface - connect to API to display and manage maintenance requests
          </p>
        </CardContent>
      </Card>

      {/* New Maintenance Request Dialog */}
      <NewMaintenanceRequestDialog
        open={isNewRequestDialogOpen}
        onOpenChange={setIsNewRequestDialogOpen}
        onSubmit={async (data) => {
          try {
            await maintenanceApi.createMaintenanceRequest({
              title: data.title,
              description: data.description,
              category: data.category as any,
              priority: data.priority as any,
              photos: [] // ROADMAP: Handle photo uploads (Q2 2026 - document management).
            })

            toast({
              title: "Request Created",
              description: "Maintenance ticket has been created successfully.",
            })

            setIsNewRequestDialogOpen(false)
          } catch (error: any) {
            console.error("Error creating maintenance request:", error)
            throw error // Re-throw to let dialog handle the error display
          }
        }}
        showPropertyField={true}
        showTenantField={true}
        properties={properties}
      />
    </div>
  )
}
