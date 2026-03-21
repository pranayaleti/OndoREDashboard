import { RoleFinancesView } from "@/components/shared/role-finances-view"

export default function AdminFinances() {
  return (
    <RoleFinancesView
      title="System Finances"
      description="Review portfolio-wide financial performance, recent payment activity, and drill into owner-level reports from the admin dashboard."
      requireOwnerSelection
      ownerPickerTitle="Owner financial reports"
    />
  )
}
