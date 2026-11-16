import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@ondo/types";

/**
 * Owner Portfolio clients must call the routes the Supabase Edge API actually
 * mounts (OndoREBackend/supabase/functions/api/index.ts). Every assertion pins
 * the exact production method + path.
 */
const apiRequest = vi.fn();

vi.mock("../http", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("../http");
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequest(...args),
    getAuthHeaders: () => ({ Authorization: "Bearer test" }),
  };
});

const { featureApi, isEdgeUnavailableError } = await import("./feature-api");

type Route = { method: string; path: string; body?: unknown };

/** Route table for the mocked apiRequest: `${METHOD} ${path}` → response. */
function respondWith(table: Record<string, unknown>) {
  apiRequest.mockImplementation((method: string, path: string) => {
    const key = `${method} ${path}`;
    if (key in table) return Promise.resolve(table[key]);
    return Promise.reject(new Error(`unexpected ${key}`));
  });
}

function calls(): Route[] {
  return apiRequest.mock.calls.map(([method, path, body]) => ({ method, path, body }));
}

beforeEach(() => {
  apiRequest.mockReset();
});

describe("featureApi.rentPayments (Edge /rent-schedules)", () => {
  it("getSchedule reads the caller's schedule or a property's schedule", async () => {
    respondWith({
      "GET /rent-schedules/my-schedule": { data: [{ tenantId: "t1", propertyId: "p1", amountCents: 150000, dueDate: "2026-11-01" }] },
      "GET /rent-schedules/property/p1": { data: [] },
    });

    const mine = await featureApi.rentPayments.getSchedule();
    await featureApi.rentPayments.getSchedule("p1");

    expect(calls().map((c) => `${c.method} ${c.path}`)).toEqual([
      "GET /rent-schedules/my-schedule",
      "GET /rent-schedules/property/p1",
    ]);
    expect(mine[0]).toMatchObject({ monthlyAmount: 1500, dueDay: 1, upcomingDueDates: ["2026-11-01"] });
  });

  it("getPortfolioSchedules fans out over GET /properties and groups per tenancy", async () => {
    respondWith({
      "GET /properties?page=1&limit=100": { data: [{ id: "p1" }, { id: "p2" }] },
      "GET /rent-schedules/property/p1": {
        data: [
          { tenantId: "t1", propertyId: "p1", amountCents: 200000, dueDate: "2026-10-01", status: "paid" },
          { tenantId: "t1", propertyId: "p1", amountCents: 200000, dueDate: "2026-12-01", status: "upcoming" },
          { tenantId: "t1", propertyId: "p1", amountCents: 200000, dueDate: "2026-11-01", status: "due", lateFeeCents: 5000 },
        ],
      },
      "GET /rent-schedules/property/p2": {
        data: [{ tenantId: "t2", propertyId: "p2", amountCents: 100000, dueDate: "2026-09-01", status: "paid" }],
      },
    });

    const schedules = await featureApi.rentPayments.getPortfolioSchedules();

    expect(calls().map((c) => `${c.method} ${c.path}`)).toEqual([
      "GET /properties?page=1&limit=100",
      "GET /rent-schedules/property/p1",
      "GET /rent-schedules/property/p2",
    ]);
    expect(schedules).toHaveLength(1);
    expect(schedules[0]).toMatchObject({
      tenantId: "t1",
      propertyId: "p1",
      monthlyAmount: 2000,
      lateFee: 50,
      nextChargeDate: "2026-11-01",
      upcomingDueDates: ["2026-11-01", "2026-12-01"],
      autopayEnabled: false,
    });
  });

  it("keeps the widget alive when one property's schedules are forbidden", async () => {
    apiRequest.mockImplementation((_method: string, path: string) => {
      if (path.startsWith("/properties")) return Promise.resolve({ data: [{ id: "p1" }, { id: "p2" }] });
      if (path.endsWith("/p1")) return Promise.reject(new ApiError("Access denied", 403));
      return Promise.resolve({ data: [{ tenantId: "t2", propertyId: "p2", amountCents: 1, dueDate: "2026-11-05", status: "upcoming" }] });
    });

    const schedules = await featureApi.rentPayments.getPortfolioSchedules();
    expect(schedules.map((s) => s.propertyId)).toEqual(["p2"]);
  });

  it("fails instead of under-counting when one property's schedules error out", async () => {
    apiRequest.mockImplementation((_method: string, path: string) => {
      if (path.startsWith("/properties")) return Promise.resolve({ data: [{ id: "p1" }, { id: "p2" }] });
      if (path.endsWith("/p1")) return Promise.reject(new ApiError("Token refresh failed", 500));
      return Promise.resolve({ data: [{ tenantId: "t2", propertyId: "p2", amountCents: 1, dueDate: "2026-11-05", status: "upcoming" }] });
    });

    await expect(featureApi.rentPayments.getPortfolioSchedules()).rejects.toMatchObject({ status: 500 });
  });

  it("treats waived months like paid ones", async () => {
    respondWith({
      "GET /properties?page=1&limit=100": { data: [{ id: "p1" }] },
      "GET /rent-schedules/property/p1": {
        data: [
          { tenantId: "t1", propertyId: "p1", amountCents: 200000, dueDate: "2026-10-01", status: "waived" },
          { tenantId: "t1", propertyId: "p1", amountCents: 200000, dueDate: "2026-11-01", status: "upcoming" },
          { tenantId: "t2", propertyId: "p1", amountCents: 90000, dueDate: "2026-09-01", status: "waived" },
        ],
      },
    });

    const schedules = await featureApi.rentPayments.getPortfolioSchedules();

    expect(schedules).toHaveLength(1);
    expect(schedules[0]).toMatchObject({ tenantId: "t1", nextChargeDate: "2026-11-01", upcomingDueDates: ["2026-11-01"] });
  });

  it("keeps at most four per-property requests in flight", async () => {
    const ids = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}` }));
    let inFlight = 0;
    let peak = 0;
    apiRequest.mockImplementation(async (_method: string, path: string) => {
      if (path.startsWith("/properties")) return { data: ids };
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return { data: [] };
    });

    await featureApi.rentPayments.getPortfolioSchedules();

    expect(apiRequest).toHaveBeenCalledTimes(13);
    expect(peak).toBeLessThanOrEqual(4);
  });

  it("listPayments / listReceipts / getLandlordStatements hit existing Edge routes", async () => {
    respondWith({
      "GET /dashboard/payments?page=1&limit=100": { data: [{ id: "pay1", amountCents: 12345, status: "succeeded", propertyId: "p1", userId: "t1" }] },
      "GET /tenant/receipts": { data: [] },
      "GET /owner-statements": { data: [] },
    });

    const payments = await featureApi.rentPayments.listPayments({});
    await featureApi.rentPayments.listReceipts();
    await featureApi.rentPayments.getLandlordStatements();

    expect(calls().map((c) => `${c.method} ${c.path}`)).toEqual([
      "GET /dashboard/payments?page=1&limit=100",
      "GET /tenant/receipts",
      "GET /owner-statements",
    ]);
    expect(payments[0]).toMatchObject({ id: "pay1", amount: 123.45, status: "succeeded" });
  });

  it("updateSchedule / toggleAutopay / createPayment reject as unavailable without a request", async () => {
    const results = await Promise.allSettled([
      featureApi.rentPayments.updateSchedule("s1", { dueDay: 5 }),
      featureApi.rentPayments.toggleAutopay({ scheduleId: "s1", enabled: true }),
      featureApi.rentPayments.createPayment("s1", 100),
    ]);

    for (const result of results) {
      expect(result.status).toBe("rejected");
      expect(isEdgeUnavailableError((result as PromiseRejectedResult).reason)).toBe(true);
    }
    expect(apiRequest).not.toHaveBeenCalled();
  });
});

describe("featureApi.leaseManagement (Edge /leases + /lease-templates)", () => {
  it("listTemplates maps GET /lease-templates rows (merge tokens → fields)", async () => {
    respondWith({
      "GET /lease-templates": {
        data: [{ id: "lt1", name: "Utah lease", state: "UT", description: null, body: "Rent {{monthly_rent}} due {{ due_day }} / {{monthly_rent}}" }],
      },
    });

    const templates = await featureApi.leaseManagement.listTemplates();

    expect(calls()).toEqual([{ method: "GET", path: "/lease-templates", body: undefined }]);
    expect(templates[0]).toMatchObject({
      id: "lt1",
      name: "Utah lease",
      jurisdiction: "UT",
      fields: [
        { key: "monthly_rent", label: "Monthly rent", type: "text", required: true },
        { key: "due_day", label: "Due day", type: "text", required: true },
      ],
    });
  });

  it("createTemplate POSTs /lease-templates with a body built from fields", async () => {
    respondWith({
      "POST /lease-templates": { data: { id: "lt2", name: "Addendum", state: null, body: "Pet fee: {{pet_fee}}" } },
    });

    const created = await featureApi.leaseManagement.createTemplate({
      id: "",
      name: "Addendum",
      jurisdiction: "Generic",
      fields: [{ key: "pet_fee", label: "Pet fee", type: "number" }],
    });

    expect(calls()).toEqual([
      {
        method: "POST",
        path: "/lease-templates",
        body: { name: "Addendum", body: "Pet fee: {{pet_fee}}", state: null, description: null },
      },
    ]);
    expect(created).toMatchObject({ id: "lt2", jurisdiction: "Generic", fields: [{ key: "pet_fee" }] });
  });

  it("generateFromTemplate POSTs /lease-templates/:id/render with { data }", async () => {
    respondWith({
      "POST /lease-templates/lt1/render": { data: { text: "Rent 1500", missing: [] } },
    });

    const doc = await featureApi.leaseManagement.generateFromTemplate("lt1", { monthly_rent: 1500, propertyId: "p1" });

    expect(calls()).toEqual([
      { method: "POST", path: "/lease-templates/lt1/render", body: { data: { monthly_rent: 1500, propertyId: "p1" } } },
    ]);
    expect(doc).toMatchObject({ templateId: "lt1", propertyId: "p1", status: "draft" });
    expect(doc.downloadUrl).toBe("data:text/plain;charset=utf-8,Rent%201500");
  });

  it("listLeases reads GET /properties/:id/leases for each visible property", async () => {
    respondWith({
      "GET /properties?page=1&limit=100": { data: [{ id: "p1" }] },
      "GET /properties/p1/leases": {
        data: [
          { id: "l1", propertyId: "p1", tenantId: "t1", ownerId: "o1", status: "active", leaseStart: "2026-01-01", leaseEnd: "2026-12-31", createdAt: "2025-12-01" },
          { id: "l2", propertyId: "p1", tenantId: "t2", ownerId: "o1", status: "partially_signed", createdAt: "2026-10-01" },
          { id: "l3", propertyId: "p1", tenantId: "t3", ownerId: "o1", status: "draft", createdAt: "2026-10-02" },
        ],
      },
    });

    const leases = await featureApi.leaseManagement.listLeases();

    expect(calls().map((c) => `${c.method} ${c.path}`)).toEqual([
      "GET /properties?page=1&limit=100",
      "GET /properties/p1/leases",
    ]);
    expect(leases.map((l) => l.status)).toEqual(["active", "pending_signature", "draft"]);
    expect(leases[0]).toMatchObject({ effectiveDate: "2026-01-01", expirationDate: "2026-12-31", tenantId: "t1" });
  });

  it("listLeases with propertyId + status skips the property lookup and filters", async () => {
    respondWith({
      "GET /properties/p9/leases": { data: [{ id: "l1", status: "active" }, { id: "l2", status: "draft" }] },
    });

    const leases = await featureApi.leaseManagement.listLeases({ propertyId: "p9", status: "draft" });

    expect(calls().map((c) => `${c.method} ${c.path}`)).toEqual(["GET /properties/p9/leases"]);
    expect(leases.map((l) => l.id)).toEqual(["l2"]);
  });

  it("listMyLeases reads GET /leases/my (null → empty)", async () => {
    respondWith({ "GET /leases/my": { data: null } });
    await expect(featureApi.leaseManagement.listMyLeases()).resolves.toEqual([]);
    expect(calls().map((c) => `${c.method} ${c.path}`)).toEqual(["GET /leases/my"]);
  });

  it("sendForSignature POSTs /leases/:id/send-for-signature", async () => {
    respondWith({
      "POST /leases/l3/send-for-signature": {
        data: { id: "l3", status: "pending_signature", esignProvider: "mock", esignExternalId: "env-1", updatedAt: "2026-10-21T00:00:00Z" },
      },
    });

    const esign = await featureApi.leaseManagement.sendForSignature("l3");

    expect(calls().map((c) => `${c.method} ${c.path}`)).toEqual(["POST /leases/l3/send-for-signature"]);
    expect(esign).toMatchObject({ id: "env-1", documentId: "l3", provider: "mock", status: "sent" });
  });

  it("uploadLease rejects as unavailable without a request", async () => {
    const err = await featureApi.leaseManagement.uploadLease({}).catch((e: unknown) => e);
    expect(isEdgeUnavailableError(err)).toBe(true);
    expect(apiRequest).not.toHaveBeenCalled();
  });
});

describe("featureApi.communication (Edge /communication + /notifications)", () => {
  const threads = [
    { id: "th1", subject: "a", status: "open", priority: "high", category: "general", createdAt: "2026-10-01", participants: [], unreadCount: 0 },
    { id: "th2", subject: "b", status: "closed", priority: "normal", category: "billing", createdAt: "2026-10-02", participants: [], unreadCount: 1 },
  ];

  it("listThreads calls GET /communication/threads without query params and filters client-side", async () => {
    respondWith({ "GET /communication/threads": { data: threads } });

    const filtered = await featureApi.communication.listThreads({ status: "open", priority: "high" });
    const all = await featureApi.communication.listThreads();

    expect(calls().map((c) => `${c.method} ${c.path}`)).toEqual([
      "GET /communication/threads",
      "GET /communication/threads",
    ]);
    expect(filtered.map((t) => t.id)).toEqual(["th1"]);
    expect(all).toHaveLength(2);
  });

  it("getThread resolves from the participant-scoped thread list", async () => {
    respondWith({ "GET /communication/threads": { data: threads } });
    await expect(featureApi.communication.getThread("th2")).resolves.toMatchObject({ id: "th2" });
    await expect(featureApi.communication.getThread("missing")).rejects.toMatchObject({ status: 404 });
  });

  it("thread CRUD + messages use the Edge communication routes", async () => {
    respondWith({
      "POST /communication/threads": { data: { id: "th3" } },
      "PATCH /communication/threads/th3": { data: { id: "th3", status: "closed" } },
      "GET /communication/threads/th3/messages?page=2": { data: [] },
      "POST /communication/threads/th3/messages": { data: { id: "m1" } },
      "PATCH /communication/threads/th3/read": { message: "ok" },
    });

    await featureApi.communication.createThread({ subject: "Hi", propertyId: "p1" });
    await featureApi.communication.updateThread("th3", { status: "closed" });
    await featureApi.communication.listMessages("th3", 2);
    await featureApi.communication.sendMessage({ threadId: "th3", body: "hello" });
    await featureApi.communication.markRead("th3");

    expect(calls().map((c) => `${c.method} ${c.path}`)).toEqual([
      "POST /communication/threads",
      "PATCH /communication/threads/th3",
      "GET /communication/threads/th3/messages?page=2",
      "POST /communication/threads/th3/messages",
      "PATCH /communication/threads/th3/read",
    ]);
  });

  it("updatePreferences PUTs /notifications/preferences with per-channel booleans", async () => {
    respondWith({
      "PUT /notifications/preferences": { emailEnabled: true, smsEnabled: false, pushEnabled: true },
    });

    const prefs = await featureApi.communication.updatePreferences([
      { channel: "email", enabled: true },
      { channel: "sms", enabled: false },
    ]);

    expect(calls()).toEqual([
      { method: "PUT", path: "/notifications/preferences", body: { emailEnabled: true, smsEnabled: false } },
    ]);
    expect(prefs).toEqual([
      { channel: "email", enabled: true },
      { channel: "sms", enabled: false },
      { channel: "in_app", enabled: true },
    ]);
  });

  it("addParticipant / listTemplates / createTemplate reject as unavailable without a request", async () => {
    const results = await Promise.allSettled([
      featureApi.communication.addParticipant("th1", "u1"),
      featureApi.communication.listTemplates(),
      featureApi.communication.createTemplate({ title: "t", body: "b", quickReplies: [], isPublic: false }),
    ]);
    for (const result of results) {
      expect(isEdgeUnavailableError((result as PromiseRejectedResult).reason)).toBe(true);
    }
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
