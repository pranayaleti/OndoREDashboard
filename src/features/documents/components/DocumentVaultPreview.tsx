import { useEffect, useState } from 'react';
import type { DocumentRecord } from '../types';
import { documentsApi } from '../api';

export function DocumentVaultPreview() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    documentsApi.listDocuments().then(setDocuments).catch(() => setDocuments([]));
  }, []);

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <p className="text-sm text-muted-foreground">Document Vault</p>
      <p className="text-2xl font-semibold">{documents.length}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Upload + tagging will point to S3/presigned URLs once configured. The state
        scaffolding keeps a consistent contract for both owners and tenants.
      </p>
    </div>
  );
}
