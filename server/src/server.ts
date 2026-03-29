import app from "./app";
import { startDailySyncJob } from "./jobs/daily-sync.job";
import { logger } from "./services/system/logger.service";
import { config } from "./utils/config";

app.listen(config.port, () => {
  logger.info(`Server listening on http://localhost:${config.port}`);
  startDailySyncJob();
});
