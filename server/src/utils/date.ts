function buildIsoUtcString(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
) {
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
}

function parseUsDateTime(value: string): string | null {
  const raw = value.trim();

  const withTimeMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i
  );

  if (!withTimeMatch) {
    return null;
  }

  const [, monthRaw, dayRaw, yearRaw, hourRaw, minuteRaw, secondRaw, ampmRaw] =
    withTimeMatch;

  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const year = Number(yearRaw);

  let hour = Number(hourRaw || 0);
  const minute = Number(minuteRaw || 0);
  const second = Number(secondRaw || 0);

  const ampm = String(ampmRaw || "").toUpperCase();

  if (ampm) {
    if (ampm === "AM" && hour === 12) {
      hour = 0;
    } else if (ampm === "PM" && hour < 12) {
      hour += 12;
    }
  }

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  return buildIsoUtcString(year, month, day, hour, minute, second);
}

export function normalizeToIsoString(value?: string | null): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const parsedUs = parseUsDateTime(raw);
  if (parsedUs) {
    return parsedUs;
  }

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  return null;
}

export function toTimestamp(value?: string | null): number {
  const iso = normalizeToIsoString(value);
  if (!iso) return Number.NEGATIVE_INFINITY;

  const timestamp = new Date(iso).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

