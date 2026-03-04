import { useEffect, useState } from 'react';
import type { LeaseDocument } from '../types';
import { leaseManagementApi } from '../api';

export function LeaseManagementOverview() {
  const [leases, setLeases] = useState<LeaseDocument[]>([]);

  useEffect(() => {
    leaseManagementApi.listLeases().then(setLeases).catch(() => setLeases([]));
  }, []);

  const expiringSoon = leases.filter((lease) => {
    if (!lease.expirationDate) return false;
    const expires = new Date(lease.expirationDate).getTime();
    const now = Date.now();
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;
    return expires - now < thirtyDays;
  }).length;

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Active Leases</p>
          <p className="text-2xl font-semibold">{leases.length}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Expiring &lt; 30 days</p>
          <p className="text-lg font-medium">{expiringSoon}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        DocuSign/HelloSign requests will attach once API keys are configured. See
        leaseManagementApi.sendForSignature for the TODO hook.
      </p>
    </div>
  );
}
