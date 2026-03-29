import { config } from "../../utils/config";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

function normalizeLevel(value?: string | null): LogLevel {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "DEBUG") return "DEBUG";
  if (normalized === "INFO") return "INFO";
  if (normalized === "WARN") return "WARN";
  if (normalized === "ERROR") return "ERROR";
  return "INFO";
}

const configuredLevel = normalizeLevel(config.logLevel);

function formatMeta(meta?: unknown) {
  if (meta == null) return "";

  if (meta instanceof Error) {
    return ` | error=${meta.message}\n${meta.stack ?? ""}`;
  }

  try {
    return ` | meta=${JSON.stringify(meta)}`;
  } catch {
    return ` | meta=[unserializable]`;
  }
}

function write(level: LogLevel, message: string, meta?: unknown) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[configuredLevel]) {
    return;
  }

  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}${formatMeta(meta)}`;

  if (level === "ERROR") {
    console.error(line);
    return;
  }

  if (level === "WARN") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug(message: string, meta?: unknown) {
    write("DEBUG", message, meta);
  },

  info(message: string, meta?: unknown) {
    write("INFO", message, meta);
  },

  warn(message: string, meta?: unknown) {
    write("WARN", message, meta);
  },

  error(message: string, meta?: unknown) {
    write("ERROR", message, meta);
  },
};
