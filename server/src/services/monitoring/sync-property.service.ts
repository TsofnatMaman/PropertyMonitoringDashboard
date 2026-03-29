import { getPropertyByApn } from "../properties/properties.service";
import { scrapeCaseActivities, scrapePropertyByApn } from "../scraping/scraper.service";
import { getCasesByPropertyId, upsertCasesForProperty } from "../cases/cases.service";
import { updateCaseLatestActivity } from "../cases/case-activities.service";
import { logger } from "../system/logger.service";
import {
  incrementActivitySyncFailed,
  incrementActivitySyncSucceeded,
  type SyncAllPropertyResult,
  type SyncCaseActivityResult,
} from "./sync-progress.service";
import type { PropertyCase } from "../../types/property.types";
import type { CaseRecord } from "../../types/case.types";
import { buildCaseKey } from "../../utils/case-key";

type SyncPropertyCasesHooks = {
  onCasesDiscovered?: (totalCases: number) => void;
  onCaseStarted?: (caseNumber: string) => void;
  onCaseFinished?: () => void;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string") {
    return error || fallback;
  }

  return fallback;
}

function recordActivityResult(
  results: SyncCaseActivityResult[],
  result: SyncCaseActivityResult
) {
  results.push(result);

  if (result.ok) {
    incrementActivitySyncSucceeded();
  } else {
    incrementActivitySyncFailed();
  }
}

export async function syncPropertyCases(
  apn: string,
  hooks?: SyncPropertyCasesHooks
): Promise<SyncAllPropertyResult> {
  logger.info("syncPropertyCases started", { apn });

  const property = getPropertyByApn(apn);

  if (!property) {
    logger.error("syncPropertyCases could not find property", { apn });
    throw new Error("Property not found in tracked properties");
  }

  const scraped = await scrapePropertyByApn(apn);
  const casesToSave = scraped.cases as PropertyCase[];

  logger.info("Scraped property cases", {
    apn,
    scrapedCases: casesToSave.length,
  });

  hooks?.onCasesDiscovered?.(casesToSave.length);

  const saveResult = upsertCasesForProperty(property.id, casesToSave);

  logger.info("Upserted property cases", {
    apn,
    propertyId: property.id,
    processedCount: saveResult.processedCount,
  });

  const dbCases = getCasesByPropertyId(property.id);

  logger.debug("Loaded DB cases after upsert", {
    apn,
    propertyId: property.id,
    dbCasesCount: dbCases.length,
  });

  const dbCaseMap = new Map(
    dbCases.map((item: CaseRecord) => [
      buildCaseKey({
        caseNumber: item.case_number,
        caseTypeId: item.case_type_id ?? null,
        caseType: item.case_type ?? null,
      }),
      item,
    ])
  );

  const activitySyncResults: SyncCaseActivityResult[] = [];

  for (const scrapedCase of casesToSave) {
    const caseNumber = String(scrapedCase.caseNumber || "").trim();
    const caseType = scrapedCase.caseType ?? null;
    const caseTypeId = scrapedCase.caseTypeId ?? null;

    if (!caseNumber) {
      logger.warn("Skipping scraped case with empty case number", {
        apn,
        scrapedCase,
      });
      continue;
    }

    if (!caseTypeId) {
      logger.warn("Skipping case activity sync due to missing case type id", {
        apn,
        caseNumber,
        caseType,
      });

      recordActivityResult(activitySyncResults, {
        caseNumber,
        caseType,
        caseTypeId,
        ok: false,
        latestStatus: null,
        latestActivityDate: null,
        activitiesCount: 0,
        error: "Missing case type id for activity lookup",
      });

      hooks?.onCaseFinished?.();
      continue;
    }

    hooks?.onCaseStarted?.(caseNumber);

    const dbCase = dbCaseMap.get(
      buildCaseKey({
        caseNumber,
        caseTypeId,
        caseType,
      })
    );

    if (!dbCase) {
      logger.error("DB case not found after upsert", {
        apn,
        caseNumber,
        caseType,
        caseTypeId,
      });

      recordActivityResult(activitySyncResults, {
        caseNumber,
        caseType,
        caseTypeId,
        ok: false,
        latestStatus: null,
        latestActivityDate: null,
        activitiesCount: 0,
        error: "Case was scraped but not found in database after upsert",
      });

      hooks?.onCaseFinished?.();
      continue;
    }

    try {
      const activityResult = await scrapeCaseActivities({
        apn,
        caseNumber,
        caseType: caseTypeId,
      });

      logger.debug("Scraped case activities", {
        apn,
        caseNumber,
        caseType,
        caseTypeId,
        activitiesCount: activityResult.activities.length,
      });

      const latest = updateCaseLatestActivity(
        dbCase.id,
        activityResult.activities
      );

      recordActivityResult(activitySyncResults, {
        caseNumber,
        caseType,
        caseTypeId,
        ok: true,
        latestStatus: latest?.status ?? dbCase.latest_status ?? null,
        latestActivityDate:
          latest?.activityDate ?? dbCase.latest_activity_date ?? null,
        activitiesCount: activityResult.activities.length,
      });

      logger.debug("Updated case latest activity", {
        apn,
        caseNumber,
        dbCaseId: dbCase.id,
        latestStatus: latest?.status ?? null,
        latestActivityDate: latest?.activityDate ?? null,
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to sync case activities"
      );

      logger.error("Case activity sync failed", {
        apn,
        caseNumber,
        caseType,
        caseTypeId,
        error: errorMessage,
      });

      recordActivityResult(activitySyncResults, {
        caseNumber,
        caseType,
        caseTypeId,
        ok: false,
        latestStatus: dbCase.latest_status ?? null,
        latestActivityDate: dbCase.latest_activity_date ?? null,
        activitiesCount: 0,
        error: errorMessage,
      });
    } finally {
      hooks?.onCaseFinished?.();
    }
  }

  const refreshedCases = getCasesByPropertyId(property.id);

  logger.info("syncPropertyCases finished", {
    apn,
    propertyId: property.id,
    refreshedCasesCount: refreshedCases.length,
    attemptedActivities: activitySyncResults.length,
    succeededActivities: activitySyncResults.filter((x) => x.ok).length,
    failedActivities: activitySyncResults.filter((x) => !x.ok).length,
  });

  return {
    property: {
      id: property.id,
      apn: property.apn,
      description: property.description ?? null,
    },
    scrapedCaseCount: casesToSave.length,
    savedCount: saveResult.processedCount,
    activitySync: {
      attempted: activitySyncResults.length,
      succeeded: activitySyncResults.filter((x) => x.ok).length,
      failed: activitySyncResults.filter((x) => !x.ok).length,
      results: activitySyncResults,
    },
    cases: refreshedCases,
    ok: true,
  };
}
