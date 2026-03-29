import { toTimestamp } from "../../utils/date";
import {
  CASE_STATUS,
  CASE_TYPE,
  NEW_ACTIVITY_WINDOW_DAYS,
  hasMarker,
} from "./case-classifiers";

export type CaseFlags = {
  isOpen: boolean;
  needsAttention: boolean;
  isUrgent: boolean;
  hasNewActivity: boolean;
};

export type CaseFilters = {
  query?: string;
  openOnly?: boolean;
  attentionOnly?: boolean;
  urgentOnly?: boolean;
  newActivityOnly?: boolean;
};

export type PaginationData = {
  limit: number;
  offset: number;
  total: number;
};

type BuildCaseFlagsInput = {
  latest_status?: string | null;
  case_type?: string | null;
  latest_activity_date?: string | null;
  has_new_activity?: boolean | number | null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function hasRecentActivity(latestActivityDate?: string | null) {
  const latestActivityTs = toTimestamp(latestActivityDate);
  if (latestActivityTs === Number.NEGATIVE_INFINITY) {
    return false;
  }

  return Date.now() - latestActivityTs <= NEW_ACTIVITY_WINDOW_DAYS * DAY_IN_MS;
}

export function buildCaseFlags(input: BuildCaseFlagsInput): CaseFlags {
  const latestStatus = String(input.latest_status || "").trim();
  const caseType = String(input.case_type || "").trim();

  const hasStatus = Boolean(latestStatus);
  const isClosed = hasMarker(latestStatus, CASE_STATUS.CLOSED);

  const hasNewActivity =
    Boolean(input.has_new_activity) ||
    hasRecentActivity(input.latest_activity_date);

  if (isClosed) {
    return {
      isOpen: false,
      needsAttention: false,
      isUrgent: false,
      hasNewActivity,
    };
  }

  const isOpen = hasStatus || Boolean(caseType);

  const attentionFromStatus = hasMarker(
    latestStatus,
    CASE_STATUS.NEEDS_ATTENTION
  );
  const attentionFromType = hasMarker(caseType, CASE_TYPE.NEEDS_ATTENTION);

  const urgentFromStatus = hasMarker(latestStatus, CASE_STATUS.URGENT);
  const urgentFromType = hasMarker(caseType, CASE_TYPE.URGENT);

  const needsAttention = isOpen && (attentionFromStatus || attentionFromType);
  const isUrgent = isOpen && (urgentFromStatus || urgentFromType);

  return {
    isOpen,
    needsAttention,
    isUrgent,
    hasNewActivity,
  };
}

export function filterCases<
  T extends {
    case_number?: string | null;
    apn?: string | null;
    description?: string | null;
    case_type?: string | null;
    latest_status?: string | null;
    flags: CaseFlags;
  }
>(cases: T[], filters: CaseFilters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();

  return cases.filter((item) => {
    if (query) {
      const haystack = [
        item.case_number,
        item.apn,
        item.description,
        item.case_type,
        item.latest_status,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (filters.openOnly && !item.flags.isOpen) {
      return false;
    }

    if (filters.attentionOnly && !item.flags.needsAttention) {
      return false;
    }

    if (filters.urgentOnly && !item.flags.isUrgent) {
      return false;
    }

    if (filters.newActivityOnly && !item.flags.hasNewActivity) {
      return false;
    }

    return true;
  });
}

export function summarizeCases<T extends { flags: CaseFlags }>(cases: T[]) {
  return {
    total: cases.length,
    open: cases.filter((item) => item.flags.isOpen).length,
    attention: cases.filter((item) => item.flags.needsAttention).length,
    urgent: cases.filter((item) => item.flags.isUrgent).length,
  };
}