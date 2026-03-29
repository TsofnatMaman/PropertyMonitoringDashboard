export type SyncAllError = {
  apn: string;
  description?: string | null;
  ok: false;
  error: string;
};

export type SyncAllProgressSummary = {
  totalProperties: number;
  processedProperties: number;
  successfulProperties: number;
  failedProperties: number;
  totalSavedCases: number;
  totalActivitySyncSucceeded: number;
  totalActivitySyncFailed: number;
  percentage: number;
};

export type SyncCasesSummary = {
  currentCaseNumber: string | null;
  processedCases: number;
  totalCases: number;
  casePercentage: number;
};

export type SyncAllProgress = {
  ok?: true;
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
  results: unknown[];
  errors: SyncAllError[];
  summary: SyncAllProgressSummary;
  caseSummary: SyncCasesSummary;
};

export type StartSyncAllResponse = {
  ok: true;
  started: boolean;
  alreadyRunning: boolean;
  progress: SyncAllProgress;
};

export type StartSyncPropertyResponse = {
  ok: true;
  started: boolean;
  alreadyRunning: boolean;
  progress: SyncAllProgress;
};