import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function SuperAdminOwners() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Owner Management
          </CardTitle>
          <CardDescription>Manage all owner accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Owner management is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
