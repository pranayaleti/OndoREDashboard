import { apiGet, apiPost } from "../http";

export interface OwnerStatement {
  id: string;
  ownerId: string;
  periodStart: string;
  periodEnd: string;
  totalIncomeCents: number;
  totalExpenseCents: number;
  netIncomeCents: number;
  lineItems: Array<{ description: string; amountCents: number; type: string; propertyId: string; date: string }>;
  status: string;
  pdfUrl: string | null;
  generatedAt: string;
}

export const ownerStatementsApi = {
  async getStatements(limit?: number): Promise<OwnerStatement[]> {
    const url = limit ? `/owner-statements?limit=${limit}` : '/owner-statements';
    const res = await apiGet<{ data: OwnerStatement[] }>(url);
    return res.data;
  },
  async getStatement(id: string): Promise<OwnerStatement> {
    const res = await apiGet<{ data: OwnerStatement }>(`/owner-statements/${id}`);
    return res.data;
  },
  async generate(periodStart: string, periodEnd: string): Promise<OwnerStatement> {
    const res = await apiPost<{ data: OwnerStatement }>('/owner-statements/generate', { periodStart, periodEnd });
    return res.data;
  },
  async emailStatement(id: string, customMessage?: string): Promise<{ sent: boolean; email: string }> {
    const res = await apiPost<{ data: { sent: boolean; email: string } }>(`/owner-statements/${id}/email`, { customMessage });
    return res.data;
  },
  async emailBatchStatements(statementIds: string[], customMessage?: string): Promise<{ sent: number; failed: number }> {
    const res = await apiPost<{ data: { sent: number; failed: number } }>('/owner-statements/email-batch', { statementIds, customMessage });
    return res.data;
  },
};
