import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building } from "lucide-react"

export default function SuperAdminProperties() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-6 w-6" />
            System Properties
          </CardTitle>
          <CardDescription>All properties across the system</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Property management is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
