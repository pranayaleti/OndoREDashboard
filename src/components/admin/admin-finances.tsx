import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"

export default function AdminFinances() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            System Finances
          </CardTitle>
          <CardDescription>System-wide financial overview</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Financial reporting is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
