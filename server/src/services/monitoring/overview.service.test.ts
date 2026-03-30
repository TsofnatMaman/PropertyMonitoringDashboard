import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CaseWithProperty } from "../../types/case.types";
import { listCasesOverview } from "./overview.service";
import { listCasesFromDb } from "../cases/cases.service";

vi.mock("../cases/cases.service", () => ({
  listCasesFromDb: vi.fn(),
}));

const mockedListCasesFromDb = vi.mocked(listCasesFromDb);

function makeCase(overrides: Partial<CaseWithProperty>): CaseWithProperty {
  return {
    id: 1,
    property_id: 10,
    case_number: "CASE-1",
    case_type: "General",
    case_type_id: "general",
    latest_status: "Open",
    latest_activity_date: "2025-01-01T00:00:00.000Z",
    has_new_activity: 0,
    apn: "0000000000",
    description: "Default",
    ...overrides,
  };
}

describe("overview.service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-30T00:00:00.000Z"));
    mockedListCasesFromDb.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sorts by business priority score and then by latest activity date", () => {
    mockedListCasesFromDb.mockReturnValue([
      makeCase({
        id: 1,
        case_number: "URGENT-OLD",
        latest_status: "Final Notice",
        latest_activity_date: "2025-01-01T00:00:00.000Z",
        has_new_activity: 1,
      }),
      makeCase({
        id: 2,
        case_number: "OPEN-ONLY",
        latest_status: "Open",
        latest_activity_date: "2024-01-01T00:00:00.000Z",
        has_new_activity: 0,
      }),
      makeCase({
        id: 3,
        case_number: "ATTENTION",
        latest_status: "Violation notice",
        latest_activity_date: "2024-06-01T00:00:00.000Z",
        has_new_activity: 1,
      }),
      makeCase({
        id: 4,
        case_number: "URGENT-NEW",
        latest_status: "Final Notice",
        latest_activity_date: "2025-02-01T00:00:00.000Z",
        has_new_activity: 1,
      }),
      makeCase({
        id: 5,
        case_number: "CLOSED-WITH-NEW",
        latest_status: "Closed",
        latest_activity_date: "2025-03-01T00:00:00.000Z",
        has_new_activity: 1,
      }),
    ]);

    const result = listCasesOverview();

    expect(result.cases.map((c) => c.case_number)).toEqual([
      "URGENT-NEW",
      "URGENT-OLD",
      "ATTENTION",
      "CLOSED-WITH-NEW",
      "OPEN-ONLY",
    ]);
    expect(result.summary).toEqual({
      total: 5,
      open: 4,
      attention: 3,
      urgent: 2,
    });
  });

  it("sorts by latest activity in ascending order with null dates last", () => {
    mockedListCasesFromDb.mockReturnValue([
      makeCase({
        id: 1,
        case_number: "C2",
        latest_activity_date: "2026-01-01T00:00:00.000Z",
      }),
      makeCase({
        id: 2,
        case_number: "C1",
        latest_activity_date: "2026-01-01T00:00:00.000Z",
      }),
      makeCase({
        id: 3,
        case_number: "C0",
        latest_activity_date: "2025-01-01T00:00:00.000Z",
      }),
      makeCase({
        id: 4,
        case_number: "Z9",
        latest_activity_date: null,
      }),
    ]);

    const result = listCasesOverview({
      sortBy: "latestActivity",
      sortDirection: "asc",
    });

    expect(result.cases.map((c) => c.case_number)).toEqual([
      "C0",
      "C1",
      "C2",
      "Z9",
    ]);
  });

  it("applies filters and clamps pagination inputs", () => {
    mockedListCasesFromDb.mockReturnValue([
      makeCase({
        id: 1,
        case_number: "MATCH-1",
        latest_status: "Final Notice",
        has_new_activity: 1,
        apn: "TARGET-APN",
      }),
      makeCase({
        id: 2,
        case_number: "NO-MATCH",
        latest_status: "Violation",
        has_new_activity: 1,
        apn: "OTHER-APN",
      }),
    ]);

    const result = listCasesOverview({
      query: "target-apn",
      urgentOnly: true,
      limit: 500,
      offset: -5,
    });

    expect(result.cases).toHaveLength(1);
    expect(result.cases[0].case_number).toBe("MATCH-1");
    expect(result.pagination).toEqual({
      limit: 100,
      offset: 0,
      total: 1,
    });
  });
});
