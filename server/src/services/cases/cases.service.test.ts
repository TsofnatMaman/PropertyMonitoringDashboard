import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { PropertyCase } from "../../types/property.types";

const schemaSql = readFileSync(
  path.resolve(process.cwd(), "db/create-tables.sql"),
  "utf-8"
);

async function loadCasesService() {
  vi.resetModules();

  const db = new Database(":memory:");
  db.exec(schemaSql);
  db.prepare(
    "INSERT INTO properties (id, apn, description) VALUES (?, ?, ?)"
  ).run(1, "2654002037", "Seed Property");

  vi.doMock("../../../db/database", () => ({
    default: db,
  }));

  const service = await import("./cases.service");
  return { db, ...service };
}

describe("cases.service DB persistence", () => {
  it("upserts cases and retrieves them by property", async () => {
    const { db, upsertCasesForProperty, getCasesByPropertyId } =
      await loadCasesService();

    try {
      const firstPayload: PropertyCase[] = [
        {
          caseNumber: "25-001",
          caseType: "General",
          caseTypeId: "general",
          latestStatus: "Violation notice",
          latestActivityDate: "03/01/2026",
        },
      ];

      const firstResult = upsertCasesForProperty(1, firstPayload);
      expect(firstResult).toEqual({
        processedCount: 1,
        newCases: 1,
        changedCases: 0,
      });

      const afterInsert = getCasesByPropertyId(1);
      expect(afterInsert).toHaveLength(1);
      expect(afterInsert[0].case_number).toBe("25-001");
      expect(afterInsert[0].latest_status).toBe("Violation notice");
      expect(afterInsert[0].has_new_activity).toBe(1);

      const secondPayload: PropertyCase[] = [
        {
          caseNumber: "25-001",
          caseType: "General",
          caseTypeId: "general",
          latestStatus: "Final notice",
          latestActivityDate: "03/02/2026",
        },
      ];

      const secondResult = upsertCasesForProperty(1, secondPayload);
      expect(secondResult).toEqual({
        processedCount: 1,
        newCases: 0,
        changedCases: 1,
      });

      const afterUpdate = getCasesByPropertyId(1);
      expect(afterUpdate).toHaveLength(1);
      expect(afterUpdate[0].latest_status).toBe("Final notice");
      expect(afterUpdate[0].has_new_activity).toBe(1);
    } finally {
      db.close();
    }
  });

  it("lists cases with property details from joined query", async () => {
    const { db, upsertCasesForProperty, listCasesFromDb } =
      await loadCasesService();

    try {
      upsertCasesForProperty(1, [
        {
          caseNumber: "25-123",
          caseType: "Emergency",
          caseTypeId: "emergency",
          latestStatus: "Open",
          latestActivityDate: "03/05/2026",
        },
      ]);

      const rows = listCasesFromDb();
      expect(rows).toHaveLength(1);
      expect(rows[0].apn).toBe("2654002037");
      expect(rows[0].description).toBe("Seed Property");
      expect(rows[0].case_number).toBe("25-123");
    } finally {
      db.close();
    }
  });
});
