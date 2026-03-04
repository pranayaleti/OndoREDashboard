import { useMemo } from 'react';
import { accountingApi } from '../api';

export function useAccountingFeature() {
  return useMemo(() => ({
    listLedgerEntries: accountingApi.listLedgerEntries,
    createLedgerEntry: accountingApi.createLedgerEntry,
    recordExpense: accountingApi.recordExpense,
    getProfitLoss: accountingApi.getProfitLoss,
    exportLedger: accountingApi.exportLedger,
  }), []);
}
