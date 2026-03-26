import { SharedPropertiesView } from "@/components/shared/shared-properties-view"

export default function OwnerPropertyManagement() {
  return (
    <SharedPropertiesView
      title="Your Properties"
      description="Manage your rental portfolio"
      ownerView
    />
  )
}
