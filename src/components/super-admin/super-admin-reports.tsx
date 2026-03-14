import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { authApi, type InvitedUser } from "@/lib/api"
import { FinancialReportsView, type OwnerOption } from "@/components/shared/financial-reports-view"

export default function SuperAdminReports() {
  const [owners, setOwners] = useState<OwnerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)

  useEffect(() => {
    authApi
      .getInvitedUsers(1, 500)
      .then((res) => {
        const users = (res as { users: InvitedUser[] }).users ?? []
        const ownerList = users
          .filter((u) => u.role === "owner" && u.isActive)
          .map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))
        setOwners(ownerList)
        if (ownerList.length > 0 && !selectedOwnerId) {
          setSelectedOwnerId(ownerList[0].id)
        }
      })
      .catch(() => setOwners([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          System Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Financial reports by owner. Select an owner to view P&L, rent roll, and vacancy.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6">Loading owners…</CardContent>
        </Card>
      ) : (
        <FinancialReportsView
          requireOwnerSelection
          owners={owners}
          selectedOwnerId={selectedOwnerId}
          onOwnerIdChange={setSelectedOwnerId}
          title="Financial reports"
        />
      )}
    </div>
  )
}
