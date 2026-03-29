import {
  createSyncRun,
  getLatestSyncRun,
  updateSyncRun,
} from "./sync-runs.service";
import type { CaseRecord } from "../../types/case.types";

export type SyncCaseActivityResult = {
  caseNumber: string;
  caseType?: string | null;
  caseTypeId?: string | null;
  ok: boolean;
  latestStatus: string | null;
  latestActivityDate: string | null;
  activitiesCount: number;
  error?: string;
};

export type SyncAllPropertyResult = {
  property: {
    id: number;
    apn: string;
    description?: string | null;
  };
  scrapedCaseCount: number;
  savedCount: number;
  activitySync: {
    attempted: number;
    succeeded: number;
    failed: number;
    results: SyncCaseActivityResult[];
  };
  cases: CaseRecord[];
  ok: boolean;
};

export type SyncAllError = {
  apn: string;
  description?: string | null;
  ok: false;
  error: string;
};

type SyncAllProgressState = {
  isRunning: boolean;
  startedAt: string | null;
  finishedAt: string | null;

  currentApn: string | null;
  currentDescription: string | null;

  processedProperties: number;
  totalProperties: number;
  percentage: number;

  successfulProperties: number;
  failedProperties: number;
  totalSavedCases: number;
  totalActivitySyncSucceeded: number;
  totalActivitySyncFailed: number;

  currentCaseNumber: string | null;
  processedCases: number;
  totalCases: number;
  casePercentage: number;

  results: SyncAllPropertyResult[];
  errors: SyncAllError[];

  activeRunId: number | null;
};

const state: SyncAllProgressState = {
  isRunning: false,
  startedAt: null,
  finishedAt: null,

  currentApn: null,
  currentDescription: null,

  processedProperties: 0,
  totalProperties: 0,
  percentage: 0,

  successfulProperties: 0,
  failedProperties: 0,
  totalSavedCases: 0,
  totalActivitySyncSucceeded: 0,
  totalActivitySyncFailed: 0,

  currentCaseNumber: null,
  processedCases: 0,
  totalCases: 0,
  casePercentage: 0,

  results: [],
  errors: [],

  activeRunId: null,
};

function serializeResults() {
  return JSON.stringify(state.results);
}

function serializeErrors() {
  return JSON.stringify(state.errors);
}

function persistActiveRun(statusOverride?: "running" | "completed" | "failed") {
  if (!state.activeRunId) return;

  updateSyncRun(state.activeRunId, {
    status: statusOverride ?? (state.isRunning ? "running" : "completed"),
    started_at: state.startedAt,
    finished_at: state.finishedAt,
    total_properties: state.totalProperties,
    processed_properties: state.processedProperties,
    percentage: state.percentage,
    successful_properties: state.successfulProperties,
    failed_properties: state.failedProperties,
    total_saved_cases: state.totalSavedCases,
    total_activity_sync_succeeded: state.totalActivitySyncSucceeded,
    total_activity_sync_failed: state.totalActivitySyncFailed,
    current_apn: state.currentApn,
    current_description: state.currentDescription,
    current_case_number: state.currentCaseNumber,
    processed_cases: state.processedCases,
    total_cases: state.totalCases,
    case_percentage: state.casePercentage,
    errors_json: serializeErrors(),
    results_json: serializeResults(),
  });
}

function parseJsonArray<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildResponseFromLiveState() {
  return {
    isRunning: state.isRunning,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,

    currentApn: state.currentApn,
    currentDescription: state.currentDescription,

    processedProperties: state.processedProperties,
    totalProperties: state.totalProperties,
    percentage: state.percentage,

    successfulProperties: state.successfulProperties,
    failedProperties: state.failedProperties,
    totalSavedCases: state.totalSavedCases,
    totalActivitySyncSucceeded: state.totalActivitySyncSucceeded,
    totalActivitySyncFailed: state.totalActivitySyncFailed,

    currentCaseNumber: state.currentCaseNumber,
    processedCases: state.processedCases,
    totalCases: state.totalCases,
    casePercentage: state.casePercentage,

    results: state.results,
    errors: state.errors,
  };
}

function buildResponseFromPersistedRun() {
  const lastRun = getLatestSyncRun();

  if (!lastRun) {
    return {
      isRunning: false,
      startedAt: null,
      finishedAt: null,

      currentApn: null,
      currentDescription: null,

      processedProperties: 0,
      totalProperties: 0,
      percentage: 0,

      successfulProperties: 0,
      failedProperties: 0,
      totalSavedCases: 0,
      totalActivitySyncSucceeded: 0,
      totalActivitySyncFailed: 0,

      currentCaseNumber: null,
      processedCases: 0,
      totalCases: 0,
      casePercentage: 0,

      results: [],
      errors: [],
    };
  }

  return {
    isRunning: lastRun.status === "running",
    startedAt: lastRun.started_at,
    finishedAt: lastRun.finished_at,

    currentApn: lastRun.current_apn,
    currentDescription: lastRun.current_description,

    processedProperties: lastRun.processed_properties,
    totalProperties: lastRun.total_properties,
    percentage: lastRun.percentage,

    successfulProperties: lastRun.successful_properties,
    failedProperties: lastRun.failed_properties,
    totalSavedCases: lastRun.total_saved_cases,
    totalActivitySyncSucceeded: lastRun.total_activity_sync_succeeded,
    totalActivitySyncFailed: lastRun.total_activity_sync_failed,

    currentCaseNumber: lastRun.current_case_number,
    processedCases: lastRun.processed_cases,
    totalCases: lastRun.total_cases,
    casePercentage: lastRun.case_percentage,

    results: parseJsonArray<SyncAllPropertyResult>(lastRun.results_json),
    errors: parseJsonArray<SyncAllError>(lastRun.errors_json),
  };
}

