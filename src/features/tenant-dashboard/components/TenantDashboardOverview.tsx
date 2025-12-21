import { useTenantDashboardData } from '../hooks';

export function TenantDashboardOverview() {
  const { rentSchedule, receipts, maintenanceTickets, leases } = useTenantDashboardData();
  const nextDueDate = rentSchedule[0]?.nextChargeDate ?? rentSchedule[0]?.upcomingDueDates?.[0];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background p-4">
        <p className="text-sm text-muted-foreground">Next Rent Due</p>
        <p className="text-2xl font-semibold">{nextDueDate ? new Date(nextDueDate).toLocaleDateString() : '—'}</p>
        <p className="text-sm text-muted-foreground">Receipts: {receipts.length}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs uppercase text-muted-foreground">Open Maintenance</p>
          <p className="text-xl font-semibold">{maintenanceTickets.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs uppercase text-muted-foreground">Active Leases</p>
          <p className="text-xl font-semibold">{leases.length}</p>
        </div>
      </div>
    </div>
  );
}
