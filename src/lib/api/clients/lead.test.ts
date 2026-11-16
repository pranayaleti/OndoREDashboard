import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The manager dashboard's lead-status dropdown (property leads from getManagerLeads)
 * calls PATCH /leads/:id/status. Both backends answer `{ message, lead }`.
 */
const apiPatch = vi.fn();

vi.mock("../http", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("../http");
  return {
    ...actual,
    apiPatch: (...args: unknown[]) => apiPatch(...args),
    getAuthHeaders: () => ({ Authorization: "Bearer test" }),
  };
});

const { leadApi } = await import("./lead");

beforeEach(() => {
  apiPatch.mockReset();
});

describe("leadApi.updateLeadStatus", () => {
  it("PATCHes the property lead and returns the updated lead, not the envelope", async () => {
    apiPatch.mockResolvedValue({
      message: "Lead status updated successfully",
      lead: {
        id: "lead-1",
        kind: "property",
        name: "Riley Renter",
        email: "riley@example.com",
        phone: "555-0100",
        message: null,
        status: "contacted",
        source: "website",
        propertyId: "prop-1",
        propertyTitle: "Maple Duplex",
        propertyAddress: "1 Maple St",
        propertyCity: "Provo",
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-27T00:00:00Z",
      },
    });

    const lead = await leadApi.updateLeadStatus("lead-1", "contacted");

    expect(apiPatch).toHaveBeenCalledWith(
      "/leads/lead-1/status",
      { status: "contacted" },
      { Authorization: "Bearer test" },
    );
    expect(lead).toMatchObject({
      id: "lead-1",
      status: "contacted",
      tenantName: "Riley Renter",
      tenantEmail: "riley@example.com",
      propertyId: "prop-1",
    });
  });
});
