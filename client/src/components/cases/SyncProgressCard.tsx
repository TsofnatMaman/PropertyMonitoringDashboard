import type { SyncAllProgress } from "../../types/monitoring";
import { formatDateTime } from "../../utils/date";
import Card from "../ui/Card";

type SyncProgressCardProps = {
  progress: SyncAllProgress | null;
  syncing: boolean;
  message?: string;
};

export default function SyncProgressCard({
  progress,
  syncing,
  message,
}: SyncProgressCardProps) {
  const hasAnySyncHistory = Boolean(progress?.startedAt || progress?.finishedAt);

  const subtitle = syncing
    ? "The server is syncing tracked properties and case activities."
    : hasAnySyncHistory
      ? "Last completed sync status."
      : "No sync has been run yet.";

  const statusMessage = syncing
    ? message || "Sync in progress..."
    : hasAnySyncHistory
      ? buildLastSyncMessage(progress)
      : "";

  const propertyProgress = progress?.summary ?? {
    totalProperties: 0,
    processedProperties: 0,
    successfulProperties: 0,
    failedProperties: 0,
    totalSavedCases: 0,
    totalActivitySyncSucceeded: 0,
    totalActivitySyncFailed: 0,
    percentage: 0,
  };

  const caseProgress = progress?.caseSummary ?? {
    currentCaseNumber: null,
    processedCases: 0,
    totalCases: 0,
    casePercentage: 0,
  };

  return (
    <Card title="Sync Progress" subtitle={subtitle}>
      {statusMessage ? <p className="sync-message">{statusMessage}</p> : null}

      <div className="sync-progress-section">
        <div className="progress-top-row">
          <strong>
            Properties: {propertyProgress.processedProperties}/
            {propertyProgress.totalProperties}
          </strong>
          <span>{propertyProgress.percentage}%</span>
        </div>

        <div className="progress-track" aria-hidden="true">
          <div
            className="progress-fill"
            style={{ width: `${propertyProgress.percentage}%` }}
          />
        </div>

        <div className="progress-meta">
          <span>
            Current property: {progress?.currentDescription || progress?.currentApn || "-"}
          </span>
          <span>Saved cases: {propertyProgress.totalSavedCases}</span>
          <span>Success: {propertyProgress.successfulProperties}</span>
          <span>Failed: {propertyProgress.failedProperties}</span>
        </div>
      </div>

      <div className="sync-progress-section">
        <div className="progress-top-row">
          <strong>
            Cases in current property: {caseProgress.processedCases}/
            {caseProgress.totalCases}
          </strong>
          <span>{caseProgress.casePercentage}%</span>
        </div>

        <div className="progress-track" aria-hidden="true">
          <div
            className="progress-fill progress-fill--secondary"
            style={{ width: `${caseProgress.casePercentage}%` }}
          />
        </div>

        <div className="progress-meta">
          <span>Current case: {caseProgress.currentCaseNumber || "-"}</span>
          <span>
            Activity sync success: {propertyProgress.totalActivitySyncSucceeded}
          </span>
          <span>
            Activity sync failed: {propertyProgress.totalActivitySyncFailed}
          </span>
        </div>
      </div>
    </Card>
  );
}

function buildLastSyncMessage(progress: SyncAllProgress | null): string {
  if (!progress) {
    return "";
  }

  if (progress.finishedAt) {
    return `Last completed sync: ${formatDateTime(
      progress.finishedAt
    )} - processed ${progress.summary.processedProperties}/${
      progress.summary.totalProperties
    } properties - saved ${progress.summary.totalSavedCases} cases.`;
  }

  if (progress.startedAt) {
    return `Last sync started: ${formatDateTime(progress.startedAt)}.`;
  }

  return "";
}
