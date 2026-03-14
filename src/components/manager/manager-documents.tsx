import { DocumentsPage } from "@/components/shared/documents-page"

export default function ManagerDocuments() {
  return (
    <DocumentsPage
      role="manager"
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

