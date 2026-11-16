import { useEffect, useState } from 'react';
import type { RentPayment, RentSchedule } from '../types';
import { rentPaymentsApi } from '../api';

export function RentPaymentsOverview() {
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [schedulesLoaded, setSchedulesLoaded] = useState(false);
  const [recentPayments, setRecentPayments] = useState<RentPayment[]>([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);

  useEffect(() => {
    // A failed load stays N/A: showing 0 would claim there are no schedules or payments.
    rentPaymentsApi
      .getPortfolioSchedules()
      .then((result) => {
        setSchedules(result);
        setSchedulesLoaded(true);
      })
      .catch(() => setSchedules([]));
    rentPaymentsApi
      .listPayments({})
      .then((result) => {
        setRecentPayments(result.slice(0, 5));
        setPaymentsLoaded(true);
      })
      .catch(() => setRecentPayments([]));
  }, []);

  const nextDue = schedules
    .map((schedule) => schedule.nextChargeDate)
    .filter((date): date is string => Boolean(date))
    .sort()[0];

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Active Rent Schedules</p>
          <p className="text-2xl font-semibold">{schedulesLoaded ? schedules.length : 'N/A'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Next Rent Due</p>
            <p className="font-medium">
              {nextDue ? new Date(`${nextDue}T12:00:00Z`).toLocaleDateString() : 'N/A'}
            </p>
            {/* Auto-pay has no production endpoint yet (featureApi.rentPayments.toggleAutopay). */}
            <p className="text-xs text-muted-foreground mt-1">Auto-pay not available yet</p>
          </div>
          <div>
            <p className="text-muted-foreground">Recent Payments</p>
            <p className="font-medium">
              {paymentsLoaded ? recentPayments.length : 'N/A'}
            </p>
            {paymentsLoaded && recentPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">
                No payments recorded yet
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
