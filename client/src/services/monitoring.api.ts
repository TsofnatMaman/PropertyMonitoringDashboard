import { api } from "./api";
import type { CaseFilters, CasePaginationParams, CasesOverviewResponse } from "../types/case";
import type {
  StartSyncAllResponse,
  StartSyncPropertyResponse,
  SyncAllProgress,
} from "../types/monitoring";
import { DEFAULT_CASES_PAGE_SIZE } from "../constants/pagination";

export async function getCasesOverview(
  filters: CaseFilters = {},
  pagination: CasePaginationParams = {
    limit: DEFAULT_CASES_PAGE_SIZE,
    offset: 0,
  }
): Promise<CasesOverviewResponse> {
  const params = new URLSearchParams();

  if (filters.query) params.set("query", filters.query);
  if (filters.openOnly) params.set("openOnly", "true");
  if (filters.attentionOnly) params.set("attentionOnly", "true");
  if (filters.urgentOnly) params.set("urgentOnly", "true");
  if (filters.newActivityOnly) params.set("newActivityOnly", "true");
  
  params.set("limit", String(pagination.limit));
  params.set("offset", String(pagination.offset));

  const queryString = params.toString();
  const path = `/api/monitoring/cases/overview?${queryString}`;

  return api.get<CasesOverviewResponse>(path);
}

export async function startSyncAllProperties(): Promise<StartSyncAllResponse> {
  return api.post<StartSyncAllResponse>("/api/monitoring/sync-all");
}

export async function startSyncProperty(
  apn: string
): Promise<StartSyncPropertyResponse> {
  return api.post<StartSyncPropertyResponse>(
    `/api/monitoring/${encodeURIComponent(apn)}/sync`
  );
}

export async function getSyncAllProgress(): Promise<SyncAllProgress> {
  return api.get<SyncAllProgress>("/api/monitoring/sync-all/progress");
}
