import { useMemo } from 'react';
import { leaseManagementApi } from '../api';

export function useLeaseManagementFeature() {
  return useMemo(() => ({
    listTemplates: leaseManagementApi.listTemplates,
    createTemplate: leaseManagementApi.createTemplate,
    generateFromTemplate: leaseManagementApi.generateFromTemplate,
    uploadLease: leaseManagementApi.uploadLease,
    listLeases: leaseManagementApi.listLeases,
    listMyLeases: leaseManagementApi.listMyLeases,
    sendForSignature: leaseManagementApi.sendForSignature,
  }), []);
}
