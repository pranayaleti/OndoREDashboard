import { useMemo } from 'react';
import { communicationApi } from '../api';

export function useCommunicationFeature() {
  return useMemo(() => ({
    listThreads: communicationApi.listThreads,
    getThread: communicationApi.getThread,
    createThread: communicationApi.createThread,
    updateThread: communicationApi.updateThread,
    listMessages: communicationApi.listMessages,
    sendMessage: communicationApi.sendMessage,
    markRead: communicationApi.markRead,
    addParticipant: communicationApi.addParticipant,
    listTemplates: communicationApi.listTemplates,
    createTemplate: communicationApi.createTemplate,
    updatePreferences: communicationApi.updatePreferences,
  }), []);
}
