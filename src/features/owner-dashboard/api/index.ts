import { authApi, featureApi, propertyApi } from '@/lib/api';

export const ownerDashboardApi = {
  getPortfolio: authApi.getPortfolioStats,
  getTenants: propertyApi.getOwnerTenants,
  listScreeningRequests: featureApi.screening.listRequests,
  listRentPayments: featureApi.rentPayments.listPayments,
  listMaintenanceTickets: featureApi.maintenance.getManagerMaintenanceRequests,
  listLeases: featureApi.leaseManagement.listLeases,
};
