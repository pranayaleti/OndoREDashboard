import { describe, expect, it } from "vitest"
import {
  disclosureRulesFromUnknown,
  groupLeasePacketDocuments,
  parseWatchForDescription,
} from "./lease-packet"

describe("parseWatchForDescription", () => {
  it("returns bullets after the WATCH_FOR marker", () => {
    expect(
      parseWatchForDescription("Intro paragraph.\n\nWATCH_FOR:\n- First item\n- Second item"),
    ).toEqual(["First item", "Second item"])
  })

  it("returns trimmed lines when the marker is missing", () => {
    expect(parseWatchForDescription("- Only bullet\n")).toEqual(["Only bullet"])
  })
})

describe("disclosureRulesFromUnknown", () => {
  it("keeps disclosure rules and drops other types or malformed rows", () => {
    expect(
      disclosureRulesFromUnknown([
        { id: "1", title: "Lead", description: "WATCH_FOR:\n- Pre-1978", ruleType: "disclosure" },
        { id: "2", title: "Rent cap", description: "n/a", ruleType: "rent_control" },
        { title: "missing id" },
      ]),
    ).toEqual([{ id: "1", title: "Lead", description: "WATCH_FOR:\n- Pre-1978" }])
  })
})

describe("groupLeasePacketDocuments", () => {
  it("splits addendums and disclosures from the rest of the packet", () => {
    const grouped = groupLeasePacketDocuments([
      { id: "1", name: "Lease", docType: "lease" },
      { id: "2", name: "Pet", docType: "addendum" },
      { id: "3", name: "Lead", docType: "disclosure" },
    ])
    expect(grouped.addendums.map((d) => d.id)).toEqual(["2"])
    expect(grouped.disclosures.map((d) => d.id)).toEqual(["3"])
    expect(grouped.other.map((d) => d.id)).toEqual(["1"])
  })
})
