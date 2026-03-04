import { useMemo } from 'react';
import { documentsApi } from '../api';

export function useDocumentsFeature() {
  return useMemo(() => ({
    listCategories: documentsApi.listCategories,
    listDocuments: documentsApi.listDocuments,
    uploadDocument: documentsApi.uploadDocument,
    deleteDocument: documentsApi.deleteDocument,
  }), []);
}
