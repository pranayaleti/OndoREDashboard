import type { AdminMetric, RoleAssignment } from '../types';

export interface AdminFeatureState {
  metrics: AdminMetric[];
  roleAssignments: RoleAssignment[];
}

export const initialAdminFeatureState: AdminFeatureState = {
  metrics: [],
  roleAssignments: [],
};
