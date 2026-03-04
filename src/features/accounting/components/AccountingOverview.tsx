import { useEffect, useState } from 'react';
import type { ProfitLossSummary } from '../types';
import { accountingApi } from '../api';

export function AccountingOverview() {
  const [summary, setSummary] = useState<ProfitLossSummary>();

  useEffect(() => {
    accountingApi
      .getProfitLoss({})
      .then(setSummary)
      .catch(() => setSummary(undefined));
  }, []);

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <p className="text-sm text-muted-foreground">Profit &amp; Loss</p>
      <p className="text-2xl font-semibold">
        {summary ? `$${summary.netIncome.toLocaleString()}` : '—'}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Covering {summary?.propertiesIncluded ?? 0} properties
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        CSV exports will be delivered by accountingApi.exportLedger once the backend
        endpoint returns presigned URLs.
      </p>
    </div>
  );
}
