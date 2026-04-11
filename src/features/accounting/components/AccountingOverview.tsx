import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProfitLossSummary } from '../types';
import { accountingApi } from '../api';
import { Button } from '@/components/ui/button';

export function AccountingOverview() {
  const { t } = useTranslation('dashboard');
  const [summary, setSummary] = useState<ProfitLossSummary>();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    accountingApi
      .getProfitLoss({})
      .then(setSummary)
      .catch(() => setSummary(undefined));
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const result = await accountingApi.exportLedger({
        startDate: summary?.startDate,
        endDate: summary?.endDate,
        format: 'csv',
      });
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <p className="text-sm text-muted-foreground">{t('portfolio.accounting.title')}</p>
      <p className="text-2xl font-semibold">
        {summary ? `$${summary.netIncome.toLocaleString()}` : '—'}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('portfolio.accounting.covering', { count: summary?.propertiesIncluded ?? 0 })}
      </p>
      <Button className="mt-4" disabled={isExporting || !summary} onClick={handleExport}>
        {isExporting ? t('portfolio.accounting.exporting') : t('portfolio.accounting.export')}
      </Button>
    </div>
  );
}
