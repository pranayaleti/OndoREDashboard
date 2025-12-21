import { useEffect, useState } from 'react';
import type { ScreeningRequestPayload } from '../types';
import { screeningApi } from '../api';

export function ScreeningOverview() {
  const [requests, setRequests] = useState<ScreeningRequestPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    screeningApi
      .listRequests()
      .then((result) => {
        if (isMounted) {
          setRequests(result);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRequests([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Screening Requests</p>
          <p className="text-2xl font-semibold">{isLoading ? '—' : requests.length}</p>
        </div>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Tenant Screening
        </span>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Surface SmartMove / Checkr statuses once the backend integrations are ready.
      </p>
    </div>
  );
}
