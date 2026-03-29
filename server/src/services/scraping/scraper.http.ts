import axios from "axios";
import { config } from "../../utils/config";
import { logger } from "../system/logger.service";
import { getHtmlLength } from "./scraper.utils";

const httpClient = axios.create({
  timeout: config.scrapeTimeoutMs,
  validateStatus: (status) => status >= 200 && status < 400,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Cache-Control": "max-age=0",
  },
});

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function isRetryableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  if (status != null) {
    return RETRYABLE_STATUS.has(status);
  }

  const code = error.code || "";
  return (
    code === "ECONNABORTED" ||
    code === "ECONNRESET" ||
    code === "EAI_AGAIN" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT"
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getWithRetry(url: string) {
  const maxAttempts = Math.max(1, config.scrapeRetryAttempts);
  const sanitizedUrl = url.replace(/([?&]APN=)\d+/i, "$1***REDACTED***");
  const overallStartTime = Date.now();

  logger.info("Scrape request initiated", {
    url: sanitizedUrl,
    timeout: `${config.scrapeTimeoutMs}ms`,
    maxRetries: maxAttempts,
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startTime = Date.now();

    try {
      logger.debug("Scrape attempt started", {
        url: sanitizedUrl,
        attempt,
        maxAttempts,
        timeout: `${config.scrapeTimeoutMs}ms`,
      });

      const response = await httpClient.get(url);
      const attemptDuration = Date.now() - startTime;
      const totalDuration = Date.now() - overallStartTime;
      const htmlLength = getHtmlLength(response.data);
      const finalUrl =
        response?.request?.res?.responseUrl ||
        response?.request?.responseURL ||
        response?.config?.url ||
        null;

      logger.info("Scrape request succeeded", {
        url: sanitizedUrl,
        attempt,
        maxAttempts,
        finalUrl,
        redirected: finalUrl ? finalUrl !== url : false,
        status: response.status,
        attemptDuration: `${attemptDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        htmlLength,
        contentType: response.headers?.["content-type"] ?? null,
      });

      return response;
    } catch (error: unknown) {
      const attemptDuration = Date.now() - startTime;
      const totalDuration = Date.now() - overallStartTime;
      const axiosError = axios.isAxiosError(error) ? error : null;
      const retryable = isRetryableError(error);
      const shouldRetry = retryable && attempt < maxAttempts;

      const errorDetails: Record<string, unknown> = {
        attempt,
        maxAttempts,
        attemptDuration: `${attemptDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        code: axiosError?.code || "UNKNOWN",
        message:
          axiosError?.message ||
          (error instanceof Error ? error.message : "Unknown error"),
        status: axiosError?.response?.status || "N/A",
        statusText: axiosError?.response?.statusText || "N/A",
        retryable,
        shouldRetry,
      };

      if (axiosError?.response) {
        errorDetails.responseHeaders = axiosError.response.headers;
        errorDetails.responseDataSize = `${getHtmlLength(
          axiosError.response.data
        )} bytes`;
      }

      if (axiosError?.code === "ECONNABORTED") {
        errorDetails.reason = `Timeout after ${config.scrapeTimeoutMs}ms`;
      } else if (axiosError?.code === "ECONNRESET") {
        errorDetails.reason = "Connection reset by server";
      } else if (axiosError?.code === "ETIMEDOUT") {
        errorDetails.reason = "Socket timeout (network issue)";
      } else if (axiosError?.code === "ENOTFOUND") {
        errorDetails.reason =
          "DNS resolution failed (cannot reach housingapp.lacity.org)";
      } else if (axiosError?.code === "EAI_AGAIN") {
        errorDetails.reason = "Temporary DNS resolution failure";
      }

      logger.warn("Scrape attempt failed", {
        url: sanitizedUrl,
        ...errorDetails,
      });

      if (!shouldRetry) {
        logger.error("Scrape retries exhausted", {
          url: sanitizedUrl,
          totalDuration: `${totalDuration}ms`,
          lastError: errorDetails.message,
          reason: errorDetails.reason,
        });
        throw error;
      }

      const delayMs =
        config.scrapeRetryBaseDelayMs * Math.pow(2, attempt - 1);

      logger.info("Scrape retry scheduled", {
        url: sanitizedUrl,
        delayMs,
        nextAttempt: attempt + 1,
        maxAttempts,
      });

      await sleep(delayMs);
    }
  }

  throw new Error("Failed to fetch URL after retries");
}
