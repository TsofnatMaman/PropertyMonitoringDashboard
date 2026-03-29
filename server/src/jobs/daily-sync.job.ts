import cron from "node-cron";
import { logger } from "../services/system/logger.service";
import { isSyncRunning } from "../services/monitoring/sync-progress.service";
import { startSyncAllProperties } from "../services/monitoring/sync.service";
import { config } from "../utils/config";

export function startDailySyncJob() {
  logger.info("Initializing daily sync job", {
    cron: config.dailySyncCron,
    timezone: config.dailySyncTimezone,
  });

  cron.schedule(
    config.dailySyncCron,
    async () => {
      logger.info("Daily sync triggered", {
        timezone: config.dailySyncTimezone,
      });

      try {
        if (isSyncRunning()) {
          logger.warn("Skipping daily sync because another sync is already running");
          return;
        }

        const result = await startSyncAllProperties();

        logger.info("Daily sync launch result", {
          started: result.started,
          alreadyRunning: result.alreadyRunning,
        });
      } catch (error: any) {
        logger.error("Daily sync failed to start", {
          error: error?.message || "Unknown error",
        });
      }
    },
    {
      timezone: config.dailySyncTimezone,
    }
  );
}
