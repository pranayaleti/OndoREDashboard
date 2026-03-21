import { RoleFinancesView } from "@/components/shared/role-finances-view"

export default function SuperAdminFinances() {
  return (
    <RoleFinancesView
      title="Enterprise Finances"
      description="Audit revenue, expenses, vacancy, payments, and owner-level reports across the full platform from the super admin dashboard."
      requireOwnerSelection
      ownerPickerTitle="Owner financial reports"
    />
  )
}
