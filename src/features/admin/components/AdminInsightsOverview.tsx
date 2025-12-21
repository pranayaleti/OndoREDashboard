import { useEffect, useState } from 'react';
import type { AdminMetric } from '../types';
import { adminFeatureApi } from '../api';

export function AdminInsightsOverview() {
  const [metrics, setMetrics] = useState<AdminMetric[]>([]);

  useEffect(() => {
    adminFeatureApi.getMetrics().then(setMetrics).catch(() => setMetrics([]));
  }, []);

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <p className="text-sm text-muted-foreground">Platform Metrics</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {metrics.slice(0, 4).map((metric) => (
          <div key={metric.label}>
            <p className="text-xs uppercase text-muted-foreground">{metric.label}</p>
            <p className="text-xl font-semibold">{metric.value}</p>
          </div>
        ))}
        {metrics.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Metrics will populate once admin endpoints are wired.
          </p>
        )}
      </div>
    </div>
  );
}
