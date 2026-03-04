import type { LedgerEntry, ProfitLossSummary } from '../types';

export interface AccountingState {
  ledger: LedgerEntry[];
  summary?: ProfitLossSummary;
}

export const initialAccountingState: AccountingState = {
  ledger: [],
  summary: undefined,
};
