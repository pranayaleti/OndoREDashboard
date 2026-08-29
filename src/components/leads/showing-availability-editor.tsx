import { useEffect, useState } from "react";
import { propertyApi, type ListingAvailabilityRules, type ListingAvailabilitySlot } from "@/lib/api/clients/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
] as const;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EMPTY_RULES: Omit<ListingAvailabilityRules, "propertyId" | "updatedAt"> = {
  timezone: "America/Chicago",
  daysOfWeek: [1, 2, 3, 4, 5],
  startTime: "09:00",
  endTime: "17:00",
  durationMinutes: 30,
  bufferMinutes: 15,
  leadTimeHours: 24,
  blackoutDates: [],
  tourType: "in_person",
};

interface Props {
  propertyId: string;
  propertyStatus: string;
}

export function ShowingAvailabilityEditor({ propertyId, propertyStatus }: Props) {
  const vacant = propertyStatus === "approved";
  const occupied = propertyStatus === "occupied";
  const [rules, setRules] = useState(EMPTY_RULES);
  const [slots, setSlots] = useState<ListingAvailabilitySlot[]>([]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [count, setCount] = useState(10);
  const [blackoutInput, setBlackoutInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const existing = await propertyApi.getShowingAvailability(propertyId);
      if (existing) {
        setRules({
          timezone: existing.timezone,
          daysOfWeek: existing.daysOfWeek,
          startTime: existing.startTime,
          endTime: existing.endTime,
          durationMinutes: existing.durationMinutes,
          bufferMinutes: existing.bufferMinutes,
          leadTimeHours: existing.leadTimeHours,
          blackoutDates: existing.blackoutDates,
          tourType: existing.tourType,
        });
      }
      const list = await propertyApi.listShowingSlots(propertyId, true);
      setSlots(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load showing availability.");
    }
  };

  useEffect(() => {
    void load();
  }, [propertyId]);

  const saveRules = async () => {
    setLoading(true);
    setError(null);
    try {
      await propertyApi.putShowingAvailability(propertyId, rules);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save availability.");
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      await propertyApi.generateShowingSlots(propertyId, { startDate, count });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate windows.");
    } finally {
      setLoading(false);
    }
  };

  const removeSlot = async (slotId: string) => {
    setLoading(true);
    setError(null);
    try {
      await propertyApi.deleteShowingSlot(propertyId, slotId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete window.");
    } finally {
      setLoading(false);
    }
  };

  const expirePast = async () => {
    setLoading(true);
    setError(null);
    try {
      await propertyApi.expirePastShowingSlots(propertyId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not expire past windows.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setRules((prev) => {
      const has = prev.daysOfWeek.includes(day);
      const next = has ? prev.daysOfWeek.filter((d) => d !== day) : [...prev.daysOfWeek, day].sort();
      return { ...prev, daysOfWeek: next.length ? next : prev.daysOfWeek };
    });
  };

  if (occupied) {
    return (
      <p className="text-sm text-gray-600">
        This unit is occupied. Propose 1–3 visit times from the lead inbox instead of a public calendar.
      </p>
    );
  }

  if (!vacant) {
    return (
      <p className="text-sm text-gray-600">
        Showing windows can be generated after this listing is approved.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm">
          Timezone
          <select
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={rules.timezone}
            onChange={(e) => setRules((r) => ({ ...r, timezone: e.target.value }))}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Tour type
          <select
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={rules.tourType}
            onChange={(e) =>
              setRules((r) => ({ ...r, tourType: e.target.value as "in_person" | "virtual" }))
            }
          >
            <option value="in_person">In person</option>
            <option value="virtual">Virtual</option>
          </select>
        </label>
        <label className="text-sm">
          Start
          <Input type="time" value={rules.startTime} onChange={(e) => setRules((r) => ({ ...r, startTime: e.target.value }))} />
        </label>
        <label className="text-sm">
          End
          <Input type="time" value={rules.endTime} onChange={(e) => setRules((r) => ({ ...r, endTime: e.target.value }))} />
        </label>
        <label className="text-sm">
          Duration (minutes)
          <Input
            type="number"
            min={15}
            max={240}
            value={rules.durationMinutes}
            onChange={(e) => setRules((r) => ({ ...r, durationMinutes: Number(e.target.value) }))}
          />
        </label>
        <label className="text-sm">
          Buffer (minutes)
          <Input
            type="number"
            min={0}
            max={120}
            value={rules.bufferMinutes}
            onChange={(e) => setRules((r) => ({ ...r, bufferMinutes: Number(e.target.value) }))}
          />
        </label>
        <label className="text-sm">
          Lead time (hours)
          <Input
            type="number"
            min={0}
            max={168}
            value={rules.leadTimeHours}
            onChange={(e) => setRules((r) => ({ ...r, leadTimeHours: Number(e.target.value) }))}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {DAY_LABELS.map((label, day) => (
          <button
            key={label}
            type="button"
            onClick={() => toggleDay(day)}
            className={`text-xs px-2 py-1 rounded border ${
              rules.daysOfWeek.includes(day) ? "bg-indigo-600 text-white" : "bg-background"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-end">
        <label className="text-sm flex-1">
          Blackout date
          <Input type="date" value={blackoutInput} onChange={(e) => setBlackoutInput(e.target.value)} />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!blackoutInput || rules.blackoutDates.includes(blackoutInput)) return;
            setRules((r) => ({ ...r, blackoutDates: [...r.blackoutDates, blackoutInput] }));
            setBlackoutInput("");
          }}
        >
          Add
        </Button>
      </div>
      {rules.blackoutDates.length > 0 ? (
        <ul className="text-xs text-gray-600 space-y-1">
          {rules.blackoutDates.map((d) => (
            <li key={d} className="flex justify-between">
              <span>{d}</span>
              <button
                type="button"
                className="text-red-600"
                onClick={() =>
                  setRules((r) => ({ ...r, blackoutDates: r.blackoutDates.filter((x) => x !== d) }))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Button type="button" onClick={() => void saveRules()} disabled={loading}>
        Save hours
      </Button>
      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm">
          Generate from
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="text-sm">
          Count
          <Input
            type="number"
            min={1}
            max={40}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <Button type="button" onClick={() => void generate()} disabled={loading}>
          Generate windows
        </Button>
        <Button type="button" variant="outline" onClick={() => void expirePast()} disabled={loading}>
          Expire past
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {slots.map((slot) => (
          <li key={slot.id} className="text-sm border rounded px-3 py-2 flex justify-between gap-2">
            <span>
              {new Date(slot.startsAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              {slot.isBooked ? " · Booked" : ""}
            </span>
            {!slot.isBooked ? (
              <button type="button" className="text-xs text-red-600" onClick={() => void removeSlot(slot.id)}>
                Delete
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
