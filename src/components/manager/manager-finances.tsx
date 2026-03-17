import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"

export default function ManagerFinances() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Finances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Financial reporting is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
