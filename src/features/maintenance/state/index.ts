import type { MaintenanceRequest } from '../types';

export interface MaintenanceFeatureState {
  tenantRequests: MaintenanceRequest[];
  managerRequests: MaintenanceRequest[];
}

export const initialMaintenanceState: MaintenanceFeatureState = {
  tenantRequests: [],
  managerRequests: [],
};
