import db from "../../../db/database";
import type { PropertyCase } from "../../types/property.types";
import type { CaseRecord, CaseWithProperty } from "../../types/case.types";
import { normalizeCaseTypeKey } from "../../utils/case-key";
import { normalizeToIsoString } from "../../utils/date";

export function upsertCasesForProperty(
  propertyId: number,
  cases: PropertyCase[]
) {
  const insertStmt = db.prepare(`
    INSERT INTO cases (
      property_id,
      case_number,
      case_type,
      case_type_id,
      latest_status,
      latest_activity_date
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(property_id, case_number, case_type_id) DO UPDATE SET
      case_type = excluded.case_type,
      latest_status = COALESCE(excluded.latest_status, cases.latest_status),
      latest_activity_date = COALESCE(excluded.latest_activity_date, cases.latest_activity_date)
  `);

  let insertedOrUpdated = 0;

  const transaction = db.transaction((items: PropertyCase[]) => {
    for (const item of items) {
      const caseNumber = String(item.caseNumber || "").trim();
      if (!caseNumber) continue;

      const caseTypeKey = normalizeCaseTypeKey(item.caseTypeId, item.caseType);

      insertStmt.run(
        propertyId,
        caseNumber,
        item.caseType ?? null,
        caseTypeKey,
        item.latestStatus ?? null,
        normalizeToIsoString(item.latestActivityDate)
      );

      insertedOrUpdated += 1;
    }
  });

  transaction(cases);

  return {
    processedCount: insertedOrUpdated,
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
        c.latest_activity_date
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
