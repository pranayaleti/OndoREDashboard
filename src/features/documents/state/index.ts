import type { DocumentCategory, DocumentRecord } from '../types';

export interface DocumentsState {
  categories: DocumentCategory[];
  records: DocumentRecord[];
}

export const initialDocumentsState: DocumentsState = {
  categories: [],
  records: [],
};
