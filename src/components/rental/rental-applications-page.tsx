import { RentalApplicationsInbox } from "@/components/rental/rental-applications-inbox"
import { OwnerRentalOverview } from "@/components/rental/owner-rental-overview"
import { useAuth } from "@/lib/auth-context"

export default function RentalApplicationsPage() {
  const { user } = useAuth()
  const showOwnerOverview = user?.role === "owner"

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Rental applications</h1>
      {showOwnerOverview ? <OwnerRentalOverview /> : null}
      <RentalApplicationsInbox />
    </div>
  )
}
