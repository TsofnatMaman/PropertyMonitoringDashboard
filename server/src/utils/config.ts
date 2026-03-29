const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  port: toNumber(process.env.PORT, 3000),

  logLevel: String(process.env.LOG_LEVEL || "info").trim().toLowerCase(),

  scrapeTimeoutMs: toNumber(process.env.SCRAPE_TIMEOUT_MS, 15000),
  scrapeRetryAttempts: toNumber(process.env.SCRAPE_RETRY_ATTEMPTS, 3),
  scrapeRetryBaseDelayMs: toNumber(
    process.env.SCRAPE_RETRY_BASE_DELAY_MS,
    750
  ),

  dailySyncCron: String(process.env.DAILY_SYNC_CRON || "0 2 * * *").trim(),
  dailySyncTimezone: String(
    process.env.DAILY_SYNC_TIMEZONE || "Asia/Jerusalem"
  ).trim(),
};
