import type { MessageRecord, MessageThread, NotificationPreference } from '../types';

export interface CommunicationState {
  threads: MessageThread[];
  activeThreadId?: string;
  messages: Record<string, MessageRecord[]>;
  preferences: NotificationPreference[];
}

export const initialCommunicationState: CommunicationState = {
  threads: [],
  activeThreadId: undefined,
  messages: {},
  preferences: [],
};
