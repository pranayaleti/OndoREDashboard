import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { DocumentListRecord } from '@/lib/api';
import { documentsApi } from '../api';

function resolveDocumentMimeType(file: File): string {
  if (file.type) return file.type;

  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return 'text/csv';
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (name.endsWith('.xls')) return 'application/vnd.ms-excel';
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (name.endsWith('.doc')) return 'application/msword';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.webp')) return 'image/webp';
  return 'text/plain';
}

export function DocumentVaultPreview() {
  const { t } = useTranslation('dashboard');
  const [documents, setDocuments] = useState<DocumentListRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    documentsApi.listDocuments().then(setDocuments).catch(() => setDocuments([]));
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const mimeType = resolveDocumentMimeType(file);
      const uploadUrl = await documentsApi.createUploadUrl({
        type: 'financial',
        name: file.name,
        fileName: file.name,
        contentType: mimeType,
      });

      await documentsApi.uploadToSignedUrl(uploadUrl.uploadUrl, file, mimeType);
      const document = await documentsApi.confirmUpload({
        documentId: uploadUrl.documentId,
        type: 'financial',
        name: file.name,
        storagePath: uploadUrl.storagePath,
        mimeType,
        sizeBytes: file.size,
      });

      setDocuments((prev) => [document, ...prev]);
      event.target.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const latestDocument = documents[0];

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <p className="text-sm text-muted-foreground">{t('portfolio.documents.title')}</p>
      <p className="text-2xl font-semibold">{documents.length}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {latestDocument
          ? t('portfolio.documents.latest', { name: latestDocument.name ?? '—' })
          : t('portfolio.documents.empty')}
      </p>
      <div className="mt-4">
        <Button
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {isUploading ? t('portfolio.documents.uploading') : t('portfolio.documents.upload')}
        </Button>
        <input ref={fileInputRef} className="hidden" type="file" onChange={handleUpload} />
      </div>
    </div>
  );
}
