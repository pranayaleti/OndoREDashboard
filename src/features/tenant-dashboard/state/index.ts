import type { LeaseDocument, MaintenanceRequest, RentReceipt, RentSchedule } from '../types';

export interface TenantDashboardState {
  rentSchedule: RentSchedule[];
  receipts: RentReceipt[];
  maintenanceTickets: MaintenanceRequest[];
  leases: LeaseDocument[];
}

export const initialTenantDashboardState: TenantDashboardState = {
  rentSchedule: [],
  receipts: [],
  maintenanceTickets: [],
  leases: [],
};
