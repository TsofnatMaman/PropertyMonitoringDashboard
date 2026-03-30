import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

const schemaSql = readFileSync(
  path.resolve(process.cwd(), "db/create-tables.sql"),
  "utf-8"
);

async function loadPropertiesService() {
  vi.resetModules();

  const db = new Database(":memory:");
  db.exec(schemaSql);

  vi.doMock("../../../db/database", () => ({
    default: db,
  }));

  const service = await import("./properties.service");
  return { db, ...service };
}

describe("properties.service DB persistence", () => {
  it("creates and retrieves a property by APN", async () => {
    const { db, createProperty, getPropertyByApn, listProperties } =
      await loadPropertiesService();

    try {
      const created = createProperty("2654002037", "Initial description");

      expect(created.isNew).toBe(true);
      expect(created.property?.apn).toBe("2654002037");
      expect(getPropertyByApn("2654002037")?.description).toBe(
        "Initial description"
      );
      expect(listProperties()).toHaveLength(1);
    } finally {
      db.close();
    }
  });

  it("updates description when property already exists", async () => {
    const { db, createProperty, getPropertyByApn } =
      await loadPropertiesService();

    try {
      createProperty("2654002037", "Old");
      const updated = createProperty("2654002037", "Updated");

      expect(updated.isNew).toBe(false);
      expect(getPropertyByApn("2654002037")?.description).toBe("Updated");
    } finally {
      db.close();
    }
  });
});
