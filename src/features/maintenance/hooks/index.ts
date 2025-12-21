import { useMemo } from 'react';
import { maintenanceFeatureApi } from '../api';

export function useMaintenanceFeature() {
  return useMemo(() => ({
    createRequest: maintenanceFeatureApi.createMaintenanceRequest,
    getTenantRequests: maintenanceFeatureApi.getTenantMaintenanceRequests,
    getManagerRequests: maintenanceFeatureApi.getManagerMaintenanceRequests,
    updateRequest: maintenanceFeatureApi.updateMaintenanceRequest,
  }), []);
}
