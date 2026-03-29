import { getPropertyByApn, listProperties } from "../properties/properties.service";
import { scrapeCaseActivities, scrapePropertyByApn } from "../scraping/scraper.service";
import { getCasesByPropertyId, upsertCasesForProperty } from "../cases/cases.service";
import { updateCaseLatestActivity } from "../cases/case-activities.service";
import { logger } from "../system/logger.service";
import {
  addPropertyFailure,
  addPropertySuccess,
  completeCase,
  completeProperty,
  finishProgress,
  getSyncAllProgress,
  incrementActivitySyncFailed,
  incrementActivitySyncSucceeded,
  isSyncRunning,
  resetCurrentPropertyCases,
  setCurrentCase,
  setCurrentProperty,
  startProgress,
  type SyncAllError,
} from "./sync-progress.service";
import type { PropertyCase, PropertyRecord } from "../../types/property.types";
import type { CaseRecord } from "../../types/case.types";
import { buildCaseKey } from "../../utils/case-key";

type SyncPropertyCasesHooks = {
  onCasesDiscovered?: (totalCases: number) => void;
  onCaseStarted?: (caseNumber: string) => void;
  onCaseFinished?: () => void;
};

async function runSyncQueue(
  properties: PropertyRecord[],
  completionLabel: string
) {
  let failed = false;

  try {
    for (const property of properties) {
      logger.info("Starting property sync", {
        apn: property.apn,
        description: property.description ?? null,
      });

      setCurrentProperty(property.apn, property.description ?? null);
      resetCurrentPropertyCases(0);

      try {
        const result = await syncPropertyCases(property.apn, {
          onCasesDiscovered(totalCases) {
            logger.info("Discovered cases for property", {
              apn: property.apn,
              totalCases,
            });
            resetCurrentPropertyCases(totalCases);
          },
          onCaseStarted(caseNumber) {
            logger.debug("Starting case activity sync", {
              apn: property.apn,
              caseNumber,
            });
            setCurrentCase(caseNumber);
          },
          onCaseFinished() {
            completeCase();
          },
        });

        logger.info("Finished property sync successfully", {
          apn: property.apn,
          savedCount: result.savedCount,
          attemptedActivities: result.activitySync.attempted,
          succeededActivities: result.activitySync.succeeded,
          failedActivities: result.activitySync.failed,
        });

        addPropertySuccess(result);
      } catch (error: any) {
        failed = true;

        const syncError: SyncAllError = {
          apn: property.apn,
          description: property.description ?? null,
          ok: false,
          error: error?.message || "Unknown error",
        };

        logger.error("Property sync failed", {
          apn: property.apn,
          description: property.description ?? null,
          error: syncError.error,
        });

        addPropertyFailure(syncError);
      } finally {
        completeProperty();
      }
    }
  } catch (error: any) {
    failed = true;

    logger.error("Sync queue crashed unexpectedly", {
      error: error?.message || "Unknown error",
    });
  } finally {
    logger.info(completionLabel, {
      failed,
      progress: getSyncAllProgress().summary,
    });

    finishProgress(failed ? "failed" : "completed");
  }
}

function launchSyncQueue(properties: PropertyRecord[], completionLabel: string) {
  runSyncQueue(properties, completionLabel).catch((error: any) => {
    logger.error("Sync queue rejected unexpectedly", {
      error: error?.message || "Unknown error",
    });

    if (isSyncRunning()) {
      finishProgress("failed");
    }
  });
}

export async function startSyncAllProperties() {
  if (isSyncRunning()) {
    logger.warn("Sync all requested while another sync is already running");
    return {
      started: false,
      alreadyRunning: true,
      progress: getSyncAllProgress(),
    };
  }

  const properties = listProperties();

  logger.info("Starting sync for all properties", {
    totalProperties: properties.length,
    apns: properties.map((p) => p.apn),
  });

  startProgress(properties.length);

  launchSyncQueue(properties, "Finished sync for all properties");

  return {
    started: true,
    alreadyRunning: false,
    progress: getSyncAllProgress(),
  };
}

export async function startSyncProperty(apn: string) {
  if (isSyncRunning()) {
    logger.warn("Single-property sync requested while another sync is already running", {
      apn,
    });

    return {
      started: false,
      alreadyRunning: true,
      progress: getSyncAllProgress(),
    };
  }

  const property = getPropertyByApn(apn);

  if (!property) {
    logger.error("Requested property sync for unknown APN", { apn });
    throw new Error("Property not found in tracked properties");
  }

  logger.info("Starting single-property sync", {
    apn: property.apn,
    description: property.description ?? null,
  });

  startProgress(1);

  launchSyncQueue([property], "Finished single-property sync");

  return {
    started: true,
    alreadyRunning: false,
    progress: getSyncAllProgress(),
  };
}

export async function syncPropertyCases(
  apn: string,
  hooks?: SyncPropertyCasesHooks
) {
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

  const activitySyncResults: Array<{
    caseNumber: string;
    caseType?: string | null;
    caseTypeId?: string | null;
    ok: boolean;
    latestStatus: string | null;
    latestActivityDate: string | null;
    activitiesCount: number;
    error?: string;
  }> = [];

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

      activitySyncResults.push({
        caseNumber,
        caseType,
        caseTypeId,
        ok: false,
        latestStatus: null,
        latestActivityDate: null,
        activitiesCount: 0,
        error: "Missing case type id for activity lookup",
      });

      incrementActivitySyncFailed();

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

      activitySyncResults.push({
        caseNumber,
        caseType,
        caseTypeId,
        ok: false,
        latestStatus: null,
        latestActivityDate: null,
        activitiesCount: 0,
        error: "Case was scraped but not found in database after upsert",
      });

      incrementActivitySyncFailed();
      
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

      activitySyncResults.push({
        caseNumber,
        caseType,
        caseTypeId,
        ok: true,
        latestStatus: latest?.status ?? dbCase.latest_status ?? null,
        latestActivityDate:
          latest?.activityDate ?? dbCase.latest_activity_date ?? null,
        activitiesCount: activityResult.activities.length,
      });

      incrementActivitySyncSucceeded();

      logger.debug("Updated case latest activity", {
        apn,
        caseNumber,
        dbCaseId: dbCase.id,
        latestStatus: latest?.status ?? null,
        latestActivityDate: latest?.activityDate ?? null,
      });
    } catch (error: any) {
      logger.error("Case activity sync failed", {
        apn,
        caseNumber,
        caseType,
        caseTypeId,
        error: error?.message || "Failed to sync case activities",
      });

      activitySyncResults.push({
        caseNumber,
        caseType,
        caseTypeId,
        ok: false,
        latestStatus: dbCase.latest_status ?? null,
        latestActivityDate: dbCase.latest_activity_date ?? null,
        activitiesCount: 0,
        error: error?.message || "Failed to sync case activities",
      });

      incrementActivitySyncFailed();
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
