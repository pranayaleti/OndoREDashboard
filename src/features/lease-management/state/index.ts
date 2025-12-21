import type { ESignRequest, LeaseDocument, LeaseTemplate } from '../types';

export interface LeaseManagementState {
  templates: LeaseTemplate[];
  leases: LeaseDocument[];
  pendingESign?: ESignRequest | null;
}

export const initialLeaseManagementState: LeaseManagementState = {
  templates: [],
  leases: [],
  pendingESign: null,
};
