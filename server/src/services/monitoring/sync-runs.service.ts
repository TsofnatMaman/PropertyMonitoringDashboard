import db from "../../../db/database";

export type PersistedSyncRun = {
  id: number;
  status: "running" | "completed" | "failed";
  started_at: string | null;
  finished_at: string | null;
  total_properties: number;
  processed_properties: number;
  percentage: number;
  successful_properties: number;
  failed_properties: number;
  total_saved_cases: number;
  total_activity_sync_succeeded: number;
  total_activity_sync_failed: number;
  current_apn: string | null;
  current_description: string | null;
  current_case_number: string | null;
  processed_cases: number;
  total_cases: number;
  case_percentage: number;
  errors_json: string;
  results_json: string;
};

type PersistedSyncRunPatch = Partial<{
  status: "running" | "completed" | "failed";
  started_at: string | null;
  finished_at: string | null;
  total_properties: number;
  processed_properties: number;
  percentage: number;
  successful_properties: number;
  failed_properties: number;
  total_saved_cases: number;
  total_activity_sync_succeeded: number;
  total_activity_sync_failed: number;
  current_apn: string | null;
  current_description: string | null;
  current_case_number: string | null;
  processed_cases: number;
  total_cases: number;
  case_percentage: number;
  errors_json: string;
  results_json: string;
}>;

export function createSyncRun(input: {
  status: "running" | "completed" | "failed";
  started_at: string | null;
  finished_at: string | null;
  total_properties: number;
  processed_properties: number;
  percentage: number;
  successful_properties: number;
  failed_properties: number;
  total_saved_cases: number;
  total_activity_sync_succeeded: number;
  total_activity_sync_failed: number;
  current_apn: string | null;
  current_description: string | null;
  current_case_number: string | null;
  processed_cases: number;
  total_cases: number;
  case_percentage: number;
  errors_json: string;
  results_json: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO sync_runs (
      status,
      started_at,
      finished_at,
      total_properties,
      processed_properties,
      percentage,
      successful_properties,
      failed_properties,
      total_saved_cases,
      total_activity_sync_succeeded,
      total_activity_sync_failed,
      current_apn,
      current_description,
      current_case_number,
      processed_cases,
      total_cases,
      case_percentage,
      errors_json,
      results_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    input.status,
    input.started_at,
    input.finished_at,
    input.total_properties,
    input.processed_properties,
    input.percentage,
    input.successful_properties,
    input.failed_properties,
    input.total_saved_cases,
    input.total_activity_sync_succeeded,
    input.total_activity_sync_failed,
    input.current_apn,
    input.current_description,
    input.current_case_number,
    input.processed_cases,
    input.total_cases,
    input.case_percentage,
    input.errors_json,
    input.results_json
  );

  return Number(result.lastInsertRowid);
}

export function updateSyncRun(id: number, patch: PersistedSyncRunPatch) {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined);

  if (entries.length === 0) return;

  const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
  const values = entries.map(([, value]) => value);

  db.prepare(`
    UPDATE sync_runs
    SET ${setClause}
    WHERE id = ?
  `).run(...values, id);
}

export function getLatestSyncRun(): PersistedSyncRun | null {
  const row = db.prepare(`
    SELECT *
    FROM sync_runs
    ORDER BY id DESC
    LIMIT 1
  `).get() as PersistedSyncRun | undefined;

  return row ?? null;
}
