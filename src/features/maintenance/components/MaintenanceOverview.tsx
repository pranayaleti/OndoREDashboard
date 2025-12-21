import { useEffect, useState } from 'react';
import type { MaintenanceRequest } from '../types';
import { maintenanceFeatureApi } from '../api';

export function MaintenanceOverview() {
  const [openTickets, setOpenTickets] = useState<MaintenanceRequest[]>([]);

  useEffect(() => {
    maintenanceFeatureApi
      .getManagerMaintenanceRequests()
      .then((requests) => {
        setOpenTickets(requests.filter((ticket) => ticket.status !== 'completed'));
      })
      .catch(() => setOpenTickets([]));
  }, []);

  const highPriority = openTickets.filter((ticket) => ticket.priority === 'high' || ticket.priority === 'emergency').length;

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Open Maintenance Tickets</p>
          <p className="text-2xl font-semibold">{openTickets.length}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">High Priority</p>
          <p className="text-lg font-medium">{highPriority}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Vendor assignment and notifications will hook into Twilio/Email once the
        backend exposes vendor endpoints.
      </p>
    </div>
  );
}
