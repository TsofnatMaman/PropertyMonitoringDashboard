import db from "../../../db/database";
import type { PropertyCase } from "../../types/property.types";
import type { CaseRecord, CaseWithProperty } from "../../types/case.types";
import { normalizeCaseTypeKey } from "../../utils/case-key";
import { normalizeToIsoString } from "../../utils/date";

function normalizeComparableValue(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

export function upsertCasesForProperty(
  propertyId: number,
  cases: PropertyCase[]
) {
  const selectExistingStmt = db.prepare(`
    SELECT
      id,
      latest_status,
      latest_activity_date
    FROM cases
    WHERE property_id = ?
      AND case_number = ?
      AND case_type_id = ?
  `);

  const insertStmt = db.prepare(`
    INSERT INTO cases (
      property_id,
      case_number,
      case_type,
      case_type_id,
      latest_status,
      latest_activity_date,
      has_new_activity
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(property_id, case_number, case_type_id) DO UPDATE SET
      case_type = excluded.case_type,
      latest_status = COALESCE(excluded.latest_status, cases.latest_status),
      latest_activity_date = COALESCE(excluded.latest_activity_date, cases.latest_activity_date),
      has_new_activity = excluded.has_new_activity
  `);

  let insertedOrUpdated = 0;
  let newCases = 0;
  let changedCases = 0;

  const transaction = db.transaction((items: PropertyCase[]) => {
    for (const item of items) {
      const caseNumber = String(item.caseNumber || "").trim();
      if (!caseNumber) continue;

      const caseTypeKey = normalizeCaseTypeKey(item.caseTypeId, item.caseType);
      const normalizedNewStatus = normalizeComparableValue(item.latestStatus);
      const normalizedNewActivityDate = normalizeToIsoString(
        item.latestActivityDate
      );

      const existingCase = selectExistingStmt.get(
        propertyId,
        caseNumber,
        caseTypeKey
      ) as
        | {
            id: number;
            latest_status: string | null;
            latest_activity_date: string | null;
          }
        | undefined;

      const existingStatus = normalizeComparableValue(existingCase?.latest_status);
      const existingActivityDate = normalizeComparableValue(
        existingCase?.latest_activity_date
      );

      const isNewCase = !existingCase;

      const statusChanged =
        !isNewCase &&
        normalizedNewStatus !== null &&
        existingStatus !== normalizedNewStatus;

      const activityDateChanged =
        !isNewCase &&
        normalizedNewActivityDate !== null &&
        existingActivityDate !== normalizedNewActivityDate;

      const hasNewActivity =
        isNewCase || statusChanged || activityDateChanged ? 1 : 0;

      if (isNewCase) {
        newCases += 1;
      } else if (statusChanged || activityDateChanged) {
        changedCases += 1;
      }

      insertStmt.run(
        propertyId,
        caseNumber,
        item.caseType ?? null,
        caseTypeKey,
        normalizedNewStatus,
        normalizedNewActivityDate,
        hasNewActivity
      );

      insertedOrUpdated += 1;
    }
  });

  transaction(cases);

  return {
    processedCount: insertedOrUpdated,
    newCases,
    changedCases,
  };
}

export function getCasesByPropertyId(propertyId: number) {
  return db
    .prepare(
      `
      SELECT
        c.id,
        c.property_id,
        c.case_number,
        c.case_type,
        c.case_type_id,
        c.latest_status,
        c.latest_activity_date,
        c.has_new_activity
      FROM cases c
      WHERE c.property_id = ?
      ORDER BY
        c.latest_activity_date DESC,
        c.case_number ASC,
        c.case_type ASC
    `
    )
    .all(propertyId) as CaseRecord[];
}

export function listCasesFromDb() {
  return db
    .prepare(
      `
      SELECT
        c.id,
        c.property_id,
        c.case_number,
        c.case_type,
        c.case_type_id,
        c.latest_status,
        c.latest_activity_date,
        c.has_new_activity,
        p.apn,
        p.description
      FROM cases c
      JOIN properties p ON p.id = c.property_id
      ORDER BY
        c.latest_activity_date DESC,
        c.case_number ASC,
        c.case_type ASC
    `
    )
    .all() as CaseWithProperty[];
}