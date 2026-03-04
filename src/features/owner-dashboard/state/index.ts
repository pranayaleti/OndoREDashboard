import type { LeaseDocument, MaintenanceRequest, PortfolioStats, RentPayment, ScreeningRequestPayload } from '../types';

export interface OwnerDashboardState {
  portfolio?: PortfolioStats;
  screening: ScreeningRequestPayload[];
  rentPayments: RentPayment[];
  maintenanceTickets: MaintenanceRequest[];
  leases: LeaseDocument[];
}

export const initialOwnerDashboardState: OwnerDashboardState = {
  portfolio: undefined,
  screening: [],
  rentPayments: [],
  maintenanceTickets: [],
  leases: [],
};
