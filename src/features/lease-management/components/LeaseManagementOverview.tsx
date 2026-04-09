import { useEffect, useState } from 'react';
import type { LeaseDocument } from '../types';
import { leaseManagementApi } from '../api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileSignature, Loader2 } from 'lucide-react';

export function LeaseManagementOverview() {
  const { toast } = useToast();
  const [leases, setLeases] = useState<LeaseDocument[]>([]);
  const [signingId, setSigningId] = useState<string | null>(null);

  useEffect(() => {
    leaseManagementApi.listLeases().then(setLeases).catch(() => setLeases([]));
  }, []);

  const expiringSoon = leases.filter((lease) => {
    if (!lease.expirationDate) return false;
    const expires = new Date(lease.expirationDate).getTime();
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;
    return expires - Date.now() < thirtyDays;
  }).length;

  const handleSendForSignature = async (lease: LeaseDocument) => {
    setSigningId(lease.id);
    try {
      await leaseManagementApi.sendForSignature(lease.id);
      setLeases((prev) =>
        prev.map((l) => (l.id === lease.id ? { ...l, status: 'pending_signature' } : l))
      );
      toast({ title: 'Sent for signature', description: 'The tenant has been notified.' });
    } catch {
      toast({ title: 'Failed to send', description: 'Could not send for signature. Try again.', variant: 'destructive' });
    } finally {
      setSigningId(null);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-background p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Active Leases</p>
          <p className="text-2xl font-semibold">{leases.length}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Expiring &lt; 30 days</p>
          <p className="text-lg font-medium text-amber-600">{expiringSoon}</p>
        </div>
      </div>

      {leases.length > 0 && (
        <div className="space-y-2">
          {leases.slice(0, 5).map((lease) => (
            <div key={lease.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <div>
                <span className="font-medium capitalize">{lease.status.replace('_', ' ')}</span>
                {lease.expirationDate && (
                  <span className="ml-2 text-muted-foreground">
                    · expires {new Date(lease.expirationDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              {lease.status === 'draft' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={signingId === lease.id}
                  onClick={() => handleSendForSignature(lease)}
                >
                  {signingId === lease.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <FileSignature className="h-3 w-3 mr-1" />
                  )}
                  Send for Signature
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
