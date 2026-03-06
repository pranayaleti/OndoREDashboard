import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE";

interface UseRealtimeTableOptions {
  /** Supabase table name */
  table: string;
  /** Which events to listen for (default: all) */
  events?: PostgresEvent[];
  /** Optional filter column (e.g., 'manager_id') */
  filterColumn?: string;
  /** Optional filter value (e.g., the current user's ID) */
  filterValue?: string;
  /** Called when a matching change occurs — use to refetch or update local state */
  onEvent: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  /** Whether the subscription is active (default: true) */
  enabled?: boolean;
}

/**
 * Subscribe to Supabase Realtime Postgres changes for a table.
 *
 * Example usage:
 * ```ts
 * useRealtimeTable({
 *   table: "leads",
 *   events: ["INSERT"],
 *   filterColumn: "manager_id",
 *   filterValue: user.id,
 *   onEvent: () => refetchLeads(),
 * });
 * ```
 */
export function useRealtimeTable({
  table,
  events = ["INSERT", "UPDATE", "DELETE"],
  filterColumn,
  filterValue,
  onEvent,
  enabled = true,
}: UseRealtimeTableOptions): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!supabase || !enabled) return;

    const channelName = `realtime:${table}:${filterColumn ?? "all"}:${filterValue ?? "all"}`;

    const channel = supabase.channel(channelName);

    for (const event of events) {
      const filter = filterColumn && filterValue
        ? `${filterColumn}=eq.${filterValue}`
        : undefined;

      channel.on(
        "postgres_changes" as never,
        { event, schema: "public", table, filter } as never,
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          onEventRef.current(payload);
        },
      );
    }

    channel.subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [table, events.join(","), filterColumn, filterValue, enabled]);
}
