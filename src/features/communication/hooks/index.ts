import { useMemo } from 'react';
import { communicationApi } from '../api';

export function useCommunicationFeature() {
  return useMemo(() => ({
    listThreads: communicationApi.listThreads,
    listMessages: communicationApi.listMessages,
    sendMessage: communicationApi.sendMessage,
    updatePreferences: communicationApi.updatePreferences,
    triggerNotification: communicationApi.triggerNotification,
  }), []);
}
