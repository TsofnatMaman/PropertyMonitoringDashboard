import { getPropertyByApn, listProperties } from "../properties/properties.service";
import { logger } from "../system/logger.service";
import {
  addPropertyFailure,
  addPropertySuccess,
  completeCase,
  completeProperty,
  finishProgress,
  getSyncAllProgress,
  isSyncRunning,
  resetCurrentPropertyCases,
  setCurrentCase,
  setCurrentProperty,
  startProgress,
  type SyncAllError,
} from "./sync-progress.service";
import type { PropertyRecord } from "../../types/property.types";
import { syncPropertyCases } from "./sync-property.service";

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

export { syncPropertyCases } from "./sync-property.service";
