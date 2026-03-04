import { useOwnerDashboardData } from '../hooks';

export function OwnerDashboardOverview() {
  const { portfolio, screening, maintenanceTickets, leases } = useOwnerDashboardData();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background p-4">
        <p className="text-sm text-muted-foreground">Portfolio Value</p>
        <p className="text-2xl font-semibold">{portfolio?.formattedPortfolioValue ?? '—'}</p>
        <p className="text-sm text-muted-foreground">{portfolio?.propertiesOwned ?? 0} properties</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs uppercase text-muted-foreground">Screening Pending</p>
          <p className="text-xl font-semibold">{screening.length}</p>
        </div>
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
