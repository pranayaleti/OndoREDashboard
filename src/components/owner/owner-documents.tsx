import { DocumentsPage } from "@/components/shared/documents-page"

export default function OwnerDocuments() {
  return (
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
  )
}