export function isSyncRunning() {
  return state.isRunning;
}

export function startProgress(totalProperties: number) {
  state.isRunning = true;
  state.startedAt = new Date().toISOString();
  state.finishedAt = null;

  state.currentApn = null;
  state.currentDescription = null;

  state.processedProperties = 0;
  state.totalProperties = totalProperties;
  state.percentage = 0;

  state.successfulProperties = 0;
  state.failedProperties = 0;
  state.totalSavedCases = 0;
  state.totalActivitySyncSucceeded = 0;
  state.totalActivitySyncFailed = 0;

  state.currentCaseNumber = null;
  state.processedCases = 0;
  state.totalCases = 0;
  state.casePercentage = 0;

  state.results = [];
  state.errors = [];

  state.activeRunId = createSyncRun({
    status: "running",
    started_at: state.startedAt,
    finished_at: null,
    total_properties: state.totalProperties,
    processed_properties: 0,
    percentage: 0,
    successful_properties: 0,
    failed_properties: 0,
    total_saved_cases: 0,
    total_activity_sync_succeeded: 0,
    total_activity_sync_failed: 0,
    current_apn: null,
    current_description: null,
    current_case_number: null,
    processed_cases: 0,
    total_cases: 0,
    case_percentage: 0,
    errors_json: "[]",
    results_json: "[]",
  });
}

export function setCurrentProperty(apn: string | null, description?: string | null) {
  state.currentApn = apn;
  state.currentDescription = description ?? null;
  persistActiveRun("running");
}

export function resetCurrentPropertyCases(totalCases: number) {
  state.currentCaseNumber = null;
  state.processedCases = 0;
  state.totalCases = totalCases;
  state.casePercentage = 0;
  persistActiveRun("running");
}

export function setCurrentCase(caseNumber: string) {
  state.currentCaseNumber = caseNumber;
  persistActiveRun("running");
}

export function completeCase() {
  state.processedCases += 1;
  state.casePercentage =
    state.totalCases > 0
      ? Math.round((state.processedCases / state.totalCases) * 100)
      : 0;

  persistActiveRun("running");
}

export function addPropertySuccess(result: SyncAllPropertyResult) {
  state.totalSavedCases += result.savedCount;
  state.successfulProperties += 1;
  state.results.push({ ...result, ok: true });
  persistActiveRun("running");
}

export function incrementActivitySyncSucceeded() {
  state.totalActivitySyncSucceeded += 1;
  persistActiveRun("running");
}

export function incrementActivitySyncFailed() {
  state.totalActivitySyncFailed += 1;
  persistActiveRun("running");
}

export function addPropertyFailure(error: SyncAllError) {
  state.failedProperties += 1;
  state.errors.push(error);
  persistActiveRun("running");
}

export function completeProperty() {
  state.processedProperties += 1;
  state.percentage =
    state.totalProperties > 0
      ? Math.round((state.processedProperties / state.totalProperties) * 100)
      : 0;

  persistActiveRun("running");
}

export function finishProgress(status: "completed" | "failed" = "completed") {
  state.isRunning = false;
  state.finishedAt = new Date().toISOString();

  state.currentApn = null;
  state.currentDescription = null;
  state.currentCaseNumber = null;

  state.percentage = state.totalProperties > 0 ? 100 : 0;
  state.casePercentage = state.totalCases > 0 ? 100 : 0;

  persistActiveRun(status);
}

export function getSyncAllProgress() {
  const base =
    state.isRunning || state.startedAt
      ? buildResponseFromLiveState()
      : buildResponseFromPersistedRun();

  return {
    ...base,
    summary: {
      totalProperties: base.totalProperties,
      processedProperties: base.processedProperties,
      successfulProperties: base.successfulProperties,
      failedProperties: base.failedProperties,
      totalSavedCases: base.totalSavedCases,
      totalActivitySyncSucceeded: base.totalActivitySyncSucceeded,
      totalActivitySyncFailed: base.totalActivitySyncFailed,
      percentage: base.percentage,
    },
    caseSummary: {
      currentCaseNumber: base.currentCaseNumber,
      processedCases: base.processedCases,
      totalCases: base.totalCases,
      casePercentage: base.casePercentage,
    },
  };
}
