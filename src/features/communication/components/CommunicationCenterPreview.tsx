import { useEffect, useState } from 'react';
import type { MessageThread } from '../types';
import { communicationApi } from '../api';

export function CommunicationCenterPreview() {
  const [threads, setThreads] = useState<MessageThread[]>([]);

  useEffect(() => {
    communicationApi.listThreads().then(setThreads).catch(() => setThreads([]));
  }, []);

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <p className="text-sm text-muted-foreground">Messages</p>
      <p className="text-2xl font-semibold">{threads.length}</p>
    </div>
  );
}
