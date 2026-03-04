import { useMemo } from 'react';
import { adminFeatureApi } from '../api';

export function useAdminFeature() {
  return useMemo(() => ({
    getMetrics: adminFeatureApi.getMetrics,
    listRoleAssignments: adminFeatureApi.listRoleAssignments,
    updateRoleAssignment: adminFeatureApi.updateRoleAssignment,
  }), []);
}
