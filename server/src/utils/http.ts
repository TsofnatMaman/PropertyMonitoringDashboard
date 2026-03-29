import type { Response } from "express";
import { logger } from "../services/system/logger.service";
import { config } from "./config";

export function sendServerError(
  res: Response,
  message: string,
  error: unknown
) {
  const details =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Unknown error";

  logger.error(message, error ?? details);

  if (config.isProduction) {
    return res.status(500).json({
      error: message,
    });
  }

  return res.status(500).json({
    error: message,
    details,
  });
}
