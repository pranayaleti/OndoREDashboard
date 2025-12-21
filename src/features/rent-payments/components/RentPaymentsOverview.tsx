import { useEffect, useState } from 'react';
import type { RentPayment, RentSchedule } from '../types';
import { rentPaymentsApi } from '../api';

export function RentPaymentsOverview() {
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [recentPayments, setRecentPayments] = useState<RentPayment[]>([]);

  useEffect(() => {
    rentPaymentsApi.getSchedule().then(setSchedules).catch(() => setSchedules([]));
    rentPaymentsApi
      .listPayments({})
      .then((result) => setRecentPayments(result.slice(0, 5)))
      .catch(() => setRecentPayments([]));
  }, []);

  const activeAutoPay = schedules.filter((schedule) => schedule.autopayEnabled).length;

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Active Rent Schedules</p>
          <p className="text-2xl font-semibold">{schedules.length}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Auto-pay Enabled</p>
            <p className="font-medium">{activeAutoPay}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Recent Payments</p>
            <p className="font-medium">{recentPayments.length}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Stripe ACH + Plaid tokens will be injected once backend endpoints expose the
          payment intents. For now this card serves as a layout contract.
        </p>
      </div>
    </div>
  );
}
