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

  logger.info(`נ” INITIATING SCRAPE REQUEST (attempt 1/${maxAttempts})`, {
    url: sanitizedUrl,
    timeout: `${config.scrapeTimeoutMs}ms`,
    maxRetries: maxAttempts,
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startTime = Date.now();

    try {
      logger.debug(`[${attempt}/${maxAttempts}] Sending request...`, {
        url: sanitizedUrl,
        timeout: `${config.scrapeTimeoutMs}ms`,
      });

      const response = await httpClient.get(url);
      const duration = Date.now() - startTime;
      const htmlLength = getHtmlLength(response.data);
      const finalUrl =
        response?.request?.res?.responseUrl ||
        response?.request?.responseURL ||
        response?.config?.url ||
        null;

      logger.info(`ג… SUCCESS on attempt ${attempt}/${maxAttempts}`, {
        url: sanitizedUrl,
        finalUrl,
        redirected: finalUrl ? finalUrl !== url : false,
        status: response.status,
        duration: `${duration}ms`,
        htmlLength,
        contentType: response.headers?.["content-type"] ?? null,
      });

      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const retryable = isRetryableError(error);
      const shouldRetry = retryable && attempt < maxAttempts;

      const errorDetails: Record<string, any> = {
        attempt,
        maxAttempts,
        duration: `${duration}ms`,
        code: error?.code || "UNKNOWN",
        message: error?.message || "Unknown error",
        status: error?.response?.status || "N/A",
        statusText: error?.response?.statusText || "N/A",
        retryable,
        shouldRetry,
      };

      if (error?.response) {
        errorDetails.responseHeaders = error.response.headers;
        errorDetails.responseDataSize = `${getHtmlLength(error.response.data)} bytes`;
      }

      if (error?.code === "ECONNABORTED") {
        errorDetails.reason =
          "ג±ן¸ TIMEOUT: Request took longer than " + config.scrapeTimeoutMs + "ms";
      } else if (error?.code === "ECONNRESET") {
        errorDetails.reason = "נ” Connection reset by server";
      } else if (error?.code === "ETIMEDOUT") {
        errorDetails.reason = "ג±ן¸ Socket timeout (network issue)";
      } else if (error?.code === "ENOTFOUND") {
        errorDetails.reason =
          "נ DNS resolution failed (cannot reach housingapp.lacity.org)";
      } else if (error?.code === "EAI_AGAIN") {
        errorDetails.reason = "נ Temporary DNS failure";
      }

      logger.warn(`ג FAILED on attempt ${attempt}/${maxAttempts}`, {
        url: sanitizedUrl,
        ...errorDetails,
      });

      if (!shouldRetry) {
        logger.error(`נ’€ ALL ${maxAttempts} ATTEMPTS EXHAUSTED`, {
          url: sanitizedUrl,
          totalDuration: `${duration}ms`,
          lastError: error?.message,
          reason: errorDetails.reason,
        });
        throw error;
      }

      const delayMs =
        config.scrapeRetryBaseDelayMs * Math.pow(2, attempt - 1);

      logger.info(
        `ג³ WAITING ${delayMs}ms before next attempt (${attempt + 1}/${maxAttempts})`,
        {
          url: sanitizedUrl,
        }
      );

      await sleep(delayMs);
    }
  }

  throw new Error("Failed to fetch URL after retries");
}
