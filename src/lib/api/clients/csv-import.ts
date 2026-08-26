/**
 * CSV migration import client — bulk-import properties from a competitor export.
 * Talks to OndoREBackend /api/csv-import. Responses wrapped in { message, data }.
 */

import { apiPost, getAuthHeaders } from "../http";

export type ImportSource = "turbotenant" | "buildium" | "generic";

export interface MappedProperty {
  title: string;
  type: string;
  addressLine1: string;
  addressLine2: string | null;
  unitNumber: string | null;
  city: string;
  state: string | null;
  zipcode: string | null;
  country: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  price: number | null;
}

export interface RowError {
  row: number;
  errors: string[];
}

export interface ImportPreview {
  source: ImportSource;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  columns: string[];
  mapped: MappedProperty[];
  invalid: RowError[];
}

export interface ImportResult {
  source: ImportSource;
  created: number;
  failed: number;
  errors: RowError[];
}

interface Wrapped<T> {
  message: string;
  data: T;
}

export const csvImportApi = {
  async preview(csv: string): Promise<ImportPreview> {
    const res = await apiPost<Wrapped<ImportPreview>>("/csv-import/preview", { csv }, getAuthHeaders());
    return res.data;
  },
  async commit(csv: string): Promise<ImportResult> {
    const res = await apiPost<Wrapped<ImportResult>>("/csv-import/commit", { csv }, getAuthHeaders());
    return res.data;
  },
};
