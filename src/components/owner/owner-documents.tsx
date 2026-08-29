import { DocumentsPage } from "@/components/shared/documents-page"
import { LeaseTemplatePicker } from "@/components/shared/lease-template-picker"

export default function OwnerDocuments() {
  return (
    <div>
      <div className="container mx-auto px-4 pt-6">
        <LeaseTemplatePicker />
      </div>
      <DocumentsPage
        role="owner"
        fetchFromApi={true}
        showPropertyFilter={true}
        showUpload={false}
        showDownload={true}
        showDelete={false}
        showShare={false}
        showFolders={false}
      />
    </div>
  )
}
