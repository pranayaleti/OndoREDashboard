import { useMemo } from 'react';
import { screeningApi } from '../api';

export function useScreeningFeature() {
  return useMemo(() => ({
    listRequests: screeningApi.listRequests,
    createRequest: screeningApi.createRequest,
    sendScreeningLink: screeningApi.sendScreeningLink,
    fetchReportMetadata: screeningApi.fetchReportMetadata,
  }), []);
}
