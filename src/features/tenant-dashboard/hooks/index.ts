import { useEffect, useState } from 'react';
import type { LeaseDocument, MaintenanceRequest, RentReceipt, RentSchedule } from '../types';
import { tenantDashboardApi } from '../api';

export interface TenantDashboardData {
  rentSchedule: RentSchedule[];
  receipts: RentReceipt[];
  maintenanceTickets: MaintenanceRequest[];
  leases: LeaseDocument[];
}

export function useTenantDashboardData() {
  const [data, setData] = useState<TenantDashboardData>({
    rentSchedule: [],
    receipts: [],
    maintenanceTickets: [],
    leases: [],
  });

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      tenantDashboardApi.getRentSchedule(),
      tenantDashboardApi.listReceipts(),
      tenantDashboardApi.listMaintenanceTickets(),
      tenantDashboardApi.listLeases(),
    ])
      .then(([schedule, receipts, maintenance, leases]) => {
        if (isMounted) {
          setData({
            rentSchedule: schedule,
            receipts,
            maintenanceTickets: maintenance,
            leases,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setData((prev) => ({ ...prev }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return data;
}
