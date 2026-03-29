import db from "../../../db/database";
import type { PropertyRecord } from "../../types/property.types";

const selectPropertyByApnStmt = db.prepare(`
  SELECT id, apn, description, created_at
  FROM properties
  WHERE apn = ?
`);

export function createProperty(
  apn: string,
  description: string | null
) {
  const existing = selectPropertyByApnStmt.get(apn) as
    | PropertyRecord
    | undefined;

  const stmt = db.prepare(`
    INSERT INTO properties (apn, description)
    VALUES (?, ?)
    ON CONFLICT(apn) DO UPDATE SET
      description = excluded.description
  `);

  stmt.run(apn, description ?? null);

  const property = selectPropertyByApnStmt.get(apn) as
    | PropertyRecord
    | undefined;

  return {
    property,
    isNew: !existing,
  };
}

export function listProperties() {
  return db
    .prepare(`
      SELECT id, apn, description, created_at
      FROM properties
      ORDER BY created_at DESC
    `)
    .all() as PropertyRecord[];
}

export function getPropertyByApn(apn: string) {
  return selectPropertyByApnStmt.get(apn) as PropertyRecord | undefined;
}
