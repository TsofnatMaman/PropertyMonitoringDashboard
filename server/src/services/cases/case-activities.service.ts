import db from "../../../db/database";
import { normalizeToIsoString, toTimestamp } from "../../utils/date";

export type CaseActivityInput = {
  activityDate?: string | null;
  status?: string | null;
  details?: string | null;
};

export function updateCaseLatestActivity(
  caseId: number,
  activities: CaseActivityInput[]
) {
  const normalizedActivities = activities
    .map((activity) => ({
      ...activity,
      status: activity.status ? String(activity.status).trim() : null,
      activityDate: normalizeToIsoString(activity.activityDate),
    }))
    .filter((activity) => activity.status);

  if (normalizedActivities.length === 0) {
    return null;
  }

  let latest: CaseActivityInput | null = null;

  for (const activity of normalizedActivities) {
    if (!latest) {
      latest = activity;
      continue;
    }

    if (toTimestamp(activity.activityDate) > toTimestamp(latest.activityDate)) {
      latest = activity;
    }
  }

  db.prepare(
    `
      UPDATE cases
      SET latest_status = ?, latest_activity_date = ?
      WHERE id = ?
    `
  ).run(latest?.status ?? null, latest?.activityDate ?? null, caseId);

  return {
    status: latest?.status ?? null,
    activityDate: latest?.activityDate ?? null,
  };
}
