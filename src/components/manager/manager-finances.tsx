import { RoleFinancesView } from "@/components/shared/role-finances-view"

export default function ManagerFinances() {
  return (
    <RoleFinancesView
      title="Portfolio Finances"
      description="Track revenue, expenses, vacancy, recent payments, and owner-specific reports across the properties you manage."
      requireOwnerSelection
      ownerPickerTitle="Owner financial reports"
    />
  )
}
