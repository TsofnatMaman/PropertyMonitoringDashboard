import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCaseFlags,
  filterCases,
  summarizeCases,
  type CaseFlags,
} from "./case-labels.service";

type TestCase = {
  case_number: string;
  apn: string;
  description: string;
  case_type: string;
  latest_status: string;
  flags: CaseFlags;
};

describe("case-labels.service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-30T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("buildCaseFlags", () => {
    it("marks closed cases as not open/attention/urgent", () => {
      const flags = buildCaseFlags({
        latest_status: "Final notice - CLOSED",
        case_type: "Emergency",
        latest_activity_date: "2026-03-20T00:00:00.000Z",
        has_new_activity: 1,
      });

      expect(flags).toEqual({
        isOpen: false,
        needsAttention: false,
        isUrgent: false,
        hasNewActivity: true,
      });
    });

    it("marks urgent/attention/open from status markers", () => {
      const flags = buildCaseFlags({
        latest_status: "Order to comply after failed inspection",
        case_type: "",
        latest_activity_date: "2024-01-01T00:00:00.000Z",
        has_new_activity: 0,
      });

      expect(flags).toEqual({
        isOpen: true,
        needsAttention: true,
        isUrgent: true,
        hasNewActivity: false,
      });
    });

    it("marks hasNewActivity for recent dates even without explicit DB flag", () => {
      const flags = buildCaseFlags({
        latest_status: "Open",
        case_type: "Case Management",
        latest_activity_date: "2026-02-15T00:00:00.000Z",
        has_new_activity: 0,
      });

      expect(flags.hasNewActivity).toBe(true);
    });
  });

  describe("filterCases + summarizeCases", () => {
    const cases: TestCase[] = [
      {
        case_number: "25-100",
        apn: "2654002037",
        description: "Sunset Blvd",
        case_type: "Emergency",
        latest_status: "Final Notice",
        flags: {
          isOpen: true,
          needsAttention: true,
          isUrgent: true,
          hasNewActivity: true,
        },
      },
      {
        case_number: "25-200",
        apn: "999000111",
        description: "Hill Street",
        case_type: "Inspection",
        latest_status: "Violation Notice",
        flags: {
          isOpen: true,
          needsAttention: true,
          isUrgent: false,
          hasNewActivity: false,
        },
      },
      {
        case_number: "25-300",
        apn: "123456789",
        description: "Main Street",
        case_type: "General",
        latest_status: "Closed",
        flags: {
          isOpen: false,
          needsAttention: false,
          isUrgent: false,
          hasNewActivity: false,
        },
      },
    ];

    it("applies query and flags filters together", () => {
      const filtered = filterCases(cases, {
        query: "2654",
        urgentOnly: true,
        newActivityOnly: true,
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].case_number).toBe("25-100");
    });

    it("returns summary counters from case flags", () => {
      expect(summarizeCases(cases)).toEqual({
        total: 3,
        open: 2,
        attention: 2,
        urgent: 1,
      });
    });
  });
});
