import type { ScreeningReportMetadata, ScreeningRequestPayload } from '../types';

export interface ScreeningFeatureState {
  requests: ScreeningRequestPayload[];
  selectedReport?: ScreeningReportMetadata | null;
  isLoading: boolean;
}

export const initialScreeningState: ScreeningFeatureState = {
  requests: [],
  selectedReport: null,
  isLoading: false,
};
