import { useEffect, useState } from 'react';
import type { LeaseDocument, MaintenanceRequest, PortfolioStats, RentPayment, ScreeningRequestPayload } from '../types';
import { ownerDashboardApi } from '../api';

export interface OwnerDashboardData {
  portfolio?: PortfolioStats;
  screening: ScreeningRequestPayload[];
  rentPayments: RentPayment[];
  maintenanceTickets: MaintenanceRequest[];
  leases: LeaseDocument[];
}

export function useOwnerDashboardData() {
  const [data, setData] = useState<OwnerDashboardData>({
    portfolio: undefined,
    screening: [],
    rentPayments: [],
    maintenanceTickets: [],
    leases: [],
  });

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      ownerDashboardApi.getPortfolio(),
      ownerDashboardApi.listScreeningRequests(),
      ownerDashboardApi.listRentPayments({}),
      ownerDashboardApi.listMaintenanceTickets(),
      ownerDashboardApi.listLeases(),
    ])
      .then(([portfolio, screening, payments, maintenance, leases]) => {
        if (isMounted) {
          setData({
            // Owner dashboard: token is owner; API returns owner portfolio shape.
            portfolio: portfolio as PortfolioStats,
            screening,
            rentPayments: payments,
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
