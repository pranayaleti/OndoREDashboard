import { featureApi, propertyApi } from '@/lib/api';

export const tenantDashboardApi = {
  getAssignedProperty: propertyApi.getTenantProperty,
  getRentSchedule: featureApi.rentPayments.getSchedule,
  listReceipts: featureApi.rentPayments.listReceipts,
  listMaintenanceTickets: featureApi.maintenance.getTenantMaintenanceRequests,
  listLeases: featureApi.leaseManagement.listLeases,
};
