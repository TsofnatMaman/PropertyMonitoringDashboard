import { listCasesFromDb } from "../cases/cases.service";
import {
  buildCaseFlags,
  type CaseFilters,
  type CaseFlags,
  filterCases,
  summarizeCases,
  type PaginationData,
} from "../cases/case-labels.service";
import { toTimestamp } from "../../utils/date";
import type { CaseWithProperty } from "../../types/case.types";

type CasesOverviewInput = CaseFilters & {
  limit?: number;
  offset?: number;
};

type CasesOverviewResult = {
  summary: ReturnType<typeof summarizeCases>;
  cases: CaseOverview[];
  pagination: PaginationData;
};

type CaseOverview = CaseWithProperty & { flags: CaseFlags };

function scoreCase(flags: CaseFlags) {
  let score = 0;
  if (flags.isUrgent) score += 8;
  if (flags.needsAttention) score += 4;
  if (flags.hasNewActivity) score += 2;
  if (flags.isOpen) score += 1;
  return score;
}

function sortCases<
  T extends {
    flags: CaseFlags;
    latest_activity_date?: string | null;
  }
>(cases: T[]) {
  return [...cases].sort((a, b) => {
    const scoreDiff = scoreCase(b.flags) - scoreCase(a.flags);
    if (scoreDiff !== 0) return scoreDiff;

    const aTs = toTimestamp(a.latest_activity_date);
    const bTs = toTimestamp(b.latest_activity_date);

    const dateDiff = bTs - aTs;
    if (dateDiff !== 0) return dateDiff;

    return 0;
  });
}

export function listCasesOverview(
  input: CasesOverviewInput = {}
): CasesOverviewResult {
  const filters: CaseFilters = {
    query: input.query,
    openOnly: input.openOnly,
    attentionOnly: input.attentionOnly,
    urgentOnly: input.urgentOnly,
    newActivityOnly: input.newActivityOnly,
  };

  const limit = Math.min(Math.max(input.limit || 20, 1), 100);
  const offset = Math.max(input.offset || 0, 0);

  const cases = listCasesFromDb();

  const enriched: CaseOverview[] = cases.map((c) => {
    const flags = buildCaseFlags({
      latest_status: c.latest_status,
      case_type: c.case_type,
      latest_activity_date: c.latest_activity_date,
      has_new_activity: c.has_new_activity,
    });

    return {
      ...c,
      flags,
    };
  });

  const filtered = filterCases(enriched, filters);
  const sorted = sortCases(filtered);
  const total = sorted.length;

  const summary = summarizeCases(sorted);
  const paginated = sorted.slice(offset, offset + limit);

  return {
    summary,
    cases: paginated,
    pagination: {
      limit,
      offset,
      total,
    },
  };
}
